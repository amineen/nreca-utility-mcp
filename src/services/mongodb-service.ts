import CustomerSchema from "../models/CustomerSchema";
import {
  CustomerCountResponse,
  GetCustomersCountRequest,
  GetMonthlyPaymentTotalsRequest,
  MonthlyPaymentTotalsResponse,
} from "../models/tool-schema";
import { CustomerType, CustomerTypes } from "../models/types";
import PaymentSchema from "../models/PaymentSchema";
import { Types } from "mongoose";

export const getCustomersCount = async (
  request: GetCustomersCountRequest
): Promise<CustomerCountResponse> => {
  const { utility, allCustomers } = request;

  // Build the match stage
  const matchStage: Record<string, any> = { service_area_id: utility };
  if (!allCustomers) {
    matchStage.active = true;
  }

  const aggregationResult = await CustomerSchema.aggregate([
    { $match: matchStage },
    {
      $addFields: {
        splitCode: { $split: ["$code", ":"] },
      },
    },
    {
      $group: {
        _id: { customer_type: { $arrayElemAt: ["$splitCode", 1] } },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        customer_type: "$_id.customer_type",
        count: 1,
      },
    },
  ]);

  // Prepare the totals by customer type
  const customerTypeCounts: Record<CustomerType, number> = {
    [CustomerTypes.RESIDENTIAL]: 0,
    [CustomerTypes.COMMERCIAL]: 0,
    [CustomerTypes.INDUSTRIAL]: 0,
    [CustomerTypes.PUBLIC_FACILITY]: 0,
    [CustomerTypes.OTHER]: 0,
  };

  aggregationResult.forEach(({ customer_type, count }) => {
    if (customer_type in customerTypeCounts) {
      customerTypeCounts[customer_type as CustomerType] = count;
    }
  });

  const totalCustomers = aggregationResult.reduce(
    (sum, { count }) => sum + count,
    0
  );

  return {
    totalCustomers,
    customerType: customerTypeCounts,
  };
};

export const getMonthlyPaymentTotals = async (
  request: GetMonthlyPaymentTotalsRequest
): Promise<MonthlyPaymentTotalsResponse[]> => {
  const { utility, month } = request;
  const startOfMonthDate = new Date(month + "-01T00:00:00Z");
  const endOfMonth = new Date(
    Date.UTC(
      startOfMonthDate.getUTCFullYear(),
      startOfMonthDate.getUTCMonth() + 1,
      0,
      23,
      59,
      59
    )
  );

  const aggregationResult = await PaymentSchema.aggregate([
    {
      $match: {
        service_area_id: new Types.ObjectId(utility),
        timestamp: { $gte: startOfMonthDate, $lt: endOfMonth },
      },
    },
    {
      $addFields: {
        splitId: { $split: ["$external_id", "-"] },
      },
    },
    {
      $group: {
        _id: { customer_type: { $arrayElemAt: ["$splitId", 0] } },
        totalAmount: { $sum: { $toDouble: "$amount.value" } },
        currency: { $first: "$amount.currency" },
        totalKWh: { $sum: "$amount.kWh" },
      },
    },
    {
      $project: {
        _id: 0,
        customer_type: "$_id.customer_type",
        totalAmount: 1,
        currency: 1,
        totalKWh: 1,
      },
    },
  ]);

  return aggregationResult;
};
