const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();
app.use(cors());
app.use(express.json());

const startServer = async () => {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB Database successfully');

  const routes = require('./routes');
  app.use('/api', routes);

  app.listen(5000, () => {
    console.log('🚀 Server running on http://localhost:5000');
  });
};

startServer().catch((err) => console.error('Connection Error:', err));