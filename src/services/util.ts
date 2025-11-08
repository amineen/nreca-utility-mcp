export const MCPToolNames = {
  GET_CUSTOMERS_COUNT: "getCustomersCount",
  GET_MONTHLY_PAYMENT_TOTALS: "getMonthlyPaymentTotals",
  GET_UTILITY_INFO: "getUtilityInfo",
  GET_DAILY_DATA_SUMMARY: "getDailyDataSummary",
  GET_MONTHLY_ENERGY_SUMMARY: "getMonthlyEnergySummary",
  GET_DAILY_ENERGY_SUMMARY: "getDailyEnergySummary",
  GET_YEARLY_ENERGY_SUMMARY: "getYearlyEnergySummary",
};

export type MCPToolName = (typeof MCPToolNames)[keyof typeof MCPToolNames];
