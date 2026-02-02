// Dashboard.js - Functions for dashboard statistics



// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Get dashboard statistics
async function getDashboardStats() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        return null;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/dresses?userId=${currentUser.id}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch dresses: ${response.status}`);
        }
        
        const dresses = await response.json();
        
        // Ensure dresses is an array
        const dressesArray = Array.isArray(dresses) ? dresses : [];
        
        // Calculate statistics
        const categories = [...new Set(dressesArray.map(d => d.category))].filter(Boolean);
        const colors = [...new Set(dressesArray.map(d => d.color))].filter(Boolean);
        const occasions = [...new Set(dressesArray.map(d => d.occasion))].filter(Boolean);
        const types = [...new Set(dressesArray.map(d => d.type))].filter(Boolean);
        
        // Get recent dresses (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentDresses = dressesArray.filter(dress => 
            new Date(dress.createdAt) > oneWeekAgo
        );
        
        // Get most common category
        const categoryCounts = {};
        dressesArray.forEach(dress => {
            if (dress.category) {
                categoryCounts[dress.category] = (categoryCounts[dress.category] || 0) + 1;
            }
        });
        
        const mostCommonCategory = Object.keys(categoryCounts).reduce((a, b) => 
            categoryCounts[a] > categoryCounts[b] ? a : b, 'None'
        );
        
        const stats = {
            totalDresses: dressesArray.length,
            categories: categories.length,
            colors: colors.length,
            occasions: occasions.length,
            types: types.length,
            recentAdditions: recentDresses.length,
            mostCommonCategory: mostCommonCategory
        };
        
        return stats;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        showNotification('Failed to load statistics', 'error');
        return {
            totalDresses: 0,
            categories: 0,
            colors: 0,
            occasions: 0,
            types: 0,
            recentAdditions: 0,
            mostCommonCategory: 'None'
        };
    }
}

// Render dashboard statistics
async function renderDashboardStats() {
    const stats = await getDashboardStats();
    
    if (!stats) {
        document.getElementById('statsContainer').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load statistics</h3>
                <p>Please try refreshing the page</p>
            </div>
        `;
        return;
    }
    
    // Update stat cards
    const totalDressesElement = document.getElementById('totalDresses');
    const categoriesElement = document.getElementById('categoriesCount');
    const colorsElement = document.getElementById('colorsCount');
    const occasionsElement = document.getElementById('occasionsCount');
    
    if (totalDressesElement) {
        totalDressesElement.textContent = stats.totalDresses;
        totalDressesElement.parentElement.innerHTML += `
            <small style="font-size: 0.875rem; color: var(--success); margin-top: 0.25rem; display: block;">
                <i class="fas fa-arrow-up"></i> ${stats.recentAdditions} new this week
            </small>
        `;
    }
    
    if (categoriesElement) {
        categoriesElement.textContent = stats.categories;
        categoriesElement.parentElement.innerHTML += `
            <small style="font-size: 0.875rem; color: var(--primary); margin-top: 0.25rem; display: block;">
                Most common: ${stats.mostCommonCategory}
            </small>
        `;
    }
    
    if (colorsElement) colorsElement.textContent = stats.colors;
    if (occasionsElement) occasionsElement.textContent = stats.occasions;
    
    // Update page title with user's name
    const userNameElement = document.getElementById('userName');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.name;
        
        // Add welcome message based on time of day
        const hour = new Date().getHours();
        let greeting = 'Welcome back';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        else greeting = 'Good evening';
        
        document.querySelector('.dashboard-header p').textContent = 
            `${greeting}, ${currentUser.name.split(' ')[0]}!`;
    }
    
    // Add some visual effects
    animateCounter('totalDresses', 0, stats.totalDresses, 1000);
    animateCounter('categoriesCount', 0, stats.categories, 1000);
    animateCounter('colorsCount', 0, stats.colors, 1000);
    animateCounter('occasionsCount', 0, stats.occasions, 1000);
}

// Animate counter
function animateCounter(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    
    window.requestAnimationFrame(step);
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    renderDashboardStats();
    
    // Add animation to action cards
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.2}s`;
        card.addEventListener('click', function(e) {
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Add hover effect to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.stat-icon');
            if (icon) {
                icon.style.transform = 'rotate(360deg)';
                icon.style.transition = 'transform 0.5s ease';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.stat-icon');
            if (icon) {
                icon.style.transform = 'rotate(0deg)';
            }
        });
    });
});