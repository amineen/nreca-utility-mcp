const { CustomerTypes } = await import("../models/types");
import CustomerSchema from "../models/CustomerSchema";
import {
  CustomerCountResponse,
  GetCustomersCountRequest,
} from "../models/tool-schema";
import { CustomerType } from "../models/types";

export const getCustomersCount = async (
  request: GetCustomersCountRequest
): Promise<CustomerCountResponse> => {
  const { utility, allCustomers } = request;

  // Build the match stage
  const matchStage: Record<string, any> = { service_area_id: utility };
  if (allCustomers !== undefined) {
    matchStage.active = allCustomers ? undefined : true;
  }

  const aggregationResult = await CustomerSchema.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$customer_type",
        count: { $sum: 1 },
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

  aggregationResult.forEach(({ _id, count }) => {
    if (_id in customerTypeCounts) {
      customerTypeCounts[_id as CustomerType] = count;
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
