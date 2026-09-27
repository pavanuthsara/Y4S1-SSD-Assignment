import Buyer from '../models/buyer.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { generateToken } from '../utils/generateToken.js';
import transporter from '../config/email.js';

// LOGIN
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await Buyer.findOne({ email });

    if (!user) {
      res.statusCode = 404;
      throw new Error('Invalid email address. Please check your email and try again.');
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      res.statusCode = 401;
      throw new Error('Invalid password. Please check your password and try again.');
    }

    generateToken(req, res, user._id);

    res.status(200).json({
      message: 'Login successful.',
      userId: user._id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

// REGISTER
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await Buyer.findOne({ email });

    if (userExists) {
      res.statusCode = 409;
      throw new Error('User already exists. Please choose a different email.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new Buyer({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    generateToken(req, res, user._id);

    res.status(201).json({
      message: 'Registration successful. Welcome!',
      userId: user._id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

// LOGOUT
const logoutUser = (req, res) => {
  res.clearCookie('jwt', { httpOnly: true });
  res.status(200).json({ message: 'Logout successful' });
};

// GET PROFILE
const getUserProfile = async (req, res, next) => {
  try {
    const user = await Buyer.findById(req.user._id);

    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found!');
    }

    res.status(200).json({
      message: 'User profile retrieved successfully',
      userId: user._id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PROFILE
const updateUserProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await Buyer.findById(req.user._id);

    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found. Unable to update profile.');
    }

    user.name = name || user.name;
    user.email = email || user.email;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.passwordChangedAt = Date.now() - 1000;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      message: 'User profile updated successfully.',
      userId: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email
    });
  } catch (error) {
    next(error);
  }
};

// PASSWORD RESET EMAIL
const PASSWORD_RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

const resetPasswordRequest = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await Buyer.findOne({ email });

    // Always return the same response whether or not the account exists.
    if (!user) {
      return res.status(200).json({ message: 'If an account exists for this email, we\'ve sent you a password reset link. Please check your inbox.' });
    }

    // Generate a single-use random token (never signed with the session JWT secret).
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS);
    await user.save();

    const frontendUrl = (process.env.PASSWORD_RESET_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const passwordResetLink = `${frontendUrl}/reset-password/${user._id}/${resetToken}`;

    await transporter.sendMail({
      from: `Freshly <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset',
      html: `<p>Hi ${user.name},</p>
        <p>Click below to reset your password:</p>
        <p><a href="${passwordResetLink}" target="_blank">${passwordResetLink}</a></p>
        <p>If you didn't request this, ignore this email. The link expires in 15 minutes.</p>`
    });

    res.status(200).json({ message: 'If an account exists for this email, we\'ve sent you a password reset link. Please check your inbox.' });
  } catch (error) {
    next(error);
  }
};

// RESET PASSWORD
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { id: userId, token } = req.params;
    const user = await Buyer.findById(userId);

    if (!user || !user.resetPasswordToken || !user.resetPasswordExpire) {
      res.statusCode = 401;
      throw new Error('Invalid or expired reset token');
    }

    if (user.resetPasswordExpire.getTime() < Date.now()) {
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();
      res.statusCode = 401;
      throw new Error('Reset link has expired. Please request a new one.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const storedBuffer = Buffer.from(user.resetPasswordToken, 'hex');
    const providedBuffer = Buffer.from(hashedToken, 'hex');
    const isTokenValid =
      storedBuffer.length === providedBuffer.length &&
      crypto.timingSafeEqual(storedBuffer, providedBuffer);

    if (!isTokenValid) {
      res.statusCode = 401;
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    user.passwordChangedAt = Date.now() - 1000;
    await user.save();

    res.clearCookie('jwt', { httpOnly: true });
    res.status(200).json({ message: 'Password successfully reset. Please log in with your new password.' });
  } catch (error) {
    next(error);
  }
};

export {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  resetPasswordRequest,
  resetPassword
};
