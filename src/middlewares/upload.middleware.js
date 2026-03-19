const multer = require('multer');
const AppError = require("../utils/AppError");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const mimetype = (file.mimetype || "").toLowerCase();
    const originalname = (file.originalname || "").toLowerCase();

    const isPdf = mimetype.includes("pdf") || originalname.endsWith(".pdf");
    if (!isPdf) {
      return cb(new AppError(400, "Only PDF files are allowed"), false);
    }

    return cb(null, true);
  },
});

module.exports = upload;
