require("dotenv").config();

const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ middlewares FIRST
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve frontend if inside /public

// ✅ Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});


// =======================
// CREATE ORDER
// =======================
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount, // already in paise from frontend
      currency: "INR",
    });

    res.json(order);
  } catch (err) {
    console.log("ORDER ERROR:", err);
    res.status(500).json({ error: "Order failed" });
  }
});


// =======================
// VERIFY PAYMENT
// =======================
app.post("/verify-payment", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const generated = crypto
      .createHmac("sha256", process.env.KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated === razorpay_signature) {
      console.log("✅ Payment verified");
      res.json({ success: true });
    } else {
      console.log("❌ Signature mismatch");
      res.json({ success: false });
    }
  } catch (err) {
    console.log("VERIFY ERROR:", err);
    res.json({ success: false });
  }
});


// =======================
// ROOT ROUTE (for Render health check)
// =======================
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});


// =======================
// IMPORTANT FOR RENDER
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
