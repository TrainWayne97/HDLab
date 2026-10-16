// -----------------------------
// HDLab Backend – Main Server
// -----------------------------
// Initializes Express, connects MongoDB & RabbitMQ, provides API.

// Bricht den Start ab, wenn JWT_SECRET fehlt oder unsicher ist (siehe config/jwt.js)
import './config/jwt.js';

// Data models (Mongoose)
import './models/Simulation.js';
import './models/Project.js';
import './models/User.js';
import './models/Result.js';
import './models/Waveform.js';
import TutorialProgress from './models/TutorialProgress.js';
import './models/ModuleLibrary.js';
import './models/Note.js';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes.js';
import amqp from 'amqplib';

dotenv.config();

// Express app and configuration
const app = express();
app.disable('x-powered-by');
// Requests kommen über nginx (gateway): req.ip ist dann die Client-IP aus X-Forwarded-For,
// die nginx setzt (siehe docker/nginx/nginx.conf). Wird für die IP-basierten Rate-Limits gebraucht.
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

// Frontend und API laufen über denselben Origin (nginx). Fremde Origins nur, wenn sie in
// CORS_ORIGIN (kommagetrennt) stehen.
const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
const PORT = process.env.BACKEND_PORT;
const MONGO_URL = process.env.MONGO_URL;
const RABBITMQ_URL = process.env.RABBITMQ_URL;

// Check required ENV variables
['MONGO_URL', 'RABBITMQ_URL', 'BACKEND_PORT'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// Global reference to RabbitMQ channel
let amqpChannel = null;



/**
 * Starts the backend server:
 * - Connects to MongoDB (projects, simulations, users, ...)
 * - Connects to RabbitMQ (job queue for simulations)
 * - Provides REST API
 */
async function startServer() {
  try {
    // 1. Connect to MongoDB (persistent data)
    await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

    console.log('MongoDB connected');

    // Tutorial-Fortschritt ist seit Einführung der Kurse (Lehre) pro courseId
    // getrennt: Altbestand dem Verilog-Tutorial zuordnen und den alten
    // Unique-Index {userId, lessonId} entfernen (würde sonst gleiche
    // Lektionsnummern in verschiedenen Kursen blockieren).
    await TutorialProgress.updateMany(
      { courseId: { $exists: false } },
      { $set: { courseId: 'verilog' } }
    );
    await TutorialProgress.syncIndexes();

    // 2. Connect to RabbitMQ (queue for simulation jobs)
    /**
     * Establishes connection to RabbitMQ with retry logic.
     * @param {string} url - RabbitMQ URL
     * @param {number} retries - Max attempts
     * @param {number} delay - Delay between attempts (ms)
     */
    async function connectRabbitMQWithRetry(url, retries = 10, delay = 3000) {
      for (let i = 0; i < retries; i++) {
        try {
          return await amqp.connect(url);
        } catch (err) {
          console.warn(`[Backend] RabbitMQ not ready, retrying in ${delay / 1000}s... (${i + 1}/${retries})`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
      throw new Error('RabbitMQ connection failed after retries');
    }

    const amqpConn = await connectRabbitMQWithRetry(RABBITMQ_URL);
    amqpChannel = await amqpConn.createChannel();
    await amqpChannel.assertQueue('simulations', { durable: true });
    await amqpChannel.assertQueue('netlist-render', { durable: true });
    console.log('RabbitMQ connected');

    // 3. Middleware: Make channel available for all requests
    app.use((req, res, next) => {
      req.amqpChannel = amqpChannel;
      next();
    });

    // 4. Standard middleware
    app.use(cors({ origin: corsOrigins.length ? corsOrigins : false }));
    // Projects with many files (e.g. an imported CPU) exceed express' default of 100 KB.
    // Matches the frontend's import limit (10 MB content) plus JSON overhead; nginx allows the same.
    app.use(express.json({ limit: '12mb' }));
    app.use('/api', apiRoutes); // API endpoints

    // Fehler (auch ungültiges JSON, zu große Bodies) als JSON; interne Details nur ins Log
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
      const status = err.status || err.statusCode || 500;
      if (status >= 500) console.error('[Backend] Unhandled error:', err);
      res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
    });

    // 5. Start server
    app.listen(PORT, () => {
      console.log(`Backend listening on PORT ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

// Entry point
startServer();
