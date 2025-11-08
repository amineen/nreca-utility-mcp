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
    .describe(
      "Whether to include all customers. If not provided, only active customers will be fetched."
    ),
}).strict();

export const GetMonthlyPaymentTotalsSchema = GetUtilityInfoRequestSchema.extend(
  {
    month: z
      .string()
      .min(7, "Month must be in the format YYYY-MM")
      .max(7, "Month must be in the format YYYY-MM")
      .describe("The month to get the monthly payment totals for"),
  }
).strict();

export const GetDailyDataSummarySchema = GetUtilityInfoRequestSchema.extend({
  date: z
    .string()
    .min(10, "Date must be in the format YYYY-MM-DD")
    .max(10, "Date must be in the format YYYY-MM-DD")
    .describe("The date to get the daily data summary for"),
}).strict();

export const GetMonthlyEnergySummarySchema = GetUtilityInfoRequestSchema.extend(
  {
    month: z
      .string()
      .min(7, "Month must be in the format YYYY-MM")
      .max(7, "Month must be in the format YYYY-MM")
      .describe("The month to get the monthly energy summary for"),
  }
).strict();

export const GetDailyEnergySummarySchema = GetUtilityInfoRequestSchema.extend({
  date: z
    .string()
    .min(10, "Date must be in the format YYYY-MM-DD")
    .max(10, "Date must be in the format YYYY-MM-DD")
    .describe("The date to get the daily energy summary for"),
}).strict();

export const GetYearlyEnergySummarySchema = GetUtilityInfoRequestSchema.extend({
  year: z
    .string()
    .min(4, "Year must be in the format YYYY")
    .max(4, "Year must be in the format YYYY")
    .describe("The year to get the yearly energy summary for"),
}).strict();

// TypeScript Types Inferred from Zod Schemas
export type GetCustomersCountRequest = z.infer<typeof GetCustomersCountSchema>;
export type GetMonthlyPaymentTotalsRequest = z.infer<
  typeof GetMonthlyPaymentTotalsSchema
>;
export type GetUtilityInfoRequest = z.infer<typeof GetUtilityInfoRequestSchema>;
export type GetDailyDataSummaryRequest = z.infer<
  typeof GetDailyDataSummarySchema
>;
export type GetMonthlyEnergySummaryRequest = z.infer<
  typeof GetMonthlyEnergySummarySchema
>;
export type GetDailyEnergySummaryRequest = z.infer<
  typeof GetDailyEnergySummarySchema
>;
export type GetYearlyEnergySummaryRequest = z.infer<
  typeof GetYearlyEnergySummarySchema
>;

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
      .describe(
        "The description of the generation technology used by the utility"
      ),
    systemComponents: z.array(
      z.object({
        component: z.string().describe("The component of the system"),
        capacity: z.number().describe("The capacity of the system component"),
        unit: z.string().describe("The unit of the component's capacity"),
      })
    ),
  })
  .strict();

export type UtilityInfoResponse = z.infer<typeof UtilityInfoResponseSchema>;

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

export const DailyPaymentTotalsResponseSchema = z.array(
  z
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
    .strict()
);

export const MonthlyEnergySummaryResponseSchema = z
  .object({
    month: z.string().describe("The month of the monthly energy summary"),
    totalKWh: z
      .number()
      .describe("The total kWh consumed by all customers in the month"),
    consumptionByCustomerType: z
      .object({
        [CustomerTypes.RESIDENTIAL]: z.number(),
        [CustomerTypes.COMMERCIAL]: z.number(),
        [CustomerTypes.INDUSTRIAL]: z.number(),
        [CustomerTypes.PUBLIC_FACILITY]: z.number(),
        [CustomerTypes.OTHER]: z.number(),
      })
      .describe("The consumption by customer type in the month"),
    topConsumers: z.array(
      z.object({
        customerName: z.string().describe("The name of the customer"),
        totalKWh: z
          .number()
          .describe("The total kWh consumed by the customer in the month"),
      })
    ),
  })
  .strict();

export const DailyEnergySummaryResponseSchema = z
  .object({
    date: z.string().describe("The date of the daily energy summary"),
    totalKWh: z
      .number()
      .describe("The total kWh consumed by all customers in the day"),
    consumptionByCustomerType: z
      .object({
        [CustomerTypes.RESIDENTIAL]: z.number(),
        [CustomerTypes.COMMERCIAL]: z.number(),
        [CustomerTypes.INDUSTRIAL]: z.number(),
        [CustomerTypes.PUBLIC_FACILITY]: z.number(),
        [CustomerTypes.OTHER]: z.number(),
      })
      .describe("The consumption by customer type in the day"),
  })
  .strict();

export const YearlyEnergySummaryResponseSchema = z
  .object({
    monthlyConsumption: z
      .array(
        z
          .object({
            month: z
              .string()
              .describe("The month of the yearly energy summary"),
            totalKWh: z
              .number()
              .describe("The total kWh consumed by all customers in the month"),
            consumptionByCustomerType: z
              .object({
                [CustomerTypes.RESIDENTIAL]: z.number(),
                [CustomerTypes.COMMERCIAL]: z.number(),
                [CustomerTypes.INDUSTRIAL]: z.number(),
                [CustomerTypes.PUBLIC_FACILITY]: z.number(),
                [CustomerTypes.OTHER]: z.number(),
              })
              .describe("The consumption by customer type in the month"),
          })
          .strict()
      )
      .describe("The monthly consumption for a given year"),
    topConsumers: z
      .array(
        z.object({
          customerName: z.string().describe("The name of the customer"),
          totalKWh: z
            .number()
            .describe("The total kWh consumed by the customer in the month"),
        })
      )
      .describe("The top consumers for a given year"),
  })
  .strict();

// TypeScript Types Inferred from Response Schemas
export type CustomerCountResponse = z.infer<typeof CustomerCountResponseSchema>;
export type MonthlyPaymentTotalsResponse = z.infer<
  typeof MonthlyPaymentTotalsResponseSchema
>;
export type MonthlyEnergySummaryResponse = z.infer<
  typeof MonthlyEnergySummaryResponseSchema
>;
export type DailyEnergySummaryResponse = z.infer<
  typeof DailyEnergySummaryResponseSchema
>;
export type YearlyEnergySummaryResponse = z.infer<
  typeof YearlyEnergySummaryResponseSchema
>;
