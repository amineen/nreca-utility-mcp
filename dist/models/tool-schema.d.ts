import { z } from "zod";
export declare const GetCustomersCountSchema: z.ZodObject<{
    utility: z.ZodString;
    allCustomers: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strict", z.ZodTypeAny, {
    utility: string;
    allCustomers: boolean;
}, {
    utility: string;
    allCustomers?: boolean | undefined;
}>;
export declare const GetMonthlyPaymentTotalsSchema: z.ZodObject<{
    utility: z.ZodString;
    month: z.ZodString;
}, "strict", z.ZodTypeAny, {
    utility: string;
    month: string;
}, {
    utility: string;
    month: string;
}>;
export type GetCustomersCountRequest = z.infer<typeof GetCustomersCountSchema>;
export type GetMonthlyPaymentTotalsRequest = z.infer<typeof GetMonthlyPaymentTotalsSchema>;
export declare const CustomerCountResponseSchema: z.ZodObject<{
    totalCustomers: z.ZodNumber;
    customerType: z.ZodOptional<z.ZodObject<{
        Residential: z.ZodNumber;
        Commercial: z.ZodNumber;
        Industrial: z.ZodNumber;
        "Public Facility": z.ZodNumber;
        Other: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        Residential: number;
        Commercial: number;
        Industrial: number;
        "Public Facility": number;
        Other: number;
    }, {
        Residential: number;
        Commercial: number;
        Industrial: number;
        "Public Facility": number;
        Other: number;
    }>>;
}, "strict", z.ZodTypeAny, {
    totalCustomers: number;
    customerType?: {
        Residential: number;
        Commercial: number;
        Industrial: number;
        "Public Facility": number;
        Other: number;
    } | undefined;
}, {
    totalCustomers: number;
    customerType?: {
        Residential: number;
        Commercial: number;
        Industrial: number;
        "Public Facility": number;
        Other: number;
    } | undefined;
}>;
export declare const MonthlyPaymentTotalsResponseSchema: z.ZodArray<z.ZodObject<{
    totalAmount: z.ZodNumber;
    totalKWh: z.ZodNumber;
    customer_type: z.ZodString;
    currency: z.ZodString;
}, "strict", z.ZodTypeAny, {
    currency: string;
    totalAmount: number;
    totalKWh: number;
    customer_type: string;
}, {
    currency: string;
    totalAmount: number;
    totalKWh: number;
    customer_type: string;
}>, "many">;
export type CustomerCountResponse = z.infer<typeof CustomerCountResponseSchema>;
export type MonthlyPaymentTotalsResponse = z.infer<typeof MonthlyPaymentTotalsResponseSchema>;
//# sourceMappingURL=tool-schema.d.ts.map