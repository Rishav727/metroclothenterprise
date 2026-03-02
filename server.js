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
        pass: 'voxuzpibsrzklumz' // The code from Google App Passwords
    }
});

app.post('/api/orders', (req, res) => {
    const { utr, amount, customer, phone, items } = req.body;

    if (!utr) {
        return res.status(400).json({ message: "UTR is missing" });
    }

    const newOrder = {
        utr,
        amount,
        customer,
        phone,
        items,
        status: 'pending',
        id: "MC" + Math.floor(Math.random() * 900000)
    };

    orders.push(newOrder);
    console.log("Success: Payment Logged for UTR:", utr);

    // --- EMAIL NOTIFICATION LOGIC ---
    const mailOptions = {
        from: 'YOUR_GMAIL@gmail.com',
        to: 'YOUR_GMAIL@gmail.com', // Receive alerts at this email
        subject: `🚨 New Order: ₹${amount} from ${customer}`,
        html: `
            <div style="font-family: Arial, sans-serif; border: 1px solid #4b2e1e; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4b2e1e;">New Payment Received</h2>
                <p><strong>Customer:</strong> ${customer}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Amount:</strong> ₹${amount}</p>
                <p><strong>UTR Number:</strong> <span style="color: blue; font-size: 1.2em;">${utr}</span></p>
                <hr>
                <p>Check your bank app for this UTR, then approve it in your <a href="https://metroclothenterprise.onrender.com/admin.html">Admin Panel</a>.</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Email error:", error);
        } else {
            console.log("Admin Notification Sent: " + info.response);
        }
    });
    // --- END EMAIL LOGIC ---

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