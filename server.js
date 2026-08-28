const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple In-Memory Data Store
let books = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', status: 'Available' },
  { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee', status: 'Checked Out' }
];

app.get('/', (req, res) => {
  res.send('Library Management API is running live!');
});

app.get('/api/books', (req, res) => {
  res.json(books);
});

app.post('/api/books', (req, res) => {
  const newBook = { id: Date.now(), ...req.body };
  books.push(newBook);
  res.status(201).json(newBook);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
