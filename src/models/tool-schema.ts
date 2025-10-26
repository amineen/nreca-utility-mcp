import { z } from "zod";
import { CustomerTypes, CustomerType } from "./types";

// Zod Schema for MCP Tools
export const GetCustomersCountSchema = z
  .object({
    utility: z
      .string()
      .min(24, "Utility ID must be 24 characters long")
      .max(24, "Utility ID must be 24 characters long")
      .describe("The ID of the utility to get the customers count for"),
    allCustomers: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Whether to include all customers. If not provided, only active customers will be fetched."
      ),
  })
  .strict();

export const GetMonthlyPaymentTotalsSchema = z
  .object({
    utility: z
      .string()
      .min(24, "Utility ID must be 24 characters long")
      .max(24, "Utility ID must be 24 characters long")
      .describe("The ID of the utility to get the monthly payment totals for"),
    month: z
      .string()
      .min(7, "Month must be in the format YYYY-MM")
      .max(7, "Month must be in the format YYYY-MM")
      .describe("The month to get the monthly payment totals for"),
  })
  .strict();

// TypeScript Types Inferred from Zod Schemas
export type GetCustomersCountRequest = z.infer<typeof GetCustomersCountSchema>;
export type GetMonthlyPaymentTotalsRequest = z.infer<
  typeof GetMonthlyPaymentTotalsSchema
>;

//Response Schemas for the MCP Tools
export const CustomerCountResponseSchema = z
  .object({
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

export const MonthlyPaymentTotalsResponseSchema = z.array(
  z
    .object({
      totalAmount: z.number(),
      totalKWh: z.number(),
      customer_type: z.string(),
      currency: z.string(),
    })
    .strict()
);

// TypeScript Types Inferred from Response Schemas
export type CustomerCountResponse = z.infer<typeof CustomerCountResponseSchema>;
export type MonthlyPaymentTotalsResponse = z.infer<
  typeof MonthlyPaymentTotalsResponseSchema
>;
