class AppError extends Error {
  constructor(statusCode, message, options) {
    super(message, options);
    this.status = statusCode;
  }
}

module.exports = AppError;
