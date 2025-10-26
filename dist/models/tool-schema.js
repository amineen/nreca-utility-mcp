"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyPaymentTotalsResponseSchema = exports.CustomerCountResponseSchema = exports.GetMonthlyPaymentTotalsSchema = exports.GetCustomersCountSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("./types");
// Zod Schema for MCP Tools
exports.GetCustomersCountSchema = zod_1.z
    .object({
    utility: zod_1.z
        .string()
        .min(24, "Utility ID must be 24 characters long")
        .max(24, "Utility ID must be 24 characters long")
        .describe("The ID of the utility to get the customers count for"),
    allCustomers: zod_1.z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to include all customers. If not provided, only active customers will be fetched."),
})
    .strict();
exports.GetMonthlyPaymentTotalsSchema = zod_1.z
    .object({
    utility: zod_1.z
        .string()
        .min(24, "Utility ID must be 24 characters long")
        .max(24, "Utility ID must be 24 characters long")
        .describe("The ID of the utility to get the monthly payment totals for"),
    month: zod_1.z
        .string()
        .min(7, "Month must be in the format YYYY-MM")
        .max(7, "Month must be in the format YYYY-MM")
        .describe("The month to get the monthly payment totals for"),
})
    .strict();
//Response Schemas for the MCP Tools
exports.CustomerCountResponseSchema = zod_1.z
    .object({
    totalCustomers: zod_1.z.number(),
    customerType: zod_1.z
        .object({
        [types_1.CustomerTypes.RESIDENTIAL]: zod_1.z.number(),
        [types_1.CustomerTypes.COMMERCIAL]: zod_1.z.number(),
        [types_1.CustomerTypes.INDUSTRIAL]: zod_1.z.number(),
        [types_1.CustomerTypes.PUBLIC_FACILITY]: zod_1.z.number(),
        [types_1.CustomerTypes.OTHER]: zod_1.z.number(),
    })
        .optional(),
})
    .strict();
exports.MonthlyPaymentTotalsResponseSchema = zod_1.z.array(zod_1.z
    .object({
    totalAmount: zod_1.z.number(),
    totalKWh: zod_1.z.number(),
    customer_type: zod_1.z.string(),
    currency: zod_1.z.string(),
})
    .strict());
//# sourceMappingURL=tool-schema.js.map