import express from "express";
import dotenv from "dotenv";
import { env } from "process";
import { connectToDatabase } from "./configurations/db-config";
import { getCustomersCount } from "./services/mongodb-service";

dotenv.config();

connectToDatabase();

const app = express();

// getCustomersCount({
//   utility: "67484e3ee39b649e727b4d8c",
//   allCustomers: false,
// }).then((result) => {
//   console.log(result);
// });

import { getMonthlyPaymentTotals } from "./services/mongodb-service";

getMonthlyPaymentTotals({
  utility: "67484e3ee39b649e727b4d8c",
  month: "2025-09",
}).then((result) => {
  console.log(result);
});

app.use(express.json());

const PORT = env.PORT || 8085;

if (env.NODE_ENV === "development") {
  console.info(
    "\x1b[32m%s\x1b[0m",
    `✅ Server is running on http://localhost:${PORT}`
  );
}

export default app;
