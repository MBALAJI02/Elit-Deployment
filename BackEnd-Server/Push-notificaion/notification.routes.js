// notification.routes.js
const express = require('express');
const router = express.Router();
const cors = require('cors');
const { sendNotification } = require('./notification.controller');

app.use(cors());

router.post('/send-notification', async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await sendNotification(token, title, body);
    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send notification', error: err.message });
  }
});

module.exports = router;
