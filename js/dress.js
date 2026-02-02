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

// Get all dresses for current user
async function getUserDresses() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        console.error('No user logged in');
        return [];
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/dresses?userId=${currentUser.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch dresses');
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
    } catch (error) {
        console.error('Error fetching dresses:', error);
        showNotification('Failed to load wardrobe', 'error');
        return [];
    }
}

// Get dress by ID
async function getDressById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/dresses/${id}`);
        if (!response.ok) {
            throw new Error('Dress not found');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching dress:', error);
        showNotification('Failed to load dress details', 'error');
        return null;
    }
}

// Check for duplicate dress
async function checkDuplicateDress(dressData) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/dresses?userId=${currentUser.id}`);
        const dresses = await response.json();
        
        if (!Array.isArray(dresses)) return false;
        
        // Check if dress with same type, color, and name exists (case-insensitive)
        const isDuplicate = dresses.some(dress => 
            dress.name.toLowerCase() === dressData.name.toLowerCase() &&
            dress.type.toLowerCase() === dressData.type.toLowerCase() &&
            dress.color.toLowerCase() === dressData.color.toLowerCase()
        );
        
        return isDuplicate;
    } catch (error) {
        console.error('Error checking for duplicates:', error);
        return false;
    }
}

// Add new dress
async function addDress(dressData) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        return { success: false, error: 'Please login first' };
    }
    
    try {
        // Check for duplicates
        const isDuplicate = await checkDuplicateDress(dressData);
        if (isDuplicate) {
            return { success: false, error: 'This dress already exists in your wardrobe!' };
        }
        
        // Add user ID to dress data
        const dressWithUser = {
            ...dressData,
            userId: currentUser.id,
            createdAt: new Date().toISOString()
        };
        
        const response = await fetch(`${API_BASE_URL}/dresses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dressWithUser)
        });
        
        if (!response.ok) {
            throw new Error('Failed to add dress');
        }
        
        const newDress = await response.json();
        return { success: true, dress: newDress };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Update dress
async function updateDress(id, dressData) {
    try {
        const response = await fetch(`${API_BASE_URL}/dresses/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dressData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update dress');
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Delete dress
async function deleteDress(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/dresses/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete dress');
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get dress image URL
function getDressImageUrl(dress) {
    if (dress.image && dress.image.trim() !== '') {
        return dress.image;
    }
    
    // Default images based on dress type with better Unsplash images
    const defaultImages = {
        'shirt': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=300&fit=crop&auto=format',
        't-shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop&auto=format',
        'jeans': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop&auto=format',
        'saree': 'https://images.unsplash.com/photo-1583636919110-8c6bde3c9c89?w=400&h=300&fit=crop&auto=format',
        'kurti': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop&auto=format',
        'dress': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=300&fit=crop&auto=format',
        'skirt': 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&h=300&fit=crop&auto=format',
        'jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop&auto=format',
        'sweater': 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=300&fit=crop&auto=format',
        'trousers': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=300&fit=crop&auto=format'
    };
    
    return defaultImages[dress.type?.toLowerCase()] || defaultImages['dress'];
}

// Get icon for dress type
function getDressTypeIcon(type) {
    const icons = {
        'shirt': 'fas fa-tshirt',
        't-shirt': 'fas fa-tshirt',
        'jeans': 'fas fa-vest',
        'trousers': 'fas fa-vest',
        'saree': 'fas fa-female',
        'kurti': 'fas fa-female',
        'dress': 'fas fa-tshirt',
        'skirt': 'fas fa-female',
        'jacket': 'fas fa-vest',
        'sweater': 'fas fa-vest'
    };
    
    return icons[type?.toLowerCase()] || 'fas fa-tshirt';
}

// Get color class for badge
function getColorBadge(color) {
    const colorMap = {
        'red': '#f44336',
        'blue': '#2196f3',
        'green': '#4caf50',
        'black': '#000000',
        'white': '#ffffff',
        'yellow': '#ffeb3b',
        'pink': '#e91e63',
        'purple': '#9c27b0',
        'orange': '#ff9800',
        'brown': '#795548',
        'gray': '#9e9e9e'
    };
    
    return colorMap[color?.toLowerCase()] || '#ccc';
}

// Render dress card
function renderDressCard(dress) {
    return `
        <div class="dress-card" data-id="${dress.id}" data-name="${dress.name.toLowerCase()}">
            <img src="${getDressImageUrl(dress)}" alt="${dress.name}" class="dress-image" loading="lazy">
            <div class="dress-content">
                <h3 class="dress-title">${dress.name}</h3>
                <div class="dress-meta">
                    <span title="${dress.type}">
                        <i class="${getDressTypeIcon(dress.type)}"></i>
                        ${dress.type}
                    </span>
                    <span title="${dress.color}" style="background: ${getColorBadge(dress.color)}20; color: ${getColorBadge(dress.color)};">
                        <i class="fas fa-palette"></i>
                        ${dress.color}
                    </span>
                    <span title="${dress.category}">
                        <i class="fas fa-layer-group"></i>
                        ${dress.category}
                    </span>
                    <span title="${dress.occasion}">
                        <i class="fas fa-calendar-alt"></i>
                        ${dress.occasion}
                    </span>
                </div>
                <div class="dress-actions">
                    <a href="dress-detail.html?id=${dress.id}" class="btn btn-outline btn-sm">
                        <i class="fas fa-eye"></i> View
                    </a>
                    <button class="btn btn-outline btn-sm delete-dress" data-id="${dress.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Filter dresses
function filterDresses(dresses, filters) {
    return dresses.filter(dress => {
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const dressName = dress.name.toLowerCase();
            const dressType = dress.type.toLowerCase();
            const dressColor = dress.color.toLowerCase();
            const dressCategory = dress.category.toLowerCase();
            
            if (!dressName.includes(searchTerm) && 
                !dressType.includes(searchTerm) && 
                !dressColor.includes(searchTerm) &&
                !dressCategory.includes(searchTerm)) {
                return false;
            }
        }
        if (filters.type && dress.type !== filters.type) {
            return false;
        }
        if (filters.color && dress.color !== filters.color) {
            return false;
        }
        if (filters.occasion && dress.occasion !== filters.occasion) {
            return false;
        }
        if (filters.category && dress.category !== filters.category) {
            return false;
        }
        return true;
    });
}

// Event Listeners for Dress Pages
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser && window.location.pathname.includes('add-dress.html')) {
        window.location.href = 'index.html';
        return;
    }
    
    // Add Dress Form Handler
    const addDressForm = document.getElementById('addDressForm');
    if (addDressForm) {
        addDressForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const dressData = {
                name: document.getElementById('dressName').value.trim(),
                type: document.getElementById('dressType').value,
                color: document.getElementById('color').value,
                category: document.getElementById('category').value,
                occasion: document.getElementById('occasion').value,
                season: document.getElementById('season').value,
                image: document.getElementById('imageUrl').value.trim() || ''
            };
            
            // Validate required fields
            if (!dressData.name || !dressData.type || !dressData.color || 
                !dressData.category || !dressData.occasion || !dressData.season) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = addDressForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Dress...';
            submitBtn.disabled = true;
            
            const result = await addDress(dressData);
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            if (result.success) {
                showNotification('Dress added successfully!');
                setTimeout(() => {
                    window.location.href = 'wardrobe.html';
                }, 1500);
            } else {
                showNotification(result.error, 'error');
            }
        });
    }
    
    // Load Wardrobe
    const wardrobeGrid = document.getElementById('wardrobeGrid');
    if (wardrobeGrid) {
        loadWardrobe();
        
        // Search input handler with debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(loadWardrobe, 300));
        }
        
        // Filter handlers
        const filterType = document.getElementById('filterType');
        const filterColor = document.getElementById('filterColor');
        const filterOccasion = document.getElementById('filterOccasion');
        const clearFilters = document.getElementById('clearFilters');
        
        if (filterType) filterType.addEventListener('change', loadWardrobe);
        if (filterColor) filterColor.addEventListener('change', loadWardrobe);
        if (filterOccasion) filterOccasion.addEventListener('change', loadWardrobe);
        if (clearFilters) clearFilters.addEventListener('click', function() {
            if (searchInput) searchInput.value = '';
            if (filterType) filterType.value = '';
            if (filterColor) filterColor.value = '';
            if (filterOccasion) filterOccasion.value = '';
            loadWardrobe();
            showNotification('Filters cleared');
        });
    }
    
    // Load Dress Details
    const dressDetails = document.getElementById('dressDetails');
    if (dressDetails) {
        loadDressDetails();
    }
    
    // Delete Modal Handlers
    const deleteModal = document.getElementById('deleteModal');
    let dressToDelete = null;
    
    if (deleteModal) {
        const modalClose = deleteModal.querySelector('.modal-close');
        const cancelDelete = document.getElementById('cancelDelete');
        const confirmDelete = document.getElementById('confirmDelete');
        
        // Open modal when delete button is clicked
        document.addEventListener('click', function(e) {
            if (e.target.closest('.delete-dress')) {
                e.preventDefault();
                dressToDelete = e.target.closest('.delete-dress').dataset.id;
                const dressName = e.target.closest('.dress-card')?.dataset.name || 'this dress';
                deleteModal.querySelector('.modal-body p').textContent = 
                    `Are you sure you want to delete "${dressName}"? This action cannot be undone.`;
                deleteModal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        });
        
        // Close modal
        const closeModal = () => {
            deleteModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            dressToDelete = null;
        };
        
        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (cancelDelete) cancelDelete.addEventListener('click', closeModal);
        
        // Confirm delete
        if (confirmDelete) {
            confirmDelete.addEventListener('click', async function() {
                if (dressToDelete) {
                    const result = await deleteDress(dressToDelete);
                    if (result.success) {
                        showNotification('Dress deleted successfully');
                        closeModal();
                        // Reload the appropriate page
                        if (window.location.pathname.includes('dress-detail.html')) {
                            setTimeout(() => {
                                window.location.href = 'wardrobe.html';
                            }, 1000);
                        } else {
                            loadWardrobe();
                        }
                    } else {
                        showNotification('Failed to delete dress: ' + result.error, 'error');
                        closeModal();
                    }
                }
            });
        }
        
        // Close modal when clicking outside
        deleteModal.addEventListener('click', function(e) {
            if (e.target === deleteModal) {
                closeModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && deleteModal.classList.contains('show')) {
                closeModal();
            }
        });
    }
});

// Load wardrobe with filtering
async function loadWardrobe() {
    const wardrobeGrid = document.getElementById('wardrobeGrid');
    if (!wardrobeGrid) return;
    
    wardrobeGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading your wardrobe...</p></div>';
    
    const dresses = await getUserDresses();
    
    if (dresses.length === 0) {
        wardrobeGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tshirt"></i>
                <h3>Your wardrobe is empty</h3>
                <p>Add your first dress to get started!</p>
                <a href="add-dress.html" class="btn btn-primary">
                    <i class="fas fa-plus-circle"></i> Add First Dress
                </a>
            </div>
        `;
        return;
    }
    
    // Get filter values
    const filters = {
        search: document.getElementById('searchInput')?.value || '',
        type: document.getElementById('filterType')?.value || '',
        color: document.getElementById('filterColor')?.value || '',
        occasion: document.getElementById('filterOccasion')?.value || '',
        category: document.getElementById('filterCategory')?.value || ''
    };
    
    // Filter dresses
    const filteredDresses = filterDresses(dresses, filters);
    
    if (filteredDresses.length === 0) {
        wardrobeGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No dresses found</h3>
                <p>Try adjusting your search or filters</p>
                <button id="clearAllFilters" class="btn btn-outline">
                    <i class="fas fa-times"></i> Clear All Filters
                </button>
            </div>
        `;
        
        document.getElementById('clearAllFilters')?.addEventListener('click', function() {
            const searchInput = document.getElementById('searchInput');
            const filterType = document.getElementById('filterType');
            const filterColor = document.getElementById('filterColor');
            const filterOccasion = document.getElementById('filterOccasion');
            
            if (searchInput) searchInput.value = '';
            if (filterType) filterType.value = '';
            if (filterColor) filterColor.value = '';
            if (filterOccasion) filterOccasion.value = '';
            loadWardrobe();
        });
        
        return;
    }
    
    // Render dress cards
    wardrobeGrid.innerHTML = filteredDresses.map(renderDressCard).join('');
    
    // Add animation to each card
    setTimeout(() => {
        const cards = wardrobeGrid.querySelectorAll('.dress-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }, 100);
}

// Load dress details
async function loadDressDetails() {
    const dressDetails = document.getElementById('dressDetails');
    if (!dressDetails) return;
    
    // Get dress ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const dressId = urlParams.get('id');
    
    if (!dressId) {
        dressDetails.innerHTML = '<div class="alert alert-warning">Dress not found</div>';
        return;
    }
    
    const dress = await getDressById(dressId);
    
    if (!dress) {
        dressDetails.innerHTML = '<div class="alert alert-warning">Dress not found</div>';
        return;
    }
    
    // Check if dress belongs to current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (dress.userId !== currentUser?.id) {
        dressDetails.innerHTML = '<div class="alert alert-warning">You do not have permission to view this dress</div>';
        return;
    }
    
    const formattedDate = new Date(dress.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    dressDetails.innerHTML = `
        <div class="details-header">
            <h2>${dress.name}</h2>
            <p>Added on ${formattedDate}</p>
        </div>
        <div class="details-body">
            <img src="${getDressImageUrl(dress)}" alt="${dress.name}" class="details-image">
            <div class="details-info">
                <div class="detail-item">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">
                        <i class="${getDressTypeIcon(dress.type)}"></i>
                        ${dress.type}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Color:</span>
                    <span class="detail-value">
                        <div class="color-badge" style="background: ${getColorBadge(dress.color)}; display: inline-block; width: 20px; height: 20px; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></div>
                        ${dress.color}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">
                        <i class="fas fa-layer-group"></i>
                        ${dress.category}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Occasion:</span>
                    <span class="detail-value">
                        <i class="fas fa-calendar-alt"></i>
                        ${dress.occasion}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Season:</span>
                    <span class="detail-value">
                        <i class="fas fa-cloud-sun"></i>
                        ${dress.season}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Added Date:</span>
                    <span class="detail-value">
                        <i class="fas fa-clock"></i>
                        ${formattedDate}
                    </span>
                </div>
            </div>
        </div>
        <div class="details-actions" style="padding: 2rem; border-top: 1px solid var(--light-gray); display: flex; gap: 1rem;">
            <a href="wardrobe.html" class="btn btn-outline">
                <i class="fas fa-arrow-left"></i> Back to Wardrobe
            </a>
            <button class="btn btn-outline edit-dress" data-id="${dress.id}" onclick="window.location.href='add-dress.html?edit=${dress.id}'">
                <i class="fas fa-edit"></i> Edit Dress
            </button>
            <button class="btn btn-danger delete-dress" data-id="${dress.id}">
                <i class="fas fa-trash"></i> Delete Dress
            </button>
        </div>
    `;
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}