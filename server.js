const express = require('express');
const path = require('path');
const app = express();

// Serve index.html and static files from root directory
app.use(express.static(__dirname));

// Send index.html when users visit the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Book API Endpoint
app.get('/api/books', (req, res) => {
  res.json([
    { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", status: "Available" },
    { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee", status: "Checked Out" }
  ]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));