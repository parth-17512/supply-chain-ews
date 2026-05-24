const mongoose = require('mongoose');

async function clearData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/supply_chain_ews');
    console.log('Connected to MongoDB');
    
    // Drop the entire database to wipe all dummy collections
    await mongoose.connection.db.dropDatabase();
    console.log('✅ All dummy data (bunny data!) has been wiped clean!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error wiping database:', err);
    process.exit(1);
  }
}

clearData();
