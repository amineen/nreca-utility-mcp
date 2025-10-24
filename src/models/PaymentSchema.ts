import { Schema, model } from "mongoose";
import { MonetaryAmount, PaymentDocument } from "./types";

const MonetaryAmountSchema = new Schema<MonetaryAmount>(
  {
    value: { type: String, required: true },
    currency: { type: String, required: true },
    kWh: { type: Number, required: false },
  },
  { versionKey: false, _id: false }
);

const PaymentSchema = new Schema<PaymentDocument>(
  {
    id: { type: Schema.Types.Mixed, required: true, unique: true },
    recipient_id: {
      type: Schema.Types.Mixed,
      required: true,
    },
    customer_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "customers",
    },
    amount: { type: MonetaryAmountSchema, required: true },
    memo: { type: String, required: true },
    external_id: { type: String, required: true, unique: true },
    status: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    service_area_id: { type: Schema.Types.ObjectId, required: true },
    vendor: { type: String, required: true },
    vendorId: { type: String, required: true },
    vendor_commission: { type: Number, required: false, default: 0 },
  },
  { versionKey: false, timestamps: true }
);

export default model<PaymentDocument>("payments", PaymentSchema, "payments");
