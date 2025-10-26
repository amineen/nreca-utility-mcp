"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyPaymentTotals = exports.getCustomersCount = void 0;
const CustomerSchema_1 = __importDefault(require("../models/CustomerSchema"));
const types_1 = require("../models/types");
const PaymentSchema_1 = __importDefault(require("../models/PaymentSchema"));
const mongoose_1 = require("mongoose");
const getCustomersCount = async (request) => {
    const { utility, allCustomers } = request;
    // Build the match stage
    const matchStage = { service_area_id: utility };
    if (!allCustomers) {
        matchStage.active = true;
    }
    const aggregationResult = await CustomerSchema_1.default.aggregate([
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
    const customerTypeCounts = {
        [types_1.CustomerTypes.RESIDENTIAL]: 0,
        [types_1.CustomerTypes.COMMERCIAL]: 0,
        [types_1.CustomerTypes.INDUSTRIAL]: 0,
        [types_1.CustomerTypes.PUBLIC_FACILITY]: 0,
        [types_1.CustomerTypes.OTHER]: 0,
    };
    aggregationResult.forEach(({ customer_type, count }) => {
        if (customer_type in customerTypeCounts) {
            customerTypeCounts[customer_type] = count;
        }
    });
    const totalCustomers = aggregationResult.reduce((sum, { count }) => sum + count, 0);
    return {
        totalCustomers,
        customerType: customerTypeCounts,
    };
};
exports.getCustomersCount = getCustomersCount;
const getMonthlyPaymentTotals = async (request) => {
    const { utility, month } = request;
    const startOfMonthDate = new Date(month + "-01T00:00:00Z");
    const endOfMonth = new Date(Date.UTC(startOfMonthDate.getUTCFullYear(), startOfMonthDate.getUTCMonth() + 1, 0, 23, 59, 59));
    const aggregationResult = await PaymentSchema_1.default.aggregate([
        {
            $match: {
                service_area_id: new mongoose_1.Types.ObjectId(utility),
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
exports.getMonthlyPaymentTotals = getMonthlyPaymentTotals;
//# sourceMappingURL=mongodb-service.js.map