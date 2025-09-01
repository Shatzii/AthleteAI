const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for migration');
  } catch (error) {
    console.error('Migration DB connection failed:', error.message);
    process.exit(1);
  }
};

const runMigrations = async () => {
  await connectDB();

  // Example migration: Ensure indexes on User model
  const User = require('./models/User');
  await User.ensureIndexes();

  // Add more migrations here as needed
  console.log('Migrations completed successfully');

  process.exit(0);
};

runMigrations().catch(console.error);
