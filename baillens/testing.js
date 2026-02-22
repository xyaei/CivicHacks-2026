const anchor = require("@coral-xyz/anchor");
const crypto = require("crypto");
const fs = require("fs");
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb+srv://jj1057:Aeu96wEOfq3sg7vP@bailinfo.vu0nho7.mongodb.net/bailinfo?appName=BailInfo")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));

const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://jj1057:Aeu96wEOfq3sg7vP@bailinfo.vu0nho7.mongodb.net/bailinfo?appName=BailInfo")
  .then(() => console.log("connected"))
  .catch(err => console.log(err));

setTimeout(async () => {
  const db = mongoose.connection.db;
  const sample = await db.collection("cases").findOne();
  console.log("Sample record:", JSON.stringify(sample, null, 2));
  mongoose.disconnect();
}, 2000);