import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(uri = env.MONGO_URI) {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });

  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
