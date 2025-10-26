"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MeterDoc = new mongoose_1.Schema({
    id: { type: mongoose_1.Schema.Types.Mixed, required: true, unique: true },
    serial: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    coordinates: { type: Object, required: false },
    tariff_id: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    pole_id: { type: String, required: false },
    tariff: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false,
        ref: "tariffs",
    },
    operating_mode: { type: String, required: true },
    meter_phase: { type: String, required: false },
    utilityId: { type: String, required: true, default: null },
}, { versionKey: false });
const MeterSchema = (0, mongoose_1.model)("meters", MeterDoc, "meters");
exports.default = MeterSchema;
//# sourceMappingURL=MeterSchema.js.map