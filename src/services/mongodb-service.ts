import CustomerSchema from "../models/CustomerSchema";
import {
  CustomerCountResponse,
  GetCustomersCountRequest,
} from "../models/tool-schema";
import { CustomerType, CustomerTypes } from "../models/types";

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
