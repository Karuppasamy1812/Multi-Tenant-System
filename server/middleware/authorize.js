import AppError from '../config/AppError.js';

// Tenant-level role check — owner > admin > member
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role))
    return next(new AppError('You do not have permission to do this', 403));
  next();
};

export default authorize;
