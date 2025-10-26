import { Document, Types } from "mongoose";

export type Customer = {
  id: string | Types.ObjectId;
  name: string;
  code: string;
  phone_number: string;
  active?: boolean;
  balances?: BalanceCredit;
  last_heartbeat?: Date | null;
  meters?: Meter[] | string[] | Types.ObjectId[];
  service_area_id: string;
  energy_limited?: boolean;
  last_energy_limit_reset_energy?: number;
  last_energy_limit_reset_at?: Date;
  last_plan_renewal?: Date;
  next_plan_renewal?: Date;
  site_id?: string;
};

export type CustomerDocument = Customer & Document;

export type BalanceCredit = {
  credit: {
    value: string;
    currency: string;
  };
  plan?: {
    value: string;
    currency: string;
  };
  technical_debt?: {
    value: string;
    currency: string;
  };
};

export type Meter = {
  id: string | Types.ObjectId;
  serial: string;
  address: string;
  coordinates?: Coordinates;
  operating_mode: OperatingMode;
  meter_phase?: MeterPhase;
  tariff_id: Types.ObjectId | string;
  pole_id?: string;
  tariff?: Types.ObjectId | TariffParameters | string;
  utilityId: string;
};

export type MeterDocument = Meter & Document;

export type OperatingMode = "auto" | "on" | "off";

export type MeterPhase = "1" | "3" | "N/A";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type TariffParameters = {
  id?: string;
  name: string;
  service_area_id: string;
  electricity_rate: PhysicalQuantity;
  load_limit: TariffLoadLimitProperties;
  low_balance_threshold: number;
  time_of_use: TimeOfUseScheduleBlock[];
  inrush_current_protection_disabled: boolean;
  block_rate: BlockRateProperties;
  electricity_rate_type: ElectricityRateTypeProperties;
  block_rate_cycle_reset_energy: string | null;
  last_block_rate_cycle_reset_at: string | null;
  daily_energy_limit?: number;
  daily_energy_limit_unit?: string;
};

export type PhysicalQuantity = {
  value: number;
  unit: string;
};

export type ScheduledLoadLimitBlock = {
  start_time: string;
  load_limit: number;
};

export type TariffLoadLimitProperties = {
  type: "scheduled" | "flat";
  value: number | ScheduledLoadLimitBlock[];
};

export type TimeOfUseScheduleBlock = {
  start_time: string;
  modifier: string;
};

export type BlockRateBlock = {
  start_energy: number;
  rate: string;
};

export type BlockRateProperties = {
  period_kind: string;
  period_start: number;
  reset_period: string;
  rates: BlockRateBlock[];
  unit: {
    numerator: string;
    denominator: string;
  };
};

export type ElectricityRateTypeProperties = "block_rate" | "flat_rate";

export type PaymentStatus = "processed" | "processing" | "failed";

export type MonetaryAmount = {
  value: string;
  currency: string;
  kWh?: number;
};

export type Payment = {
  id: Types.ObjectId | string;
  recipient_id: Types.ObjectId | string;
  customer_id: Types.ObjectId | string;
  amount: MonetaryAmount;
  memo: MemoType;
  external_id: string;
  status: PaymentStatus;
  timestamp: Date;
  service_area_id: string | Types.ObjectId;
  vendor: string;
  vendorId: string;
  vendor_commission?: number;
};

export type PaymentDocument = Payment & Document;

export type MemoType =
  | "Cash payment"
  | "Mobile payment"
  | "Payment reversal"
  | "Cash payment - import";

export const CustomerTypes = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  INDUSTRIAL: "Industrial",
  PUBLIC_FACILITY: "Public Facility",
  OTHER: "Other",
} as const;

export type CustomerType = (typeof CustomerTypes)[keyof typeof CustomerTypes];

export type DailyEnergySummary = {
  customerId: Types.ObjectId | string;
  date: string;
  totalKWh: number;
  service_area_id: string | Types.ObjectId;
  last_heartbeat_end: string;
  customerType: string | null;
  readings: HourlyEnergyReading[];
  meterSerial?: string;
};

export type DailyEnergySummaryDocument = Document & DailyEnergySummary;

export type HourlyEnergyReading = {
  cumulative_energy: number;
  energy_consumption: number;
  hour: HourType;
  average_power: number;
};

export type HourType = (typeof HOURS)[number];

export const HOURS = [
  "00",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
] as const;
