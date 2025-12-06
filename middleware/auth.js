// Check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Please login to access this resource' });
  }
  next();
};

// Check if user has specific role
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Please login to access this resource' });
    }

    if (!roles.includes(req.session.userRole)) {
      return res.status(403).json({ 
        message: 'You do not have permission to access this resource' 
      });
    }

    next();
  };
};

module.exports = { isAuthenticated, hasRole };