import { z } from "zod";
import { CustomerTypes } from "./types.js";
// Zod Schema for MCP Tools
// Reusable utility ID schema
export const GetUtilityInfoRequestSchema = z.object({
    utilityId: z
        .string()
        .min(24, "Utility ID must be 24 characters long")
        .max(24, "Utility ID must be 24 characters long")
        .describe("The ID of the utility"),
});
export const GetCustomersCountSchema = GetUtilityInfoRequestSchema.extend({
    allCustomers: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to include all customers. If not provided, only active customers will be fetched."),
}).strict();
export const GetMonthlyPaymentTotalsSchema = GetUtilityInfoRequestSchema.extend({
    month: z
        .string()
        .min(7, "Month must be in the format YYYY-MM")
        .max(7, "Month must be in the format YYYY-MM")
        .describe("The month to get the monthly payment totals for"),
}).strict();
export const GetDailyDataSummarySchema = GetUtilityInfoRequestSchema.extend({
    date: z
        .string()
        .min(10, "Date must be in the format YYYY-MM-DD")
        .max(10, "Date must be in the format YYYY-MM-DD")
        .describe("The date to get the daily data summary for"),
}).strict();
//Response Schemas for the MCP Tools
export const UtilityInfoResponseSchema = z
    .object({
    name: z.string().describe("The name of the utility"),
    acronym: z.string().describe("The acronym of the utility"),
    country: z.string().describe("The country where the utility is located"),
    systemType: z
        .string()
        .describe("The generation technology used by the utility"),
    systemDescription: z
        .string()
        .describe("The description of the generation technology used by the utility"),
    systemComponents: z.array(z.object({
        component: z.string().describe("The component of the system"),
        capacity: z.number().describe("The capacity of the system component"),
        unit: z.string().describe("The unit of the component's capacity"),
    })),
})
    .strict();
export const CustomerCountResponseSchema = z
    .object({
    utilityInfo: UtilityInfoResponseSchema,
    totalCustomers: z.number(),
    customerType: z
        .object({
        [CustomerTypes.RESIDENTIAL]: z.number(),
        [CustomerTypes.COMMERCIAL]: z.number(),
        [CustomerTypes.INDUSTRIAL]: z.number(),
        [CustomerTypes.PUBLIC_FACILITY]: z.number(),
        [CustomerTypes.OTHER]: z.number(),
    })
        .optional(),
})
    .strict();
export const MonthlyPaymentTotalsResponseSchema = z.array(z
    .object({
    totalAmount: z.number(),
    totalKWh: z.number(),
    customer_type: z.string(),
    currency: z.string(),
})
    .strict());
export const DailyPaymentTotalsResponseSchema = z.array(z
    .object({
    date: z.string().describe("The date of the daily payment totals"),
    totalAmount: z
        .number()
        .describe("The total amount of the daily payment totals"),
    totalKWh: z
        .number()
        .describe("The total kWh of the daily payment totals"),
    customer_type: z
        .string()
        .describe("The customer type of the daily payment totals"),
})
    .strict());
//# sourceMappingURL=tool-schema.js.map