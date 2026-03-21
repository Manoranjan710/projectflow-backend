require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());

const authRoutes = require("./src/routes/auth.routes");
app.use("/api/v1/auth", authRoutes);

const projectRoutes = require("./src/routes/project.routes");
app.use("/api/v1/projects", projectRoutes);

app.use((err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";

  if (err.statusCode && !err.status) status = err.statusCode;
  if (err.httpStatusCode && !err.status && !err.statusCode)
    status = err.httpStatusCode;

  if (err instanceof multer.MulterError) {
    status = 400;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large. Max size is 5MB.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message =
        "Unexpected file field. Use multipart/form-data field name: file.";
    }
  }

  if (message === "Bad Request" && err.cause?.message) {
    message = err.cause.message;
  }

  const includeDetails =
    process.env.DEBUG_ERRORS === "true" ||
    process.env.NODE_ENV === "development";

  if (includeDetails) {
    console.error("[error]", err);
  }

  const responseStatus = err?.response?.status;
  const responseData = err?.response?.data;
  const responseText = err?.response?.statusText;
  const errData = err?.data;

  const causeResponseStatus = err?.cause?.response?.status;
  const causeResponseData = err?.cause?.response?.data;
  const causeResponseText = err?.cause?.response?.statusText;
  const causeErrData = err?.cause?.data;

  if (message === "Bad Request") {
    const upstreamMessage =
      responseData?.message ||
      responseData?.error ||
      responseData?.status?.error ||
      causeResponseData?.message ||
      causeResponseData?.error ||
      causeResponseData?.status?.error ||
      errData?.message ||
      errData?.error ||
      causeErrData?.message ||
      causeErrData?.error;

    if (typeof upstreamMessage === "string" && upstreamMessage.trim()) {
      message = upstreamMessage;
    }
  }

  res.status(status).json({
    success: false,
    message,
    ...(includeDetails
      ? {
          details: {
            name: err.name,
            code: err.code,
            type: err.type,
            status,
            statusCode: err.statusCode,
            httpStatusCode: err.httpStatusCode,
            cause: err.cause?.message,
            responseStatus,
            responseText,
            responseData,
            errData,
            causeResponseStatus,
            causeResponseText,
            causeResponseData,
            causeErrData,
          },
        }
      : null),
  });
});

app.get("/health", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
