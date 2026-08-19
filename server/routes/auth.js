const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Goal = require('../models/Goal');
const UserSettings = require('../models/UserSettings');

const publicUser = (user) => ({ id: user._id, email: user.email, displayName: user.displayName });
function establishSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) return reject(regenerateError);
      req.session.userId = userId.toString();
      req.session.save((saveError) => saveError ? reject(saveError) : resolve());
    });
  });
}
async function initializeUser(userId) {
  await Promise.all([
    Goal.updateOne({ userId }, { $setOnInsert: { dailyProfitTarget: 50, effectiveDate: new Date() } }, { upsert: true }),
    UserSettings.updateOne({ userId }, { $setOnInsert: { darkMode: false } }, { upsert: true })
  ]);
}
router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || password.length < 8) return res.status(400).json({ success: false, message: 'Email and an 8+ character password are required.' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ success: false, message: 'An account already exists for this email.' });
  const user = await User.create({ email, displayName, authProvider: 'local', passwordHash: await bcrypt.hash(password, 12) });
  await initializeUser(user._id); await establishSession(req, user._id);
  res.status(201).json({ success: true, data: publicUser(user) });
});
router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() }).select('+passwordHash');
  if (!user || !user.passwordHash || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  await establishSession(req, user._id); res.json({ success: true, data: publicUser(user) });
});
router.post('/google', async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ success: false, message: 'Google Sign-In is not configured.' });
  const ticket = await new OAuth2Client(process.env.GOOGLE_CLIENT_ID).verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
  const profile = ticket.getPayload();
  let user = await User.findOne({ email: profile.email.toLowerCase() });
  if (!user) user = await User.create({ email: profile.email, displayName: profile.name, googleId: profile.sub, authProvider: 'google' });
  await initializeUser(user._id); await establishSession(req, user._id); res.json({ success: true, data: publicUser(user) });
});
router.post('/logout', (req, res, next) => req.session.destroy((error) => error ? next(error) : res.json({ success: true })));
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.json({ success: true, data: null });
  const user = await User.findById(req.session.userId); res.json({ success: true, data: publicUser(user) });
});
module.exports = router;
