// Geolocation handling
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateLocation, handleLocationError);
    } else {
        showAlert("Geolocation is not supported by this browser.", "error");
    }
}

function updateLocation(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    
    // Update hidden form fields if they exist
    const latField = document.getElementById('latitude');
    const lngField = document.getElementById('longitude');
    
    if (latField && lngField) {
        latField.value = latitude;
        lngField.value = longitude;
    }
}

function handleLocationError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            showAlert("User denied the request for Geolocation.", "error");
            break;
        case error.POSITION_UNAVAILABLE:
            showAlert("Location information is unavailable.", "error");
            break;
        case error.TIMEOUT:
            showAlert("The request to get user location timed out.", "error");
            break;
        default:
            showAlert("An unknown error occurred.", "error");
            break;
    }
}

// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;

    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
            showAlert(`${field.name} is required`, "error");
        } else {
            field.classList.remove('error');
        }
    });

    return isValid;
}

// Alert system
function showAlert(message, type = "success") {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        const container = document.createElement('div');
        container.id = 'alert-container';
        document.body.appendChild(container);
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    document.getElementById('alert-container').appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Real-time updates for food listings
function setupListingUpdates() {
    const listingsContainer = document.querySelector('.listings-grid');
    if (!listingsContainer) return;

    // Poll for updates every 30 seconds
    setInterval(async () => {
        try {
            const response = await fetch('/api/listings');
            const listings = await response.json();
            updateListings(listings);
        } catch (error) {
            console.error('Error fetching listings:', error);
        }
    }, 30000);
}

function updateListings(listings) {
    const container = document.querySelector('.listings-grid');
    if (!container) return;

    listings.forEach(listing => {
        const existingListing = document.getElementById(`listing-${listing.id}`);
        if (!existingListing) {
            // Add new listing
            const listingElement = createListingElement(listing);
            container.appendChild(listingElement);
        } else {
            // Update existing listing
            updateListingElement(existingListing, listing);
        }
    });
}

function createListingElement(listing) {
    const element = document.createElement('div');
    element.id = `listing-${listing.id}`;
    element.className = 'listing-card';
    element.innerHTML = `
        <h3>${listing.food_name}</h3>
        <div class="listing-info">
            <p>Quantity: ${listing.quantity}</p>
            <p>Expires: ${new Date(listing.expiry_time).toLocaleString()}</p>
            <p>Status: ${listing.pickup_status}</p>
        </div>
        ${listing.pickup_status === 'available' ? 
            `<button class="btn btn-primary" onclick="schedulePick
up(${listing.id})">Schedule Pickup</button>` : ''}
    `;
    return element;
}

function updateListingElement(element, listing) {
    element.querySelector('h3').textContent = listing.food_name;
    element.querySelector('.listing-info').innerHTML = `
        <p>Quantity: ${listing.quantity}</p>
        <p>Expires: ${new Date(listing.expiry_time).toLocaleString()}</p>
        <p>Status: ${listing.pickup_status}</p>
    `;
    
    const existingButton = element.querySelector('button');
    if (listing.pickup_status === 'available') {
        if (!existingButton) {
            const button = document.createElement('button');
            button.className = 'btn btn-primary';
            button.textContent = 'Schedule Pickup';
            button.onclick = () => schedulePickup(listing.id);
            element.appendChild(button);
        }
    } else if (existingButton) {
        existingButton.remove();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Setup form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!validateForm(form.id)) {
                e.preventDefault();
            }
        });
    });

    // Get user location if on registration page
    if (window.location.pathname === '/register') {
        getLocation();
    }

    // Setup real-time updates if on dashboard
    if (window.location.pathname === '/dashboard') {
        setupListingUpdates();
    }
}); 