const express = require('express');
const cors = require('cors');
const path = require('path'); // Standard Node module for file paths
const app = express();

app.use(express.json());
app.use(cors());

// 1. SERVE STATIC FILES FROM ROOT
// This tells the server to allow access to index.html, admin.html, etc.
app.use(express.static(__dirname)); 

// 2. EXPLICITLY HANDLE THE HOME PAGE
// This fixes the "Cannot GET /" error
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Temporary storage
let orders = [];

// --- Your API Routes ---

app.post('/api/orders', (req, res) => {
    const { utr, amount, customer, phone, items } = req.body;
    const newOrder = { 
        utr, amount, customer, phone, items, 
        status: 'pending', 
        id: "MC" + Math.floor(Math.random() * 900000) 
    };
    orders.push(newOrder);
    console.log("New Payment Received:", utr);
    res.status(200).send({ message: "Order logged" });
});

app.get('/api/order-status/:utr', (req, res) => {
    const order = orders.find(o => o.utr === req.params.utr);
    if (order) {
        res.json({ status: order.status });
    } else {
        res.status(404).json({ message: "Not found" });
    }
});

app.get('/api/admin/pending', (req, res) => {
    res.json(orders.filter(o => o.status === 'pending'));
});

app.post('/api/admin/approve', (req, res) => {
    const { utr } = req.body;
    const order = orders.find(o => o.utr === utr);
    if (order) {
        order.status = 'approved';
        res.json({ message: "Approved!" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});