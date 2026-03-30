class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message, 401);
  }
}

function errorHandler(err, req, res, next) {
  console.error("Full error object:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      statusState: "error",
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  if (err.details) {
    const errorMessages = [];
    for (const key in err.details) {
      if (Array.isArray(err.details[key])) {
        err.details[key].forEach((e) => {
          if (e.message) errorMessages.push(e.message);
        });
      }
    }

    return res.status(400).json({
      status: 400,
      statusState: "error",
      message: "Validation failed",
      errors: errorMessages,
    });
  }

  return res.status(500).json({
    status: 500,
    statusState: "error",
    message: "Internal Server Error",
  });
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  errorHandler,
};