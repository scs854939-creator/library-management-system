const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize MongoMemoryServer with compatible version 7.0.0 for Render (Debian 12)
const startServer = async () => {
  try {
    const mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.0'
      }
    });

    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('Connected to In-Memory MongoDB');

    app.get('/', (req, res) => {
      res.send('Library Management API is running...');
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
