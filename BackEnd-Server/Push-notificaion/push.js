// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const notificationRoutes = require('./notification.routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PN_PORT;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Register notification routes
app.use('/api', notificationRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
