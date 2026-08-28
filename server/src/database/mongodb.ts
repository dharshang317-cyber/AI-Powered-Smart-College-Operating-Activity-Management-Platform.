import mongoose from 'mongoose';

export async function connectMongoDB(uri?: string): Promise<boolean> {
  const mongoUri = uri || process.env.MONGODB_URI || process.env.MONGO_URL;

  if (!mongoUri) {
    console.log('ℹ️ MONGODB_URI not provided; running on optimized local SQLite engine.');
    return false;
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true,
    });

    console.log('🍃 Connected to MongoDB successfully!');
    return true;
  } catch (err: any) {
    console.error('⚠️ MongoDB connection warning:', err.message || err);
    console.log('Falling back to local SQLite engine to guarantee 100% uptime.');
    return false;
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectMongoDB(): Promise<void> {
  if (isMongoConnected()) {
    await mongoose.disconnect();
  }
}
