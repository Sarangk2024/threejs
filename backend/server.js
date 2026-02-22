require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const twilio  = require('twilio');

const app = express();

// Allow all origins (Vercel frontend)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => res.json({ status: 'Sarang Portfolio Backend running' }));

app.post('/send-sms', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    const smsText = `New portfolio inquiry!\nFrom: ${name}\nEmail: ${email}\nMessage: ${message}`;

    try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const msg = await client.messages.create({
            body: smsText,
            to:   process.env.MY_PHONE,
            from: process.env.TWILIO_PHONE
        });
        console.log('SMS sent:', msg.sid);
        res.json({ success: true, message: 'Your message has been sent successfully!' });
    } catch (err) {
        console.error('SMS error:', err.message);
        res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Portfolio backend running on port ${PORT}`));
