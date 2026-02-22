const jwt = require("jsonwebtoken");
const createError = require("../utils/createError");

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(createError(401, "Authorization token required"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    next(); // ✅ token valid → continue to route
  } catch (err) {
    return next(createError(401, "Invalid or expired token"));
  }
};

module.exports = requireAuth;
