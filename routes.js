const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = 'your_jwt_secret_key';
const users = []; // In-memory user store for testing

// --- MIDDLEWARE ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Admin privileges required' });
  }
};

// --- AUTHENTICATION ROUTES ---
router.post('/auth/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ id: Date.now(), username, password: hashedPassword, role: role || 'USER' });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '2h' });
    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', verifyToken, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

// --- SCHEMAS ---
const Book = mongoose.models.Book || mongoose.model('Book', new mongoose.Schema({
  title: String, author: String, category: String, isbn: String, quantity: Number, availableQuantity: Number
}));
const Member = mongoose.models.Member || mongoose.model('Member', new mongoose.Schema({
  name: String, email: String, phone: String
}));
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  issueDate: { type: Date, default: Date.now },
  dueDate: Date, returnDate: Date, status: { type: String, default: 'ISSUED' }
}));

// --- DATA ROUTES ---
router.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.json([]);
  }
});

router.post('/books', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, author, category, isbn, quantity } = req.body;
    const numQty = Number(quantity);
    const newBook = new Book({
      title, author, category, isbn,
      quantity: numQty,
      availableQuantity: numQty
    });
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/books/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/members', async (req, res) => {
  try {
    res.json(await Member.find());
  } catch (err) {
    res.json([]);
  }
});

router.post('/members', verifyToken, async (req, res) => {
  try {
    res.status(201).json(await new Member(req.body).save());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/members/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    res.json(await Transaction.find().populate('bookId memberId'));
  } catch (err) {
    res.json([]);
  }
});

router.post('/transactions/issue', verifyToken, async (req, res) => {
  try {
    const { bookId, memberId, days = 14 } = req.body;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(days));
    res.status(201).json(await new Transaction({ bookId, memberId, dueDate }).save());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/transactions/return/:id', verifyToken, async (req, res) => {
  try {
    const t = await Transaction.findById(req.params.id);
    if (t) { t.status = 'RETURNED'; t.returnDate = new Date(); await t.save(); }
    res.json({ message: 'Book returned' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;