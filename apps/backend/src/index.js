// Models initialisieren
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

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/hdl';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672';

let amqpChannel = null;

async function startServer() {
  try {
    // MongoDB verbinden
    await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');


    // RabbitMQ verbinden mit Retry
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

    // Middleware: Channel in req injizieren
    app.use((req, res, next) => {
      req.amqpChannel = amqpChannel;
      next();
    });

    app.use(cors());
    app.use(express.json());
    app.use('/api', apiRoutes);

    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

startServer();
