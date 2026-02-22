const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const generateToken = require("../utils/generateToken");
const createError = require("../utils/createError");

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
const RESET_CODE_EXPIRY_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL = "15m";
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET;
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 465);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!RESET_TOKEN_SECRET) {
  throw new Error("RESET_TOKEN_SECRET is required for password reset tokens");
}

if (!EMAIL_USER || !EMAIL_PASS) {
  throw new Error("EMAIL_USER and EMAIL_PASS are required for email delivery");
}

const mailer = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const generateResetToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      type: "RESET",
      version: user.resetTokenVersion ?? 0,
    },
    RESET_TOKEN_SECRET,
    { expiresIn: RESET_TOKEN_TTL }
  );
};

const verifyResetToken = (token) => {
  const payload = jwt.verify(token, RESET_TOKEN_SECRET);
  if (payload.type !== "RESET") {
    throw createError(401, "Invalid reset token");
  }
  return payload;
};


const createUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw createError(400, "Username, email and password are required");
  }

  if (!isValidEmail(email)) {
    throw createError(400, "Invalid email format");
  }

  if (password.length < 8) {
    throw createError(400, "Password must be at least 8 characters");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError(409, "User with this email already exists");
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = await User.create({
    username,
    email,
    passwordHash
  });

    const token = generateToken(user);

 res.status(201).json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  });
};



const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError(400, "Email and password are required");
  }

  if (!isValidEmail(email)) {
    throw createError(400, "Invalid email format");
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw createError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw createError(401, "Invalid email or password");
  }

   const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw createError(400, "Email is required");
  }

  if (!isValidEmail(email)) {
    throw createError(400, "Invalid email format");
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw createError(404, "User not found");
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const saltRounds = 10;
  const codeHash = await bcrypt.hash(code, saltRounds);

  user.resetCodeHash = codeHash;
  user.resetCodeExpiresAt = new Date(Date.now() + RESET_CODE_EXPIRY_MS);
  await user.save();

  await mailer.sendMail({
    from: EMAIL_USER,
    to: email,
    subject: "Reset your SpecifyAI password",
    text: `Your SpecifyAI password reset code is: ${code}`,
  });

  res.status(200).json({
    message: "Reset code sent",
  });
};

const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw createError(400, "Email and code are required");
  }

  const user = await User.findOne({ email }).select(
    "+passwordHash +resetCodeHash +resetCodeExpiresAt +resetTokenVersion"
  );
  if (!user) {
    throw createError(404, "User not found");
  }
  if (!user.resetCodeHash || !user.resetCodeExpiresAt) {
    throw createError(401, "Invalid or expired code");
  }

  if (user.resetCodeExpiresAt.getTime() < Date.now()) {
    throw createError(401, "Invalid or expired code");
  }

  const isMatch = await bcrypt.compare(code, user.resetCodeHash);
  if (!isMatch) {
    throw createError(401, "Invalid or expired code");
  }

  const resetToken = generateResetToken(user);
  res.status(200).json({ resetToken });
};

const resetPassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw createError(401, "Authorization token required");
  }

  const token = authHeader.split(" ")[1];
  let resetPayload = null;

  try {
    resetPayload = verifyResetToken(token);
  } catch (err) {
    resetPayload = null;
  }

  if (resetPayload) {
    if (!newPassword || !confirmPassword) {
      throw createError(400, "New password and confirmation are required");
    }

    if (newPassword !== confirmPassword) {
      throw createError(400, "Passwords do not match");
    }

    if (newPassword.length < 8) {
      throw createError(400, "Password must be at least 8 characters");
    }

    const user = await User.findById(resetPayload.userId).select(
      "+passwordHash +resetCodeHash +resetCodeExpiresAt +resetTokenVersion"
    );
    if (!user) {
      throw createError(404, "User not found");
    }

    if ((user.resetTokenVersion ?? 0) !== resetPayload.version) {
      throw createError(401, "Invalid or expired reset token");
    }

    const isSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSame) {
      throw createError(400, "New password must be different from old password");
    }

    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    user.resetCodeHash = null;
    user.resetCodeExpiresAt = null;
    user.resetTokenVersion = (user.resetTokenVersion ?? 0) + 1;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
    return;
  }

  let authPayload;
  try {
    authPayload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw createError(401, "Invalid or expired token");
  }

  if (!oldPassword || !newPassword) {
    throw createError(400, "Old password and new password are required");
  }

  if (newPassword.length < 8) {
    throw createError(400, "Password must be at least 8 characters");
  }

  if (oldPassword === newPassword) {
    throw createError(400, "New password must be different from old password");
  }

  const user = await User.findById(authPayload.userId).select(
    "+passwordHash +resetCodeHash +resetCodeExpiresAt +resetTokenVersion"
  );
  if (!user) {
    throw createError(404, "User not found");
  }

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    throw createError(403, "Old password is incorrect");
  }

  const saltRounds = 10;
  user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
  user.resetCodeHash = null;
  user.resetCodeExpiresAt = null;
  user.resetTokenVersion = (user.resetTokenVersion ?? 0) + 1;
  await user.save();

  res.status(200).json({ message: "Password updated successfully" });
};


module.exports = {
  createUser,
  loginUser,
  forgotPassword,
  verifyResetCode,
  resetPassword,
};
