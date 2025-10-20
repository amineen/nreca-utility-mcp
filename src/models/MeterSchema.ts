import { model, Schema } from "mongoose";
import { MeterDocument } from "./types";

const MeterDoc = new Schema<MeterDocument>(
  {
    id: { type: Schema.Types.Mixed, required: true, unique: true },
    serial: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    coordinates: { type: Object, required: false },
    tariff_id: {
      type: Schema.Types.Mixed,
      required: true,
    },
    pole_id: { type: String, required: false },
    tariff: {
      type: Schema.Types.Mixed,
      required: false,
      ref: "tariffs",
    },
    operating_mode: { type: String, required: true },
    meter_phase: { type: String, required: false },
    utilityId: { type: String, required: true, default: null },
  },
  { versionKey: false }
);

const MeterSchema = model<MeterDocument>("meters", MeterDoc, "meters");

export default MeterSchema;
