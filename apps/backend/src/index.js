// -----------------------------
// HDLab Backend – Main Server
// -----------------------------
// Initializes Express, connects MongoDB & RabbitMQ, provides API.

// Data models (Mongoose)
import './models/Simulation.js';
import './models/Project.js';
import './models/User.js';
import './models/Result.js';
import './models/Waveform.js';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes.js';
import amqp from 'amqplib';

dotenv.config();

// Express app and configuration
const app = express();
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
    console.log('RabbitMQ connected');

    // 3. Middleware: Make channel available for all requests
    app.use((req, res, next) => {
      req.amqpChannel = amqpChannel;
      next();
    });

    // 4. Standard middleware
    app.use(cors());
    app.use(express.json());
    app.use('/api', apiRoutes); // API endpoints

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
