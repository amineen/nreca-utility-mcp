"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.isDBConnected = isDBConnected;
exports.disconnectFromDatabase = disconnectFromDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    uri: process.env.MONGODB_URI,
    options: {
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 30000,
    },
};
let isConnected = false;
async function connectToDatabase() {
    if (isConnected) {
        console.log("Using existing database connection");
        return;
    }
    try {
        if (!config.uri) {
            console.error("❌ MongoDB connection error: MongoDB URI is not set");
            return;
        }
        await mongoose_1.default.connect(config.uri, config.options);
        isConnected = true;
        console.log("✅ MongoDB connected successfully");
        mongoose_1.default.connection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
            isConnected = false;
        });
        mongoose_1.default.connection.on("disconnected", () => {
            console.log("❌ MongoDB disconnected");
            isConnected = false;
        });
        process.on("SIGINT", async () => {
            await mongoose_1.default.connection.close();
            console.log("✅ MongoDB connection closed through app termination");
            process.exit(0);
        });
    }
    catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        isConnected = false;
        throw error;
    }
}
function isDBConnected() {
    return isConnected && mongoose_1.default.connection.readyState === 1;
}
async function disconnectFromDatabase() {
    if (isConnected) {
        await mongoose_1.default.connection.close();
        isConnected = false;
        console.log("MongoDB connection closed");
    }
}
//# sourceMappingURL=db-config.js.map