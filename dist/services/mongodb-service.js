import CustomerSchema from "../models/CustomerSchema.js";
import { CustomerTypes } from "../models/types.js";
import PaymentSchema from "../models/PaymentSchema.js";
import { Types } from "mongoose";
import UtilitySchema from "../models/UtilitySchema.js";
import DailyEnergySummarySchema from "../models/DailyEnergySummarySchema.js";
export const getUtilityInfo = async (request) => {
    const { utilityId } = request;
    const utilityInfo = await UtilitySchema.findOne({ _id: new Types.ObjectId(utilityId) }, {
        _id: 0,
        name: 1,
        acronym: 1,
        country: 1,
        systemType: 1,
        systemDescription: 1,
        systemComponents: 1,
    }).lean();
    return utilityInfo;
};
export const getCustomersCount = async (request) => {
    const { utilityId, allCustomers } = request;
    // Build the match stage
    const matchStage = { service_area_id: utilityId };
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
    const customerTypeCounts = {
        [CustomerTypes.RESIDENTIAL]: 0,
        [CustomerTypes.COMMERCIAL]: 0,
        [CustomerTypes.INDUSTRIAL]: 0,
        [CustomerTypes.PUBLIC_FACILITY]: 0,
        [CustomerTypes.OTHER]: 0,
    };
    aggregationResult.forEach(({ customer_type, count }) => {
        if (customer_type in customerTypeCounts) {
            customerTypeCounts[customer_type] = count;
        }
    });
    const totalCustomers = aggregationResult.reduce((sum, { count }) => sum + count, 0);
    return {
        utilityInfo: utilityInfo,
        totalCustomers,
        customerType: customerTypeCounts,
    };
};
export const getMonthlyPaymentTotals = async (request) => {
    const { utilityId, month } = request;
    const startOfMonthDate = new Date(month + "-01T00:00:00Z");
    const endOfMonth = new Date(Date.UTC(startOfMonthDate.getUTCFullYear(), startOfMonthDate.getUTCMonth() + 1, 0, 23, 59, 59));
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
export const getMonthlyEnergySummary = async (request) => {
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
        };
    }
    const result = aggregationResult[0];
    const consumptionByCustomerType = {
        [CustomerTypes.RESIDENTIAL]: 0,
        [CustomerTypes.COMMERCIAL]: 0,
        [CustomerTypes.INDUSTRIAL]: 0,
        [CustomerTypes.PUBLIC_FACILITY]: 0,
        [CustomerTypes.OTHER]: 0,
    };
    result.consumptionByType.forEach(({ customerType, totalKWh, }) => {
        if (customerType in consumptionByCustomerType) {
            consumptionByCustomerType[customerType] = totalKWh;
        }
    });
    return {
        month,
        totalKWh: result.totalKWh,
        consumptionByCustomerType,
        topConsumers: result.topConsumers,
    };
};
export const getDailyEnergySummary = async (request) => {
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
        };
    }
    const result = aggregationResult[0];
    const consumptionByCustomerType = {
        [CustomerTypes.RESIDENTIAL]: 0,
        [CustomerTypes.COMMERCIAL]: 0,
        [CustomerTypes.INDUSTRIAL]: 0,
        [CustomerTypes.PUBLIC_FACILITY]: 0,
        [CustomerTypes.OTHER]: 0,
    };
    result.consumptionByType.forEach(({ customerType, totalKWh, }) => {
        if (customerType in consumptionByCustomerType) {
            consumptionByCustomerType[customerType] = totalKWh;
        }
    });
    return {
        date,
        totalKWh: result.totalKWh,
        consumptionByCustomerType,
    };
};
export const getYearlyEnergySummary = async (request) => {
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
    const monthDataMap = new Map(aggregationResult.map((item) => [item._id, item]));
    const monthlyConsumption = months.map((month) => {
        const monthData = monthDataMap.get(month);
        const consumptionByCustomerType = {
            [CustomerTypes.RESIDENTIAL]: 0,
            [CustomerTypes.COMMERCIAL]: 0,
            [CustomerTypes.INDUSTRIAL]: 0,
            [CustomerTypes.PUBLIC_FACILITY]: 0,
            [CustomerTypes.OTHER]: 0,
        };
        if (monthData) {
            monthData.consumptionByType.forEach(({ customerType, totalKWh, }) => {
                if (customerType in consumptionByCustomerType) {
                    consumptionByCustomerType[customerType] = totalKWh;
                }
            });
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
//# sourceMappingURL=mongodb-service.js.map