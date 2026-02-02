// Auth.js - Authentication functions for login, register, and session management

// API Base URL - JSON Server
const API_BASE_URL = 'http://localhost:3000';

// Check if user is logged in
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isAuthPage = window.location.pathname.includes('index.html') || 
                       window.location.pathname.includes('register.html');
    
    if (!currentUser && !isAuthPage) {
        window.location.href = 'index.html';
        return null;
    }
    
    if (currentUser && isAuthPage) {
        window.location.href = 'dashboard.html';
        return currentUser;
    }
    
    return currentUser;
}

// Get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after animation
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Login function
async function login(email, password) {
    try {
        if (!email || !password) {
            throw new Error('Please fill in all fields');
        }
        
        const response = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const users = await response.json();
        
        if (!users || users.length === 0) {
            throw new Error('User not found');
        }
        
        const user = users[0];
        
        if (user.password !== password) {
            throw new Error('Invalid password');
        }
        
        // Store user in localStorage (without password for security)
        const userData = { 
            id: user.id, 
            name: user.name, 
            email: user.email,
            createdAt: user.createdAt 
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        return { success: true, user: userData };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Register function
async function register(name, email, password) {
    try {
        // Validate inputs
        if (!name || !email || !password) {
            throw new Error('Please fill in all fields');
        }
        
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        
        // Check if user already exists
        const checkResponse = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`);
        if (!checkResponse.ok) {
            throw new Error('Network response was not ok');
        }
        
        const existingUsers = await checkResponse.json();
        
        if (existingUsers && existingUsers.length > 0) {
            throw new Error('User with this email already exists');
        }
        
        // Create new user
        const newUser = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            createdAt: new Date().toISOString()
        };
        
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create user');
        }
        
        const user = await response.json();
        
        // Store user in localStorage (without password)
        const userData = { 
            id: user.id, 
            name: user.name, 
            email: user.email,
            createdAt: user.createdAt 
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        return { success: true, user: userData };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    showNotification('Logged out successfully');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Event Listeners for Auth Pages
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = checkAuth();
    
    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            
            // Clear previous error
            errorMessage.classList.remove('show');
            errorMessage.textContent = '';
            
            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            submitBtn.disabled = true;
            
            const result = await login(email, password);
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            if (result.success) {
                showNotification('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                errorMessage.textContent = result.error;
                errorMessage.classList.add('show');
            }
        });
    }
    
    // Register Form Handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            
            // Clear previous error
            errorMessage.classList.remove('show');
            errorMessage.textContent = '';
            
            // Show loading state
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            submitBtn.disabled = true;
            
            const result = await register(name, email, password);
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            if (result.success) {
                showNotification('Account created successfully! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                errorMessage.textContent = result.error;
                errorMessage.classList.add('show');
            }
        });
    }
    
    // Logout Button Handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Nav Toggle for Mobile
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('show');
            navToggle.innerHTML = navMenu.classList.contains('show') ? 
                '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (navMenu && navMenu.classList.contains('show') && 
            !e.target.closest('.nav-menu') && 
            !e.target.closest('.nav-toggle')) {
            navMenu.classList.remove('show');
            if (navToggle) {
                navToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    });
    
    // Set user name in dashboard if available
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.name;
    }
    
    // Add form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
        });
    });
});

// Field validation
function validateField(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    let error = '';
    
    if (!field.value.trim()) {
        error = 'This field is required';
    } else if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
            error = 'Please enter a valid email address';
        }
    } else if (field.type === 'password' && field.value.length < 6) {
        error = 'Password must be at least 6 characters';
    }
    
    if (error) {
        formGroup.classList.add('error');
        let errorSpan = formGroup.querySelector('.error-text');
        if (!errorSpan) {
            errorSpan = document.createElement('span');
            errorSpan.className = 'error-text';
            formGroup.appendChild(errorSpan);
        }
        errorSpan.textContent = error;
    } else {
        formGroup.classList.remove('error');
        const errorSpan = formGroup.querySelector('.error-text');
        if (errorSpan) errorSpan.remove();
    }
    
    return !error;
}