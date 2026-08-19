const app = require('./app'); const connectDatabase = require('./config/db');
const port = process.env.PORT || 5000;
connectDatabase().then(() => app.listen(port, () => console.log(`TradeTracker API listening on ${port}`))).catch((error) => { console.error(error.message); process.exit(1); });
