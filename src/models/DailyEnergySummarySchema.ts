import { Schema, model } from "mongoose";
import { DailyEnergySummaryDocument, HourlyEnergyReading } from "./types.js";

const hourlyEnergyReadingSchema = new Schema<HourlyEnergyReading>(
  {
    cumulative_energy: { type: Number, required: true },
    energy_consumption: { type: Number, required: true },
    hour: { type: String, required: true },
    average_power: { type: Number, required: true },
  },
  { timestamps: false, versionKey: false }
);

const dailyEnergySummarySchema = new Schema<DailyEnergySummaryDocument>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "customers",
    },
    date: { type: String, required: true },
    totalKWh: { type: Number, required: true },
    service_area_id: { type: String, required: true },
    last_heartbeat_end: {
      type: String,
      required: true,
      default: new Date().toISOString(),
    },
    customerType: { type: String, required: true, default: null },
    meterSerial: { type: String, required: false, default: null },
    readings: {
      type: [hourlyEnergyReadingSchema],
      required: true,
      default: [],
    },
  },
  { timestamps: false, versionKey: false }
);

export default model<DailyEnergySummaryDocument>(
  "daily_energy_summary",
  dailyEnergySummarySchema,
  "daily_energy_summary"
);
