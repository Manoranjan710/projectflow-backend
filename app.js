require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { connectRedis } = require("./src/config/redis");

(async () => {
  await connectRedis();
})();

const app = express();

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${duration}ms`);
  });

  next();
});


app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cors({
  origin: "*"
}));

const authRoutes = require("./src/routes/auth.routes");
app.use("/api/v1/auth", authRoutes);

const projectRoutes = require("./src/routes/project.routes");
app.use("/api/v1/projects", projectRoutes);

app.use((err, req, res, next) => {

  console.error("🔥 ERROR:", err);  // ALWAYS log

  let status = err.status || err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err instanceof multer.MulterError) {
    status = 400;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large. Max size is 5MB.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message =
        "Unexpected file field. Use multipart/form-data field name: file.";
    }
  }

  res.status(status).json({
    success: false,
    message
  });

});

app.get("/health", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
