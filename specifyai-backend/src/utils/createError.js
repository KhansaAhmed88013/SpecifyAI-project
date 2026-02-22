const createError = (status, message, options = {}) => {
  const error = new Error(message);
  error.status = status;
  if (options.code) {
    error.code = options.code;
  }
  if (options.details) {
    error.details = options.details;
  }
  return error;
};

module.exports = createError;
