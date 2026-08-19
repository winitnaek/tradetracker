require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express'); const session = require('express-session'); const MongoStore = require('connect-mongo');
const cors = require('cors'); const helmet = require('helmet'); const morgan = require('morgan'); const auth = require('./middleware/auth');
const cspKeyword = value => String.fromCharCode(39) + value + String.fromCharCode(39);
const productionCsp = { directives: {
  defaultSrc: [cspKeyword('self')],
  scriptSrc: [cspKeyword('self'), 'https://accounts.google.com'],
  frameSrc: [cspKeyword('self'), 'https://accounts.google.com'],
  connectSrc: [cspKeyword('self'), 'https://accounts.google.com'],
  styleSrc: [cspKeyword('self'), cspKeyword('unsafe-inline'), 'https://accounts.google.com'],
  imgSrc: [cspKeyword('self'), 'data:', 'https://*.googleusercontent.com'],
  fontSrc: [cspKeyword('self'), 'data:']
} };
const helmetOptions = process.env.NODE_ENV === 'production'
  ? {
      contentSecurityPolicy: productionCsp,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
    }
  : {
      contentSecurityPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
    };
const app = express(); app.set('trust proxy', 1); app.use(helmet(helmetOptions)); app.use(morgan('dev')); app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(session({ name: 'tradetracker.sid', secret: process.env.SESSION_SECRET || 'development-only-change-me', proxy: true, resave: false, saveUninitialized: false, store: process.env.MONGODB_URI ? MongoStore.create({ mongoUrl: process.env.MONGODB_URI }) : undefined, cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', maxAge: 7 * 86400000 } }));
app.get('/api/health', (_req, res) => res.json({ success: true })); app.use('/api/auth', require('./routes/auth'));
app.use('/api/trades', auth, require('./routes/trades')); app.use('/api/goals', auth, require('./routes/goals')); app.use('/api/dashboard', auth, require('./routes/dashboard')); app.use('/api/providers', auth, require('./routes/providers'));
app.use('/api/reports',auth,require('./routes/reports'));app.use('/api/settings',auth,require('./routes/settings'));
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../client/dist');

  app.use(express.static(clientDist));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use((error, _req, res, _next) => { console.error(error); const validation = error.name === 'ValidationError'; res.status(error.status || (validation ? 400 : 500)).json({ success: false, message: validation ? Object.values(error.errors)[0].message : (error.status ? error.message : 'Something went wrong.') }); });
module.exports = app;
