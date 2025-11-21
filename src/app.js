import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./Utils/ApiError.js";
import userRouter from './Routes/user.routes.js';

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use("/api/v1/users", userRouter);

// Error handler (must be last)
app.use((err, req, res, next) => {
    console.error(err);
    if (err instanceof ApiError) {
        return res.status(err.statusCode || 500).json({
            statusCode: err.statusCode || 500,
            data: null,
            message: err.message || "Error",
            success: false,
            errors: err.errors || []
        });
    }
    return res.status(500).json({
        statusCode: 500,
        data: null,
        message: err.message || "Internal Server Error",
        success: false
    });
});

export { app };