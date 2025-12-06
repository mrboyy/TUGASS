const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Membuat koneksi ke database
const dbPath = path.resolve(__dirname, 'todo.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Membuat tabel users jika belum ada
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table ready.');
      }
    });
    
    // Membuat tabel tasks jika belum ada dengan relasi ke users
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT FALSE,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`, (err) => {
      if (err) {
        console.error('Error creating tasks table:', err.message);
      } else {
        console.log('Tasks table ready.');
      }
    });
  }
});

// Fungsi database
const dbOperations = {
  // User operations
  registerUser: (username, password, email = null) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        db.run(
          'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
          [username, hashedPassword, email],
          function(err) {
            if (err) {
              if (err.message.includes('UNIQUE constraint failed')) {
                reject(new Error('Username or email already exists'));
              } else {
                reject(err);
              }
            } else {
              resolve({ id: this.lastID, username });
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  },
  
  loginUser: (username, password) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
          reject(err);
        } else if (!user) {
          reject(new Error('Invalid username or password'));
        } else {
          try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
              // Don't send password back
              const { password, ...userWithoutPassword } = user;
              resolve(userWithoutPassword);
            } else {
              reject(new Error('Invalid username or password'));
            }
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  },
  
  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [id], (err, user) => {
        if (err) {
          reject(err);
        } else if (!user) {
          reject(new Error('User not found'));
        } else {
          resolve(user);
        }
      });
    });
  },
  
  // Mendapatkan semua tasks untuk user tertentu
  getAllTasks: (userId = null) => {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM tasks';
      let params = [];
      
      if (userId) {
        query += ' WHERE user_id = ?';
        params.push(userId);
      }
      
      query += ' ORDER BY created_at DESC';
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Menambahkan task baru
  addTask: (title, description, userId) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)',
        [title, description, userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        }
      );
    });
  },

  // Mengubah status completed task
  toggleTaskCompleted: (id, completed) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE tasks SET completed = ? WHERE id = ?',
        [completed, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            if (this.changes === 0) {
              reject(new Error('Task not found'));
            } else {
              resolve({ changes: this.changes });
            }
          }
        }
      );
    });
  },

  // Menghapus task
  deleteTask: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM tasks WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            if (this.changes === 0) {
              reject(new Error('Task not found'));
            } else {
              resolve({ changes: this.changes });
            }
          }
        }
      );
    });
  },

  // Mengupdate task (judul dan deskripsi)
  updateTask: (id, title, description) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE tasks SET title = ?, description = ? WHERE id = ?',
        [title, description, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            if (this.changes === 0) {
              reject(new Error('Task not found'));
            } else {
              resolve({ changes: this.changes });
            }
          }
        }
      );
    });
  },

  // Mendapatkan task berdasarkan ID
  getTaskById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Task not found'));
        } else {
          resolve(row);
        }
      });
    });
  }
};

module.exports = dbOperations;