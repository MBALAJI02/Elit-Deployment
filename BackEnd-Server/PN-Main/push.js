// server.js
const express = require('express');
const bodyParser = require('body-parser');
const notificationRoutes = require('./notification.routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PN_PORT;

app.use(bodyParser.json());

// Register notification routes
app.use('/api', notificationRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
