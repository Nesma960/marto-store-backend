import jwt from 'jsonwebtoken';

export function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Server authentication is not configured.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access only.',
      });
    }

    req.admin = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
    }

    console.error('Authentication failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred.',
    });
  }
}
