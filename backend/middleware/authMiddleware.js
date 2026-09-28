// backend/middleware/authMiddleware.js

import Buyer from '../models/buyer.model.js';
import jwt from 'jsonwebtoken';

// Middleware to protect routes by verifying JWT authentication token.
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // If no token in header, check cookies
    else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    if (!token) {
      res.statusCode = 401;
      throw new Error('Authentication failed: Token not provided.');
    }
    
    // REMEDIATION: Fail fast if the secret is missing from the environment
    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET is not defined in the environment.');
      res.statusCode = 500;
      throw new Error('Internal server error.');
    }
    
    // REMEDIATION: Pin the algorithm to HS256 to prevent algorithm confusion attacks
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
    
    if (!decodedToken) {
      res.statusCode = 401;
      throw new Error('Authentication failed: Invalid token.');
    }
    
    req.user = await Buyer.findById(decodedToken.userId).select('-password');
    
    if (!req.user) {
      res.statusCode = 401;
      throw new Error('Authentication failed: User not found.');
    }

    // Check if password was changed after the token was issued
    if (req.user.passwordChangedAt) {
      const changedTimestamp = parseInt(req.user.passwordChangedAt.getTime() / 1000, 10);
      if (decodedToken.iat < changedTimestamp) {
        res.statusCode = 401;
        throw new Error('Authentication failed: Password recently changed. Please log in again.');
      }
    }
    
    next();
  } catch (error) {
    // Catch specific JWT errors (like tampered or expired tokens) and return 401
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.statusCode = 401;
      next(new Error('Authentication failed: Invalid or expired token.'));
    } else {
      next(error);
    }
  }
};

// Middleware to check if user is an admin
const admin = (req, res, next) => {
  try {
    // The protect middleware must be used before this middleware
    if (!req.user) {
      res.statusCode = 401;
      throw new Error('Authentication failed: User not authenticated.');
    }
    
    // Check if user has admin status
    if (!req.user.isAdmin) {
      res.statusCode = 403;
      throw new Error('Authorization failed: Admin access required.');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export { protect, admin };