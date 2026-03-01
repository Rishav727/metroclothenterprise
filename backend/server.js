require("dotenv").config();

const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");

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
app.post("/verify-payment", async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    email,
    name,
    amount
  } = req.body;

  const generated = crypto
    .createHmac("sha256", process.env.KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated === razorpay_signature) {

    // 📩 Send email to owner
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "🛒 New Order Received",
      html: `
        <h2>New Payment Received</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Amount:</b> ₹${amount/100}</p>
        <p><b>Payment ID:</b> ${razorpay_payment_id}</p>
      `,
    });

    res.json({ success: true });

  } else {
    res.json({ success: false });
  }
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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


app.post("/submit-payment", async (req,res)=>{

  const {name,amount,utr} = req.body;

  await db.collection("payments").insertOne({
    name,
    amount,
    utr,
    status:"pending",
    created:new Date()
  });

  res.json({success:true});
});



app.post("/submit-payment", async (req,res)=>{

  const {name,amount,utr} = req.body;

  await db.collection("payments").insertOne({
    name,
    amount,
    utr,
    status:"pending",
    created:new Date()
  });

  res.json({success:true});
});



app.get("/admin-payments", async (req,res)=>{

  const payments = await db.collection("payments")
  .find().sort({created:-1}).toArray();

  res.json(payments);

});





app.post("/approve-payment", async (req,res)=>{

  await db.collection("payments").updateOne(
    {utr:req.body.utr},
    {$set:{status:"approved"}}
  );

  res.json({success:true});

});