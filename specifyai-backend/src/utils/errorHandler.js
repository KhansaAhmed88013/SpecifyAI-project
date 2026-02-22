const buildValidationDetails = (err) => {
  if (!err || !err.errors) {
    return undefined;
  }

  const details = {};
  Object.entries(err.errors).forEach(([key, value]) => {
    if (value && value.message) {
      details[key] = value.message;
    }
  });

  return Object.keys(details).length > 0 ? details : undefined;
};

const handleMongooseError = (err) => {
  if (err && err.name === "ValidationError") {
    return {
      status: 400,
      message: "Validation failed",
      details: buildValidationDetails(err),
      code: "VALIDATION_ERROR",
    };
  }
  if (err && err.name === "CastError") {
    return { status: 400, message: "Invalid identifier format", code: "INVALID_ID" };
  }
  if (err && err.code === 11000) {
    return {
      status: 409,
      message: "Duplicate value",
      details: err.keyValue || undefined,
      code: "DUPLICATE_VALUE",
    };
  }
  return null;
};

const errorHandler = (err, req, res, next) => {
  const mapped = handleMongooseError(err);
  const status = mapped?.status || err.status || 500;
  const message = mapped?.message || err.message || "Internal server error";
  const code = mapped?.code || err.code;
  const details = mapped?.details || err.details;
  const isProd = process.env.NODE_ENV === "production";

  if (status >= 500) {
    console.error(err);
  }

  const payload = { success: false, message };
  if (code) {
    payload.code = code;
  }
  if (!isProd && details) {
    payload.details = details;
  }
  if (!isProd && !payload.details && err.payload) {
    payload.details = err.payload;
  }

  res.status(status).json(payload);
};

module.exports = errorHandler;
