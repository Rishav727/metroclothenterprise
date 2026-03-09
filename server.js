const express = require('express');
const cors = require('cors');
const path = require('path'); // Standard Node module for file paths
const app = express();

// --- 1. MIDDLEWARE (Must be before routes) ---
app.use(cors()); // Allows your website to talk to your backend
app.use(express.json()); // Essential for reading the UTR data you send

// --- 2. LOGGING (Helps you see requests in Render Logs) ---
app.use((req, res, next) => {
    console.log(`${req.method} request received at ${req.url}`);
    next();
});

// Temporary storage (Resets when server restarts)
let orders = [];

// --- 3. API ROUTES (Must be ABOVE static files) ---

// Submit a new UTR
const nodemailer = require('nodemailer'); // Add to the top of your file

// 1. Setup the Email Transporter (Use your Gmail and App Password)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'joypaul727856@gmail.com',
        pass: 'kvdfpsccyqdfoqbn' // The code from Google App Passwords
    }
});

app.post('/api/orders', (req, res) => {
    const { utr, amount, customer, phone, items } = req.body;

    // 1. Log exactly what the server received
    console.log(`📥 NEW ORDER RECEIVED: UTR ${utr} from ${customer}`);

    const newOrder = {
        utr, amount, customer, phone, items,
        status: 'pending',
        id: "MC" + Math.floor(Math.random() * 900000)
    };

    orders.push(newOrder);

    // 2. Setup the Email
    const mailOptions = {
        from: 'joypaul727856@gmail.com',
        to: 'joypaul727856@gmail.com',
        subject: `🚨 NEW ORDER: ₹${amount}`,
        text: `Customer: ${customer}\nUTR: ${utr}\nPhone: ${phone}`
    };

    // 3. Log Email Result
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("❌ EMAIL FAILED:", error.message);
        } else {
            console.log("✅ EMAIL SENT:", info.response);
        }
    });

    res.status(200).json({ message: "Order logged", orderId: newOrder.id });
});

// Check payment status
app.get('/api/order-status/:utr', (req, res) => {
    const order = orders.find(o => o.utr === req.params.utr);
    if (order) {
        res.json({ status: order.status });
    } else {
        res.status(404).json({ message: "UTR not found" });
    }
});

// Admin: Get all pending orders
app.get('/api/admin/pending', (req, res) => {
    res.json(orders.filter(o => o.status === 'pending'));
});

// Admin: Approve a payment
app.post('/api/admin/approve', (req, res) => {
    const { utr } = req.body;
    const order = orders.find(o => o.utr === utr);
    if (order) {
        order.status = 'approved';
        res.json({ message: "Approved!" });
    } else {
        res.status(404).json({ message: "Order not found" });
    }
});

app.post('/api/admin/reject', (req, res) => {
    const { utr } = req.body;
    const order = orders.find(o => o.utr === utr);
    if (order) {
        order.status = 'rejected'; // Polling will catch this
        res.json({ message: "Order rejected" });
    } else {
        res.status(404).json({ message: "Order not found" });
    }
});

// --- 4. STATIC FILES (Must be AFTER API routes) ---

// Serve all files (HTML, CSS, JS) from the root folder
app.use(express.static(__dirname));

// Handle the main website URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 5. START SERVER ---
const PORT = process.env.PORT || 10000; // Render dynamic port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/debug-email', (req, res) => {
    const testMail = {
        from: 'joypaul727856@gmail.com',
        to: 'joypaul727856@gmail.com', // Sending to yourself
        subject: '🚀 System Check: Metro Cloth Enterprise',
        text: 'If you see this, your Gmail & Nodemailer are working perfectly!'
    };

    transporter.sendMail(testMail, (error, info) => {
        if (error) {
            console.error("❌ TEST FAILED:", error.message);
            res.status(500).send("Error: " + error.message);
        } else {
            console.log("✅ TEST SUCCESS:", info.response);
            res.send("Success! Check your inbox (and Spam folder).");
        }
    });
});

// Variable to store dynamic payment details
let paymentDetails = {
    upiId: "123456@okaxis",
    bankName: "Axis Bank",
    accountHolder: "your name",
    accountNumber: "1234567890",
    ifsc: "UTIB0001234"
};

// Route to get payment details
app.get('/api/payment-details', (req, res) => {
    res.json(paymentDetails);
});

// Route to update payment details
app.post('/api/admin/update-payment', (req, res) => {
    paymentDetails = req.body;
    console.log("✅ Payment details updated:", paymentDetails);
    res.json({ message: "Settings updated successfully" });
});