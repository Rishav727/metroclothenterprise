const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(express.static('public'));

// Temporary storage (In a real app, use MongoDB)
let orders = [];

// 1. Endpoint for User to submit UTR
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

// 2. Endpoint for Frontend to check status (Polling)
app.get('/api/order-status/:utr', (req, res) => {
    const order = orders.find(o => o.utr === req.params.utr);
    if (order) {
        res.json({ status: order.status });
    } else {
        res.status(404).json({ message: "Not found" });
    }
});

// 3. ADMIN PANEL: View all pending payments
app.get('/api/admin/pending', (req, res) => {
    res.json(orders.filter(o => o.status === 'pending'));
});

// 4. ADMIN PANEL: Approve a payment
app.post('/api/admin/approve', (req, res) => {
    const { utr } = req.body;
    const order = orders.find(o => o.utr === utr);
    if (order) {
        order.status = 'approved';
        res.json({ message: "Approved!" });
    }
});

const PORT = process.env.PORT || 10000; // Render prefers 10000 or dynamic ports
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});