import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 8080;
export const API_URL = process.env.API_URL || `http://localhost:${PORT}`;
export const STORAGE_ADAPTER = process.env.STORAGE_ADAPTER || "memory";
