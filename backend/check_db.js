const mongoose = require("mongoose");
require("dotenv").config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB cluster");
    const adminDb = mongoose.connection.client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log("Databases on cluster:");
    for (let dbInfo of dbs.databases) {
      console.log(`Database: ${dbInfo.name}`);
      const db = mongoose.connection.client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      for (let col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`  - ${col.name}: ${count} documents`);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
