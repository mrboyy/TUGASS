// Konstanta dan variabel
const API_URL = 'http://localhost:3000/api/tasks';
const AUTH_URL = 'http://localhost:3000/api/auth';
const taskForm = document.getElementById('task-form');
const tasksContainer = document.getElementById('tasks-container');
const taskTemplate = document.getElementById('task-template');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editId = document.getElementById('edit-id');
const editTitle = document.getElementById('edit-title');
const editDescription = document.getElementById('edit-description');
const closeBtn = document.querySelector('.close');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');

// Cek autentikasi
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  
  // Tampilkan info user
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && userInfo) {
    userInfo.textContent = `Halo, ${user.username}`;
  }
  
  return true;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    fetchTasks();
  }
});

taskForm.addEventListener('submit', addTask);
editForm.addEventListener('submit', updateTask);
closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
  if (e.target === editModal) {
    closeModal();
  }
});

// Tambahkan event listener untuk logout jika tombol ada
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

// Fungsi logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Fungsi untuk mengambil semua tasks dari API
async function fetchTasks() {
  tasksContainer.innerHTML = '<div class="loading">Memuat tugas...</div>';
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      // Token tidak valid atau kedaluwarsa
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
      return;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const tasks = await response.json();
    
    if (tasks.length === 0) {
      tasksContainer.innerHTML = '<div class="loading">Tidak ada tugas. Tambahkan tugas baru!</div>';
      return;
    }
    
    tasksContainer.innerHTML = '';
    tasks.forEach(task => {
      renderTask(task);
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    tasksContainer.innerHTML = `<div class="loading">Error: ${error.message}. Pastikan server berjalan di http://localhost:3000</div>`;
  }
}

// Fungsi untuk menambahkan task baru
async function addTask(e) {
  e.preventDefault();
  
  const titleInput = document.getElementById('title');
  const descriptionInput = document.getElementById('description');
  
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  
  if (!title) {
    alert('Judul tugas tidak boleh kosong!');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, description })
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
      return;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const newTask = await response.json();
    renderTask(newTask);
    
    // Reset form
    titleInput.value = '';
    descriptionInput.value = '';
    
  } catch (error) {
    console.error('Error adding task:', error);
    alert(`Error: ${error.message}. Pastikan server berjalan di http://localhost:3000`);
  }
}

// Fungsi untuk mengubah status completed task
async function toggleTaskCompleted(id, completed) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ completed })
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
      return;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const updatedTask = await response.json();
    
    // Update UI
    const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
    if (completed) {
      taskElement.classList.add('completed');
    } else {
      taskElement.classList.remove('completed');
    }
    
  } catch (error) {
    console.error('Error updating task status:', error);
    alert(`Error: ${error.message}. Pastikan server berjalan di http://localhost:3000`);
  }
}

// Fungsi untuk menghapus task
async function deleteTask(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
      return;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // Hapus dari UI
    const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
    taskElement.remove();
    
    // Jika tidak ada task lagi
    if (tasksContainer.children.length === 0) {
      tasksContainer.innerHTML = '<div class="loading">Tidak ada tugas. Tambahkan tugas baru!</div>';
    }
    
  } catch (error) {
    console.error('Error deleting task:', error);
    alert(`Error: ${error.message}. Pastikan server berjalan di http://localhost:3000`);
  }
}

// Fungsi untuk membuka modal edit
function openEditModal(task) {
  editId.value = task.id;
  editTitle.value = task.title;
  editDescription.value = task.description || '';
  editModal.style.display = 'block';
}

// Fungsi untuk menutup modal edit
function closeModal() {
  editModal.style.display = 'none';
}

// Fungsi untuk mengupdate task
async function updateTask(e) {
  e.preventDefault();
  
  const id = editId.value;
  const title = editTitle.value.trim();
  const description = editDescription.value.trim();
  
  if (!title) {
    alert('Judul tugas tidak boleh kosong!');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, description })
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
      return;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const updatedTask = await response.json();
    
    // Update UI
    const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
    taskElement.querySelector('.task-title').textContent = title;
    taskElement.querySelector('.task-description').textContent = description;
    
    // Tutup modal
    closeModal();
    
  } catch (error) {
    console.error('Error updating task:', error);
    alert(`Error: ${error.message}. Pastikan server berjalan di http://localhost:3000`);
  }
}

// Fungsi untuk merender task ke UI
function renderTask(task) {
  const taskClone = document.importNode(taskTemplate.content, true);
  const taskItem = taskClone.querySelector('.task-item');
  
  taskItem.dataset.id = task.id;
  taskItem.querySelector('.task-title').textContent = task.title;
  taskItem.querySelector('.task-description').textContent = task.description || '';
  
  const checkbox = taskItem.querySelector('.task-completed');
  checkbox.checked = task.completed === 1 || task.completed === true;
  
  if (checkbox.checked) {
    taskItem.classList.add('completed');
  }
  
  // Event listener untuk checkbox
  checkbox.addEventListener('change', () => {
    toggleTaskCompleted(task.id, checkbox.checked);
  });
  
  // Event listener untuk tombol edit
  taskItem.querySelector('.btn-edit').addEventListener('click', () => {
    openEditModal(task);
  });
  
  // Event listener untuk tombol delete
  taskItem.querySelector('.btn-delete').addEventListener('click', () => {
    deleteTask(task.id);
  });
  
  tasksContainer.appendChild(taskItem);
}