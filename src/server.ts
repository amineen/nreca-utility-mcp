import express from "express";
import dotenv from "dotenv";
import { env } from "process";
import { connectToDatabase } from "./configurations/db-config";

dotenv.config();

connectToDatabase();

const app = express();

app.use(express.json());

const PORT = env.PORT || 8085;

if (env.NODE_ENV === "development") {
  console.info(
    "\x1b[32m%s\x1b[0m",
    `✅ Server is running on http://localhost:${PORT}`
  );
}

export default app;
