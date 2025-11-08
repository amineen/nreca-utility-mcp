import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { env } from "process";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  connectToDatabase,
  isDBConnected,
} from "./configurations/db-config.js";
import {
  getCustomersCount,
  getDailyEnergySummary,
  getMonthlyEnergySummary,
  getMonthlyPaymentTotals,
  getUtilityInfo,
  getYearlyEnergySummary,
} from "./services/mongodb-service.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CustomerCountResponseSchema,
  DailyEnergySummaryResponseSchema,
  GetCustomersCountSchema,
  GetDailyEnergySummarySchema,
  GetMonthlyEnergySummarySchema,
  GetMonthlyPaymentTotalsSchema,
  GetUtilityInfoRequestSchema,
  GetYearlyEnergySummarySchema,
  MonthlyEnergySummaryResponseSchema,
  MonthlyPaymentTotalsResponseSchema,
  UtilityInfoResponseSchema,
  YearlyEnergySummaryResponseSchema,
} from "./models/tool-schema.js";
import { MCPToolName, MCPToolNames } from "./services/util.js";
import { ZodError } from "zod";

dotenv.config();

connectToDatabase();

const app = express();

app.use(express.json());

//TODO: Testing MongoDB Services

// getDailyEnergySummary({
//   utilityId: "679dc04aac3872bc0b6fff25",
//   date: "2025-03-01",
// }).then((result) => {
//   console.log(result);
// });

//add a root route to provide welcome message and information about the server
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to the NRECA Utility MCP",
    version: "1.0.0",
    description: "MCP server for NRECA Utility Platform",
    developer: "Aaron Mineen",
    github: "https://github.com/amineen/nreca-utility-mcp",
  });
});

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
        name: MCPToolNames.GET_UTILITY_INFO,
        description:
          "Get the information like utility name, acronym, country, system type, system description, and system components about a given utility",
        inputSchema: zodToJsonSchema(GetUtilityInfoRequestSchema, {
          name: MCPToolNames.GET_UTILITY_INFO,
          $refStrategy: "none",
        }),
      },
      {
        name: MCPToolNames.GET_CUSTOMERS_COUNT,
        description: "Get the number of customers for a given utility",
        inputSchema: zodToJsonSchema(GetCustomersCountSchema, {
          name: MCPToolNames.GET_CUSTOMERS_COUNT,
          $refStrategy: "none",
        }),
      },
      {
        name: MCPToolNames.GET_MONTHLY_ENERGY_SUMMARY,
        description: "Get the monthly energy summary for a given utility.",
        inputSchema: zodToJsonSchema(GetMonthlyEnergySummarySchema, {
          name: MCPToolNames.GET_MONTHLY_ENERGY_SUMMARY,
          $refStrategy: "none",
        }),
      },
      {
        name: MCPToolNames.GET_DAILY_ENERGY_SUMMARY,
        description: "Get the daily energy summary for a given utility.",
        inputSchema: zodToJsonSchema(GetDailyEnergySummarySchema, {
          name: MCPToolNames.GET_DAILY_ENERGY_SUMMARY,
          $refStrategy: "none",
        }),
      },
      {
        name: MCPToolNames.GET_MONTHLY_PAYMENT_TOTALS,
        description: "Get the monthly payment totals for a given utility",
        inputSchema: zodToJsonSchema(GetMonthlyPaymentTotalsSchema, {
          name: MCPToolNames.GET_MONTHLY_PAYMENT_TOTALS,
          $refStrategy: "none",
        }),
      },
      {
        name: MCPToolNames.GET_YEARLY_ENERGY_SUMMARY,
        description:
          "Get the yearly energy summary for a given utility. Returns monthly consumption data for all 12 months and top consumers for the year.",
        inputSchema: zodToJsonSchema(GetYearlyEnergySummarySchema, {
          name: MCPToolNames.GET_YEARLY_ENERGY_SUMMARY,
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
    switch (name as MCPToolName) {
      case MCPToolNames.GET_CUSTOMERS_COUNT: {
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

      case MCPToolNames.GET_UTILITY_INFO: {
        //validate args with zod
        const validatedArgs = GetUtilityInfoRequestSchema.parse(args);
        //call the service
        const result = await getUtilityInfo(validatedArgs);
        //validate the output with zod
        const validatedResult = UtilityInfoResponseSchema.parse(result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(validatedResult, null, 2),
            },
          ],
        };
      }

      case MCPToolNames.GET_MONTHLY_PAYMENT_TOTALS: {
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

      case MCPToolNames.GET_MONTHLY_ENERGY_SUMMARY: {
        //validate args with zod
        const validatedArgs = GetMonthlyEnergySummarySchema.parse(args);
        //call the service
        const result = await getMonthlyEnergySummary(validatedArgs);
        //validate the output with zod
        const validatedResult =
          MonthlyEnergySummaryResponseSchema.parse(result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(validatedResult, null, 2),
            },
          ],
        };
      }

      case MCPToolNames.GET_DAILY_ENERGY_SUMMARY: {
        //validate args with zod
        const validatedArgs = GetDailyEnergySummarySchema.parse(args);
        //call the service
        const result = await getDailyEnergySummary(validatedArgs);
        //validate the output with zod
        const validatedResult = DailyEnergySummaryResponseSchema.parse(result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(validatedResult, null, 2),
            },
          ],
        };
      }

      case MCPToolNames.GET_YEARLY_ENERGY_SUMMARY: {
        //validate args with zod
        const validatedArgs = GetYearlyEnergySummarySchema.parse(args);
        //call the service
        const result = await getYearlyEnergySummary(validatedArgs);
        //validate the output with zod
        const validatedResult = YearlyEnergySummaryResponseSchema.parse(result);
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

//Stateless HTTP endpoint-per-request transport pattern
app.post("/mcp", async (req: Request, res: Response) => {
  try {
    //create a new transport for this request (stateless - no session)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    //connect the transport to the MCP server
    await mcpServer.connect(transport);

    //clean up the transport when the request closes
    req.on("close", async () => {
      await transport.close();
      await mcpServer.close();
    });

    //Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// Health check endpoint
app.get("/health", (_, res: Response) => {
  res.json({
    status: "healthy",
    database: isDBConnected() ? "connected" : "disconnected",
    server: "NRECA Utility MCP",
    version: "1.0.0",
  });
});

const PORT = env.PORT || 8085;

async function startServer() {
  try {
    // Connect to MongoDB on startup
    await connectToDatabase();

    app.listen(PORT, () => {
      console.info(
        "\x1b[32m%s\x1b[0m",
        `✅ Server is running on http://localhost:${PORT}`
      );
      console.info(
        "\x1b[32m%s\x1b[0m",
        `✅ MCP endpoint: http://localhost:${PORT}/mcp`
      );
      console.info(
        "\x1b[32m%s\x1b[0m",
        `✅ Health check: http://localhost:${PORT}/health`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
