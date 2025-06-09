const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const PORT = process.env.PORT;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB successfully connected');
})
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

const User = mongoose.model('User', {
  contact: String,
  otp: String,
  username: { type: String, unique: true, sparse: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', {
  from: String,
  to: String,
  message: String,
  read: { type: Boolean, default: false },  
  timestamp: { type: Date, default: Date.now }
});



function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'balajimohan941@gmail.com', 
    pass: 'jzuu kodx dpcf xmth' 
  },
  tls: {
    rejectUnauthorized: false
  }
});


app.post('/send-otp', async (req, res) => {
  const { contact } = req.body;

  const verifiedUser = await User.findOne({ contact, verified: true });
  if (verifiedUser) {
    return res.status(400).json({ message: 'User already registered' });
  }

  const unverifiedUser = await User.findOne({ contact, verified: false });
  if (unverifiedUser) {
    await User.deleteOne({ contact });
  }


  const otp = generateOTP();
  console.log('Generated OTP::::::::::::::::::::::', otp);

  const user = new User({ contact, otp });
  await user.save();

    if (contact.includes('@')) {
      try {
        await transporter.sendMail({
          from: 'yourgmail@gmail.com',
          to: contact,
          subject: 'Your OTP Code',
          text: `Your OTP is: ${otp}`
        });
        console.log('✅ Email sent to', contact);
      } catch (error) {
        console.error('Email sending failed:', error);
        return res.status(500).json({ message: 'Failed to send email' });
      }
    }

  res.json({ message: 'OTP sent' });
});

app.post('/verify-otp', async (req, res) => {
  const { contact, otp } = req.body;
  const user = await User.findOne({ contact, otp });

  if (!user) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  // await User.deleteMany({ contact });
  user.verified = true;
  user.otp = undefined;
  await user.save();

  res.json({ message: 'Verification successful' });
});


app.post('/check-contact', async (req, res) => {
  const { contact } = req.body;

  const user = await User.findOne({ contact });

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  res.json({ message: 'User found', username: user.username || null });
});




app.post('/save-username', async (req, res) => {
  const { contact, username } = req.body;


  const user = await User.findOne({ contact });

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }


  user.username = username;
  user.verified = true;
  await user.save();

  res.json({ message: 'Username saved successfully!' });
});

app.post('/search-user', async (req, res) => {
  const { query } = req.body;

  const users = await User.find({
    username: { $regex: new RegExp(query, 'i') },
    verified: true
  }).select('username _id');

  res.json(users);
});

app.post('/send-message', async (req, res) => {
  const { from, to, message } = req.body;

  if (!from || !to || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newMsg = new Message({ from, to, message });
    await newMsg.save();
    res.status(201).json({ message: 'Message saved successfully' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.get('/get-messages/:from/:to', async (req, res) => {
  const { from, to } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { from, to },
        { from: to, to: from }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assuming messages are stored in MongoDB
app.get('/get-messaged-users/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const messages = await Message.find({
      $or: [{ from: username }, { to: username }]
    });

    const users = new Set();
    messages.forEach(msg => {
      if (msg.from !== username) users.add(msg.from);
      if (msg.to !== username) users.add(msg.to);
    });

    res.json([...users]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

app.post('/check-contact-exist', async (req, res) => {
  try {
    const { contact } = req.body;
    console.log("Received contact to check:", contact);

    // Use Mongoose User model to check if the contact exists
    const user = await User.findOne({ contact });

    if (user) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking contact:', error);
    res.status(500).json({ error: 'Server error. Try again later.' });
  }
});

app.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const user = await User.findOne({ username });

    if (user) {
      return res.status(200).json({ exists: true }); // 200 OK, not 400
    }

    res.status(200).json({ exists: false }); // 200 OK
  } catch (err) {
    console.error('Error checking username:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/clear-message/:username/:messagesToDelete', async (req, res) => {
  const { username, messagesToDelete } = req.params;
  try {
    await Message.deleteMany({
      $or: [
        { from: username, to: messagesToDelete },
        { from: messagesToDelete, to: username }
      ]
    });

    res.sendStatus(200);
  } catch (err) {
    console.error('Messages Clear error:', err);
    res.status(500).send('Server error');
  }
});



// Node.js route: GET /get-unread-messages/:username
app.get('/get-unread-messages/:username', async (req, res) => {
  const username = req.params.username;

  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          { from: username },
          { to: username }
        ]
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$from', username] },
            '$to',
            '$from'
          ]
        },
        lastMessage: { $first: '$message' },
        lastMessageTime: { $first: '$timestamp' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$to', username] }, { $eq: ['$read', false] }] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  res.json(messages.map(m => ({
    username: m._id,
    lastMessage: m.lastMessage,
    lastMessageTime: m.lastMessageTime,
    count: m.unreadCount
  })));
});



app.post('/mark-messages-read', async (req, res) => {
  const { from, to } = req.body;

  try {
    await Message.updateMany(
      { from: to, to: from, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: 'Messages marked as read' }); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.listen(PORT, () => console.log('Server running on http://localhost:3000'));

app.get('/', (req, res) => {
  res.send('✅ OTP Backend is up and running!');
});