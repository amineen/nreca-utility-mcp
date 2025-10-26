"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const process_1 = require("process");
const index_1 = require("@modelcontextprotocol/sdk/server/index");
const streamableHttp_1 = require("@modelcontextprotocol/sdk/server/streamableHttp");
const types_1 = require("@modelcontextprotocol/sdk/types");
const db_config_1 = require("./configurations/db-config");
const mongodb_service_1 = require("./services/mongodb-service");
const zod_to_json_schema_1 = require("zod-to-json-schema");
const tool_schema_1 = require("./models/tool-schema");
const zod_1 = require("zod");
dotenv_1.default.config();
(0, db_config_1.connectToDatabase)();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const mcpServer = new index_1.Server({
    name: "NRECA Utility MCP",
    version: "1.0.0",
    description: "MCP server for NRECA Utility Platform",
}, {
    capabilities: {
        tools: {},
    },
});
//Register tool list handler with Zod generated schema
mcpServer.setRequestHandler(types_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "getCustomersCount",
                description: "Get the number of customers for a given utility",
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(tool_schema_1.GetCustomersCountSchema, {
                    name: "getCustomersCount",
                    $refStrategy: "none",
                }),
            },
            {
                name: "getMonthlyPaymentTotals",
                description: "Get the monthly payment totals for a given utility",
                inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(tool_schema_1.GetMonthlyPaymentTotalsSchema, {
                    name: "getMonthlyPaymentTotals",
                    $refStrategy: "none",
                }),
            },
        ],
    };
});
// Helper function to format validation errors
function formatZodError(error) {
    return error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
}
//Register tool call handler with Zod validation
mcpServer.setRequestHandler(types_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "getCustomersCount": {
                //validate args with zod
                const validatedArgs = tool_schema_1.GetCustomersCountSchema.parse(args);
                //call the service
                const result = await (0, mongodb_service_1.getCustomersCount)(validatedArgs);
                //validate the outpu with zod
                const validatedResult = tool_schema_1.CustomerCountResponseSchema.parse(result);
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
                const validatedArgs = tool_schema_1.GetMonthlyPaymentTotalsSchema.parse(args);
                //call the service
                const result = await (0, mongodb_service_1.getMonthlyPaymentTotals)(validatedArgs);
                //validate the output with zod
                const validatedResult = tool_schema_1.MonthlyPaymentTotalsResponseSchema.parse(result);
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
    }
    catch (error) {
        // Handle Zod validation errors
        if (error instanceof zod_1.ZodError) {
            const errorMessage = formatZodError(error);
            console.error("Validation error:", errorMessage);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: "Validation error",
                            details: errorMessage,
                            issues: error.errors,
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
        // Handle other errors
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Tool execution error:", errorMessage);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        error: errorMessage,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
});
//Stateless HTTP endpoint-per-request transport pattern
app.post("/mcp", async (req, res) => {
    try {
        //create a new transport for this request (stateless - no session)
        const transport = new streamableHttp_1.StreamableHTTPServerTransport({
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
    }
    catch (error) {
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
app.get("/health", (_, res) => {
    res.json({
        status: "healthy",
        database: (0, db_config_1.isDBConnected)() ? "connected" : "disconnected",
        server: "NRECA Utility MCP",
        version: "1.0.0",
    });
});
const PORT = process_1.env.PORT || 8085;
async function startServer() {
    try {
        // Connect to MongoDB on startup
        await (0, db_config_1.connectToDatabase)();
        app.listen(PORT, () => {
            console.info("\x1b[32m%s\x1b[0m", `✅ Server is running on http://localhost:${PORT}`);
            console.info("\x1b[32m%s\x1b[0m", `✅ MCP endpoint: http://localhost:${PORT}/mcp`);
            console.info("\x1b[32m%s\x1b[0m", `✅ Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map