const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB server for testing
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  // Close database connection with timeout
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  } catch (error) {
    console.warn('Error closing database connection:', error.message);
  }

  // Stop the in-memory MongoDB server with timeout
  try {
    if (mongoServer) {
      await Promise.race([
        mongoServer.stop(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB server stop timeout')), 5000))
      ]);
    }
  } catch (error) {
    console.warn('Error stopping MongoDB server:', error.message);
  }
}, 10000);

afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
