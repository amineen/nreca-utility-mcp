import express from "express";
import dotenv from "dotenv";
import { env } from "process";
import { Server } from "@modelcontextprotocol/sdk/server/index";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types";
import { connectToDatabase } from "./configurations/db-config";
import {
  getCustomersCount,
  getMonthlyPaymentTotals,
} from "./services/mongodb-service";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CustomerCountResponseSchema,
  GetCustomersCountSchema,
  GetMonthlyPaymentTotalsSchema,
  MonthlyPaymentTotalsResponseSchema,
} from "./models/tool-schema";
import { ZodError } from "zod";

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

//Register tool list handler with Zod generated schema
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "getCustomersCount",
        description: "Get the number of customers for a given utility",
        inputSchema: zodToJsonSchema(GetCustomersCountSchema, {
          name: "getCustomersCount",
          $refStrategy: "none",
        }),
      },
      {
        name: "getMonthlyPaymentTotals",
        description: "Get the monthly payment totals for a given utility",
        inputSchema: zodToJsonSchema(GetMonthlyPaymentTotalsSchema, {
          name: "getMonthlyPaymentTotals",
          $refStrategy: "none",
        }),
      },
    ],
  };
});

// Helper function to format validation errors
function formatZodError(error: ZodError): string {
  return error.errors
    .map((err) => `${err.path.join(".")}: ${err.message}`)
    .join("; ");
}

//Register tool call handler with Zod validation
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "getCustomersCount": {
        //validate args with zod
        const validatedArgs = GetCustomersCountSchema.parse(args);
        //call the service
        const result = await getCustomersCount(validatedArgs);
        //validate the outpu with zod
        const validatedResult = CustomerCountResponseSchema.parse(result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(validatedResult, null, 2),
            },
          ],
        };
      }

      case "getMonthlyPaymentTotals": {
        //validate args with zod
        const validatedArgs = GetMonthlyPaymentTotalsSchema.parse(args);
        //call the service
        const result = await getMonthlyPaymentTotals(validatedArgs);
        //validate the output with zod
        const validatedResult =
          MonthlyPaymentTotalsResponseSchema.parse(result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(validatedResult, null, 2),
            },
          ],
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errorMessage = formatZodError(error);
      console.error("Validation error:", errorMessage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Validation error",
                details: errorMessage,
                issues: error.errors,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    // Handle other errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Tool execution error:", errorMessage);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

const PORT = env.PORT || 8085;

if (env.NODE_ENV === "development") {
  console.info(
    "\x1b[32m%s\x1b[0m",
    `✅ Server is running on http://localhost:${PORT}`
  );
}

export default app;
