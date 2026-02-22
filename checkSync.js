const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://jj1057:Aeu96wEOfq3sg7vP@bailinfo.vu0nho7.mongodb.net/bailinfo?appName=BailInfo")
  .then(() => console.log("connected"))
  .catch(err => console.log(err));

setTimeout(async () => {
  const db = mongoose.connection.db;
  const total = await db.collection("cases").countDocuments();
  const synced = await db.collection("cases").countDocuments({ solana_tx: { $exists: true } });
  console.log(`Total records: ${total}`);
  console.log(`Synced to Solana: ${synced}`);
  console.log(`Not yet synced: ${total - synced}`);
  mongoose.disconnect();
}, 2000);
