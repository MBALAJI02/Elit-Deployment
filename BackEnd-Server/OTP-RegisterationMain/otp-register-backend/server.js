const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const PORT = process.env.PORT;

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URL, {
}).then(() => {
  console.log('✅ MongoDB successfully connected');
})
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

const UserSchema = new mongoose.Schema({
  contact: String,
  otp: String,
  username: { type: String, unique: true, sparse: true },
  verified: { type: Boolean, default: false },
  pushToken: String,
  createdAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: null },
  online: { type: Boolean, default: false }
}, { versionKey: false });

const User = mongoose.model('User', UserSchema);

const MessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  message: String,
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { versionKey: false });

const Message = mongoose.model('Message', MessageSchema);


function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.USEREMAIL,
//     pass:  process.env.USEREMAILPASS
//   },
//   tls: {
//     rejectUnauthorized: false
//   }
// });

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",                    
    pass: process.env.SENDGRID_API_KEY 
  },
  tls: {
    rejectUnauthorized: false
  }
});



app.post('/send-otp', async (req, res) => {
  const { contact } = req.body;

  const verifiedUser = await User.findOne({ contact, verified: true });
  if (verifiedUser && verifiedUser != undefined) {
    return res.json({
      result_code: "1",
      result_text: 'User already registered'
    });
  }

  const unverifiedUser = await User.findOne({ contact, verified: false });
  if (unverifiedUser && unverifiedUser != undefined) {
    await User.deleteOne({ contact });
  }


  const otp = generateOTP();
  console.log('Generated OTP:::', otp);

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
      console.log('Email sent to:', contact);
    } catch (error) {
      console.error('Email sending failed:', error);
      return res.status(500).json({ message: 'Failed to send email' });
    }
  }
  res.json({
    result_code: "0",
    result_text: 'OTP sent'
  });
});

app.post('/verify-otp', async (req, res) => {
  const { contact, otp } = req.body;
  const user = await User.findOne({ contact, otp });

  if (!user) {
    return res.json({
      result_code: "1",
      result_text: 'Invalid OTP'
    });
  }

  // await User.deleteMany({ contact });
  user.verified = true;
  user.otp = undefined;
  await user.save();

  res.json({
    result_code: "0",
    result_text: 'Verification successful'
  });
});


app.post('/check-contact', async (req, res) => {
  const { contact } = req.body;

  const user = await User.findOne({ contact });

  if (!user) {
    return res.json({
      result_code: "1",
      result_text: 'User not found'
    });
  }

  res.json({
    result_code: "0",
    result_text: 'User found',
    username: user.username
  });
});




app.post('/save-username', async (req, res) => {
  const { contact, username } = req.body;

  const user = await User.findOne({ contact });

  if (!user) {
    return res.json({
      result_code: "1",
      result_text: 'User not found'
    });
  }

  user.username = username;
  user.verified = true;
  await user.save();

  res.json({
    result_code: "1",
    result_text: 'Username saved successfully!'
  });
});

app.post('/save-token', async (req, res) => {
  const { username, pushToken } = req.body;

  if (!username || !pushToken) {
    return res.json({
      result_code: "1",
      result_text: 'Missing username or pushToken'
    });
  }

  try {
    // Save token to DB 
    await User.updateOne(
      { username },
      { $set: { pushToken } },
      { upsert: true }
    );

    res.json({
      result_code: "0",
      result_text: 'Token saved successfully',
    });
  } catch (err) {
    console.error('Error saving token:::', err);
    res.json({
      result_code: "1",
      result_text: 'Server error'
    });
  }
});

app.post('/notify-user', async (req, res) => {
  const { sender, receiver, title, body } = req.body;

  try {
    const user = await User.findOne({ username: receiver });

    if (!user || !user.pushToken) {
      return res.json({
        result_code: "1",
        result_text: 'Receiver not found or no push token'
      });
    }

    // Just return the payload — don't send it from here
    const payload = {
      token: user.pushToken,
      body: title,
      title: `${sender} says: ${body}`
    };

    res.json({
      result_code: "0",
      result_text: 'Ready to notify', payload
    });

  } catch (err) {
    console.error('Error preparing notification:', err);
    res.json({
      result_code: "1",
      result_text: 'Failed to prepare notification'
    });
  }
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
    return res.json({
      result_code: "0",
      result_text: 'Missing required fields'
    });
  }

  try {
    const newMsg = new Message({ from, to, message });
    await newMsg.save();
    res.status(201).json({
      result_code: "0",
      message: 'Message saved successfully'
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.json({
      result_code: "1",
      result_text: 'Server error'
    });
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

    res.json(messages)

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.json({
      result_code: "1",
      result_text: 'Server error'
    });
  }
});

// messages are stored inDB
app.get('/get-messaged-users/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const messages = await Message.find({
      $or: [{ from: username }, { to: username }]
    });

    const users = new Set();
    messages.forEach(msg => {
      if (msg.from != username) users.add(msg.from);
      if (msg.to != username) users.add(msg.to);
    });

    res.json([...users]);

  } catch (err) {
    res.json({ error: 'Error fetching users' });
  }
});

app.post('/check-contact-exist', async (req, res) => {
  try {
    const { contact } = req.body;
    console.log("Received contact to check:", contact);

    // To check if the contact exists
    const user = await User.findOne({ contact });

    if (user) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking contact:', error);
    res.json({
      result_code: "1",
      result_text: 'Server error'
    });
  }
});

app.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length == 0) {
      return res.json({
        result_code: "1",
        result_text: 'Username is required'
      });
    }

    const user = await User.findOne({ username });

    if (user) {
      return res.json({ exists: true });
    }

    res.json({ exists: false });
  } catch (err) {
    console.error('Error checking username:', err);
    res.json({
      result_code: "1",
      result_text: 'Server error'
    });
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
    res.json({
      result_code: "1",
      result_text: 'Server error'
    });
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
    res.status(200).json({
      result_code: "0",
      result_text: 'Messages marked as read'
    });
  } catch (error) {
    console.error(error);
    res.json({
      result_code: "1",
      result_text: 'Server error'
    });
  }
});

app.post('/reset-unread', async (req, res) => {
  const { from, to } = req.body;

  try {
    await Message.updateMany(
      { from: to, to: from, read: false },
      { $set: { read: true } }
    );

    res.json({
      result_code: "0",
      result_text: 'Unread messages marked as read'
    });
  } catch (err) {
    console.error('Error resetting unread in DB:', err);
    res.json({
      result_code: "1",
      result_text: 'Error resetting unread count'
    });
  }
});

app.get('/user-status/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      online: false,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    res.json({
      result_code: "1",
      result_text: 'Server error'
    });
  }
});

// Update last seen when notified by WebSocket
app.post('/update-last-seen', async (req, res) => {
  const { username, lastSeen } = req.body;
  try {
    await User.updateOne({ username }, { lastSeen: new Date(lastSeen) });
    res.status(200).json({
      result_code: "0",
      result_text: 'Last seen updated'
    });
  } catch (error) {
    console.error('Error updating last seen:', error);
    res.json({
      result_code: "1",
      result_text: 'Server error'
    });
  }
});

app.listen(PORT, () => console.log('Server running on http://localhost:3000'));

app.get('/', (req, res) => {
  res.send('✅ OTP Backend is up and running!');
});