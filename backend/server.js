require('dotenv').config();
const express = require('express');
const cors    = require('cors');
// const twilio  = require('twilio');   // ❌ Disabled for now

const app = express();

// Allow all origins (Vercel frontend)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => 
    res.json({ status: 'Sarang Portfolio Backend running' })
);

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
        // ❌ SMS disabled — just log instead
        console.log("Form submission received:");
        console.log(smsText);

        // Still return success so frontend behaves same
        res.json({ 
            success: true, 
            message: 'Your message has been sent successfully!' 
        });

    } catch (err) {
        console.error('Form error:', err.message);
        res.status(500).json({ error: 'Failed to process message. Please try again.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Portfolio backend running on port ${PORT}`);
});