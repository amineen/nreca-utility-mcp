import { Schema, model } from "mongoose";
import {
  TechnologyComponentType,
  UtilityDocument as UtilityDoc,
} from "./types.js";

const technologySchema = new Schema<TechnologyComponentType>(
  {
    capacity: { type: Number, required: true },
    component: { type: String, required: true },
    unit: { type: String, required: true },
  },
  { timestamps: false, versionKey: false, _id: false }
);

const UtilityDoc = new Schema<UtilityDoc>(
  {
    name: { type: String, required: true },
    acronym: { type: String, required: true, default: "-" },
    country: { type: String, required: true },
    logoUrl: { type: String, required: false },
    address: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    totalInstalledCapacitykW: { type: Number, required: false },
    systemComponents: { type: [technologySchema], required: false },
    systemType: {
      type: String,
      required: true,
      enum: ["lv-off-grid", "mv-off-grid", "grid-connected"],
    },
    systemDescription: { type: String, required: true },
    numberOfCustomers: { type: Number, required: true },
    populationServed: {
      males: { type: Number, required: false },
      females: { type: Number, required: false },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
      },
      coordinates: {
        type: [Number],
        required: false,
      },
    },
    isActive: { type: Boolean, required: true },
  },
  { timestamps: true, versionKey: false }
);

const UtilitySchema = model<UtilityDoc>("utilities", UtilityDoc, "utilities");

export default UtilitySchema;
