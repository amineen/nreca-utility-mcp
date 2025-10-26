import CustomerSchema from "../models/CustomerSchema.js";
import { CustomerTypes } from "../models/types.js";
import PaymentSchema from "../models/PaymentSchema.js";
import { Types } from "mongoose";
import UtilitySchema from "../models/UtilitySchema.js";
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
//# sourceMappingURL=mongodb-service.js.map