export const MCPToolNames = {
  GET_CUSTOMERS_COUNT: "getCustomersCount",
  GET_MONTHLY_PAYMENT_TOTALS: "getMonthlyPaymentTotals",
  GET_UTILITY_INFO: "getUtilityInfo",
  GET_DAILY_DATA_SUMMARY: "getDailyDataSummary",
};

export type MCPToolName = (typeof MCPToolNames)[keyof typeof MCPToolNames];
