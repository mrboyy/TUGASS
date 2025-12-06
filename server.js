const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const dbOperations = require('./database');

// Inisialisasi Express
const app = express();
const PORT = 3000;
const JWT_SECRET = 'todo-app-secret-key'; // Dalam produksi, gunakan environment variable

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware untuk autentikasi
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Endpoint API

// Auth Endpoints
// POST - Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = await dbOperations.registerUser(username, password, email);
    
    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Error registering user:', error);
    if (error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
});

// POST - Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = await dbOperations.loginUser(username, password);
    
    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ user, token });
  } catch (error) {
    console.error('Error logging in:', error);
    if (error.message.includes('Invalid username or password')) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to login' });
    }
  }
});

// GET - Mendapatkan semua tasks
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await dbOperations.getAllTasks(req.user.id);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST - Menambahkan task baru
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description = '' } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const result = await dbOperations.addTask(title, description, req.user.id);
    const newTask = await dbOperations.getTaskById(result.id);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: 'Failed to add task' });
  }
});

// PATCH - Mengubah status completed task
app.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    
    if (completed === undefined) {
      return res.status(400).json({ error: 'Completed status is required' });
    }
    
    await dbOperations.toggleTaskCompleted(id, completed);
    const updatedTask = await dbOperations.getTaskById(id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task status:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.status(500).json({ error: 'Failed to update task status' });
    }
  }
});

// PUT - Mengupdate task (judul dan deskripsi)
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description = '' } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    await dbOperations.updateTask(id, title, description);
    const updatedTask = await dbOperations.getTaskById(id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
});

// DELETE - Menghapus task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await dbOperations.deleteTask(id);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});