import CustomerSchema from "../models/CustomerSchema.js";
import {
  CustomerCountResponse,
  GetCustomersCountRequest,
  GetMonthlyPaymentTotalsRequest,
  GetUtilityInfoRequest,
  MonthlyPaymentTotalsResponse,
  UtilityInfoResponse,
  MonthlyEnergySummaryResponse,
  GetMonthlyEnergySummaryRequest,
  DailyEnergySummaryResponse,
  GetDailyEnergySummaryRequest,
  YearlyEnergySummaryResponse,
  GetYearlyEnergySummaryRequest,
  YearlyPaymentTotalsResponse,
  GetYearlyPaymentTotalsRequest,
  UtilitiesListResponse,
  GetUtilitiesListRequest,
} from "../models/tool-schema.js";
import { CustomerType, CustomerTypes } from "../models/types.js";
import PaymentSchema from "../models/PaymentSchema.js";
import { Types } from "mongoose";
import UtilitySchema from "../models/UtilitySchema.js";
import DailyEnergySummarySchema from "../models/DailyEnergySummarySchema.js";

export const getUtilityInfo = async (
  request: GetUtilityInfoRequest
): Promise<UtilityInfoResponse> => {
  const { utilityId } = request;
  const utilityInfo = await UtilitySchema.findOne(
    { _id: new Types.ObjectId(utilityId) },
    {
      _id: 0,
      name: 1,
      acronym: 1,
      country: 1,
      systemType: 1,
      systemDescription: 1,
      systemComponents: 1,
    }
  ).lean();

  return utilityInfo as unknown as UtilityInfoResponse;
};

export const getUtilitiesList = async (
  request: GetUtilitiesListRequest
): Promise<UtilitiesListResponse> => {
  const utilities = await UtilitySchema.find(
    {},
    {
      _id: 1,
      name: 1,
      acronym: 1,
      country: 1,
      systemType: 1,
      systemDescription: 1,
      systemComponents: 1,
    }
  ).lean();

  return utilities.map((utility) => ({
    id: utility._id.toString(),
    name: utility.name,
    acronym: utility.acronym,
    country: utility.country,
    systemType: utility.systemType,
    systemDescription: utility.systemDescription,
    systemComponents: utility.systemComponents,
  })) as UtilitiesListResponse;
};

export const getCustomersCount = async (
  request: GetCustomersCountRequest
): Promise<CustomerCountResponse> => {
  const { utilityId, allCustomers } = request;

  // Build the match stage
  const matchStage: Record<string, any> = { service_area_id: utilityId };
  if (!allCustomers) {
    matchStage.active = true;
  }

  const utilityInfoPromise = getUtilityInfo({ utilityId });

  const aggregationResultPromise = CustomerSchema.aggregate([
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

  const [utilityInfo, aggregationResult] = await Promise.all([
    utilityInfoPromise,
    aggregationResultPromise,
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
    (sum: number, { count }: { count: number }) => sum + count,
    0
  );

  return {
    utilityInfo: utilityInfo as unknown as UtilityInfoResponse,
    totalCustomers,
    customerType: customerTypeCounts,
  };
};

export const getMonthlyPaymentTotals = async (
  request: GetMonthlyPaymentTotalsRequest
): Promise<MonthlyPaymentTotalsResponse[]> => {
  const { utilityId, month } = request;
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
        service_area_id: new Types.ObjectId(utilityId),
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

export const getMonthlyEnergySummary = async (
  request: GetMonthlyEnergySummaryRequest
): Promise<MonthlyEnergySummaryResponse> => {
  const { utilityId, month } = request;

  const aggregationResult = await DailyEnergySummarySchema.aggregate([
    {
      $match: {
        service_area_id: utilityId,
        date: {
          $regex: new RegExp(`^${month}-\\d{2}$`),
        },
      },
    },
    {
      $group: {
        _id: "$customerType",
        totalKWh: { $sum: "$totalKWh" },
        customers: {
          $push: {
            customerId: "$customerId",
            totalKWh: "$totalKWh",
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        totalKWh: { $sum: "$totalKWh" },
        consumptionByType: {
          $push: {
            customerType: "$_id",
            totalKWh: "$totalKWh",
          },
        },
        allCustomers: { $push: "$customers" },
      },
    },
    {
      $unwind: "$allCustomers",
    },
    {
      $unwind: "$allCustomers",
    },
    {
      $group: {
        _id: {
          customerId: "$allCustomers.customerId",
          totalKWh: "$totalKWh",
          consumptionByType: "$consumptionByType",
        },
        customerTotalKWh: { $sum: "$allCustomers.totalKWh" },
      },
    },
    {
      $sort: { customerTotalKWh: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: "customers",
        localField: "_id.customerId",
        foreignField: "_id",
        as: "customerInfo",
      },
    },
    {
      $unwind: "$customerInfo",
    },
    {
      $group: {
        _id: null,
        totalKWh: { $first: "$_id.totalKWh" },
        consumptionByType: { $first: "$_id.consumptionByType" },
        topConsumers: {
          $push: {
            customerName: "$customerInfo.name",
            totalKWh: "$customerTotalKWh",
          },
        },
      },
    },
  ]);

  if (aggregationResult.length === 0) {
    return {
      month,
      totalKWh: 0,
      consumptionByCustomerType: {
        [CustomerTypes.RESIDENTIAL]: 0,
        [CustomerTypes.COMMERCIAL]: 0,
        [CustomerTypes.INDUSTRIAL]: 0,
        [CustomerTypes.PUBLIC_FACILITY]: 0,
        [CustomerTypes.OTHER]: 0,
      },
      topConsumers: [],
    } as MonthlyEnergySummaryResponse;
  }

  const result = aggregationResult[0];

  const consumptionByCustomerType: Record<CustomerType, number> = {
    [CustomerTypes.RESIDENTIAL]: 0,
    [CustomerTypes.COMMERCIAL]: 0,
    [CustomerTypes.INDUSTRIAL]: 0,
    [CustomerTypes.PUBLIC_FACILITY]: 0,
    [CustomerTypes.OTHER]: 0,
  };

  result.consumptionByType.forEach(
    ({
      customerType,
      totalKWh,
    }: {
      customerType: string;
      totalKWh: number;
    }) => {
      if (customerType in consumptionByCustomerType) {
        consumptionByCustomerType[customerType as CustomerType] = totalKWh;
      }
    }
  );

  return {
    month,
    totalKWh: result.totalKWh,
    consumptionByCustomerType,
    topConsumers: result.topConsumers,
  };
};

export const getDailyEnergySummary = async (
  request: GetDailyEnergySummaryRequest
): Promise<DailyEnergySummaryResponse> => {
  const { utilityId, date } = request;

  const aggregationResult = await DailyEnergySummarySchema.aggregate([
    {
      $match: {
        service_area_id: utilityId,
        date,
      },
    },
    {
      $group: {
        _id: "$customerType",
        totalKWh: { $sum: "$totalKWh" },
      },
    },
    {
      $group: {
        _id: null,
        totalKWh: { $sum: "$totalKWh" },
        consumptionByType: {
          $push: {
            customerType: "$_id",
            totalKWh: "$totalKWh",
          },
        },
      },
    },
  ]);

  if (aggregationResult.length === 0) {
    return {
      date,
      totalKWh: 0,
      consumptionByCustomerType: {
        [CustomerTypes.RESIDENTIAL]: 0,
        [CustomerTypes.COMMERCIAL]: 0,
        [CustomerTypes.INDUSTRIAL]: 0,
        [CustomerTypes.PUBLIC_FACILITY]: 0,
        [CustomerTypes.OTHER]: 0,
      },
    } as DailyEnergySummaryResponse;
  }

  const result = aggregationResult[0];

  const consumptionByCustomerType: Record<CustomerType, number> = {
    [CustomerTypes.RESIDENTIAL]: 0,
    [CustomerTypes.COMMERCIAL]: 0,
    [CustomerTypes.INDUSTRIAL]: 0,
    [CustomerTypes.PUBLIC_FACILITY]: 0,
    [CustomerTypes.OTHER]: 0,
  };

  result.consumptionByType.forEach(
    ({
      customerType,
      totalKWh,
    }: {
      customerType: string;
      totalKWh: number;
    }) => {
      if (customerType in consumptionByCustomerType) {
        consumptionByCustomerType[customerType as CustomerType] = totalKWh;
      }
    }
  );

  return {
    date,
    totalKWh: result.totalKWh,
    consumptionByCustomerType,
  };
};

export const getYearlyEnergySummary = async (
  request: GetYearlyEnergySummaryRequest
): Promise<YearlyEnergySummaryResponse> => {
  const { utilityId, year } = request;

  // Generate all months for the given year
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  });

  // Create a shared match condition for both queries
  const yearMatchCondition = {
    service_area_id: utilityId,
    date: {
      $regex: new RegExp(`^${year}-\\d{2}-\\d{2}$`),
    },
  };

  // Run both aggregations in parallel using Promise.all
  const [aggregationResult, topConsumersResult] = await Promise.all([
    // Aggregate monthly data for the entire year
    DailyEnergySummarySchema.aggregate([
      {
        $match: yearMatchCondition,
      },
      {
        $project: {
          month: { $substr: ["$date", 0, 7] }, // Extract YYYY-MM from date
          customerType: 1,
          totalKWh: 1,
        },
      },
      {
        $group: {
          _id: {
            month: "$month",
            customerType: "$customerType",
          },
          totalKWh: { $sum: "$totalKWh" },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          totalKWh: { $sum: "$totalKWh" },
          consumptionByType: {
            $push: {
              customerType: "$_id.customerType",
              totalKWh: "$totalKWh",
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]),

    // Get top consumers for the entire year
    DailyEnergySummarySchema.aggregate([
      {
        $match: yearMatchCondition,
      },
      {
        $group: {
          _id: "$customerId",
          totalKWh: { $sum: "$totalKWh" },
        },
      },
      {
        $sort: { totalKWh: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customerInfo",
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$customerInfo",
      },
      {
        $project: {
          _id: 0,
          customerName: "$customerInfo.name",
          totalKWh: 1,
        },
      },
    ]),
  ]);

  // Build monthly consumption array with all 12 months
  // Convert array to Map for O(1) lookup instead of O(n) find
  const monthDataMap = new Map(
    aggregationResult.map((item) => [item._id, item])
  );

  const monthlyConsumption = months.map((month) => {
    const monthData = monthDataMap.get(month);

    const consumptionByCustomerType: Record<CustomerType, number> = {
      [CustomerTypes.RESIDENTIAL]: 0,
      [CustomerTypes.COMMERCIAL]: 0,
      [CustomerTypes.INDUSTRIAL]: 0,
      [CustomerTypes.PUBLIC_FACILITY]: 0,
      [CustomerTypes.OTHER]: 0,
    };

    if (monthData) {
      monthData.consumptionByType.forEach(
        ({
          customerType,
          totalKWh,
        }: {
          customerType: string;
          totalKWh: number;
        }) => {
          if (customerType in consumptionByCustomerType) {
            consumptionByCustomerType[customerType as CustomerType] = totalKWh;
          }
        }
      );
    }

    return {
      month,
      totalKWh: monthData?.totalKWh || 0,
      consumptionByCustomerType,
    };
  });

  return {
    monthlyConsumption,
    topConsumers: topConsumersResult,
  };
};

export const getYearlyPaymentTotals = async (
  request: GetYearlyPaymentTotalsRequest
): Promise<YearlyPaymentTotalsResponse> => {
  const { utilityId, year } = request;

  // Generate all months for the given year
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  });

  // Calculate date range for the entire year
  const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
  const endOfYear = new Date(`${year}-12-31T23:59:59Z`);

  // Create shared match condition
  const yearMatchCondition = {
    service_area_id: new Types.ObjectId(utilityId),
    timestamp: { $gte: startOfYear, $lte: endOfYear },
  };

  // Run aggregation to get monthly payment data
  const aggregationResult = await PaymentSchema.aggregate([
    {
      $match: yearMatchCondition,
    },
    {
      $project: {
        month: {
          $dateToString: { format: "%Y-%m", date: "$timestamp" },
        },
        external_id: 1,
        amount: 1,
      },
    },
    {
      $addFields: {
        customer_type: { $arrayElemAt: [{ $split: ["$external_id", "-"] }, 0] },
        amountValue: { $toDouble: "$amount.value" },
        kWh: { $ifNull: ["$amount.kWh", 0] },
      },
    },
    {
      $group: {
        _id: {
          month: "$month",
          customer_type: "$customer_type",
        },
        totalAmount: { $sum: "$amountValue" },
        totalKWh: { $sum: "$kWh" },
        currency: { $first: "$amount.currency" },
      },
    },
    {
      $group: {
        _id: "$_id.month",
        totalAmount: { $sum: "$totalAmount" },
        totalKWh: { $sum: "$totalKWh" },
        currency: { $first: "$currency" },
        paymentsByCustomerType: {
          $push: {
            customer_type: "$_id.customer_type",
            totalAmount: "$totalAmount",
            totalKWh: "$totalKWh",
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Convert to Map for O(1) lookup
  const monthDataMap = new Map(
    aggregationResult.map((item) => [item._id, item])
  );

  // Build monthly payments array with all 12 months
  let yearTotalAmount = 0;
  let yearTotalKWh = 0;
  let currency = "USD"; // Default currency

  const monthlyPayments = months.map((month) => {
    const monthData = monthDataMap.get(month);

    if (monthData) {
      yearTotalAmount += monthData.totalAmount;
      yearTotalKWh += monthData.totalKWh;
      currency = monthData.currency || currency;

      return {
        month,
        totalAmount: monthData.totalAmount,
        totalKWh: monthData.totalKWh,
        currency: monthData.currency,
        paymentsByCustomerType: monthData.paymentsByCustomerType,
      };
    }

    // Return empty data for months with no payments
    return {
      month,
      totalAmount: 0,
      totalKWh: 0,
      currency,
      paymentsByCustomerType: [],
    };
  });

  return {
    monthlyPayments,
    totalForYear: {
      totalAmount: yearTotalAmount,
      totalKWh: yearTotalKWh,
      currency,
    },
  };
};
