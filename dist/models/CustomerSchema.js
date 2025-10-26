import { Schema, model } from "mongoose";
const BalanceCreditDoc = new Schema({
    credit: {
        value: { type: String, required: true },
        currency: { type: String, required: true },
    },
    plan: {
        value: { type: String, required: false },
        currency: { type: String, required: false },
    },
    technical_debt: {
        value: { type: String, required: false },
        currency: { type: String, required: false },
    },
}, { versionKey: false, _id: false });
const CustomerDoc = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone_number: { type: String, required: false },
    code: { type: String, required: true },
    service_area_id: { type: String, required: true },
    meters: {
        type: [Schema.Types.Mixed],
        required: false,
        ref: "meters",
    },
    balances: { type: BalanceCreditDoc, required: false },
    site_id: { type: String, required: false },
    energy_limited: { type: Boolean, required: false },
    last_energy_limit_reset_energy: { type: Number, required: false },
    last_energy_limit_reset_at: { type: Date, required: false },
    last_plan_renewal: { type: Date, required: false },
    next_plan_renewal: { type: Date, required: false },
    active: { type: Boolean, required: false, default: true },
    last_heartbeat: { type: Date, required: false, default: null },
}, { versionKey: false });
const CustomerSchema = model("customers", CustomerDoc, "customers");
export default CustomerSchema;
//# sourceMappingURL=CustomerSchema.js.map