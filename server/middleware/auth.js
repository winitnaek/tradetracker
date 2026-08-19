module.exports = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ success: false, message: 'Authentication required.' });
  req.user = { id: req.session.userId };
  next();
};

