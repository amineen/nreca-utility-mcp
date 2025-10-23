import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

type DBConfig = {
  uri: string | undefined;
  options: mongoose.ConnectOptions;
};

const config: DBConfig = {
  uri: process.env.MONGODB_URI,
  options: {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  },
};

let isConnected = false;

export async function connectToDatabase(): Promise<void> {
  if (isConnected) {
    console.log("Using existing database connection");
    return;
  }

  try {
    if (!config.uri) {
      console.error("❌ MongoDB connection error: MongoDB URI is not set");
      return;
    }
    await mongoose.connect(config.uri, config.options);
    isConnected = true;
    console.log("✅ MongoDB connected successfully");

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("❌ MongoDB disconnected");
      isConnected = false;
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    isConnected = false;
    throw error;
  }
}

export function isDBConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log("MongoDB connection closed");
  }
}
