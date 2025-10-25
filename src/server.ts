import express from "express";
import dotenv from "dotenv";
import { env } from "process";
import { Server } from "@modelcontextprotocol/sdk/server/index";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types";
import { connectToDatabase } from "./configurations/db-config";
import { getCustomersCount } from "./services/mongodb-service";

dotenv.config();

connectToDatabase();

const app = express();

app.use(express.json());

const mcpServer = new Server(
  {
    name: "NRECA Utility MCP",
    version: "1.0.0",
    description: "MCP server for NRECA Utility Platform",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const PORT = env.PORT || 8085;

if (env.NODE_ENV === "development") {
  console.info(
    "\x1b[32m%s\x1b[0m",
    `✅ Server is running on http://localhost:${PORT}`
  );
}

export default app;
