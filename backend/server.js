require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Railway health check route (MUST respond fast)
app.get('/', (req, res) => {
    res.status(200).send("OK");
});

// Your existing API route
app.post('/send-sms', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    const smsText = `New portfolio inquiry!\nFrom: ${name}\nEmail: ${email}\nMessage: ${message}`;

    try {
        console.log("Form submission received:");
        console.log(smsText);

        res.json({
            success: true,
            message: 'Your message has been sent successfully!'
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = process.env.PORT || 3000;

// IMPORTANT: bind to 0.0.0.0 for Railway
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});