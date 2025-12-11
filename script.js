function openModal() {
    document.getElementById('bookingModal').classList.add('active');
}

function closeModal() {
    document.getElementById('bookingModal').classList.remove('active');
}

// Close modal if clicking outside the box
window.onclick = function(event) {
    const modal = document.getElementById('bookingModal');
    if (event.target == modal) { 
        closeModal(); 
    }
}

function toggleMobileNav() {
    const navLinks = document.querySelector('.nav-links');
    const body = document.querySelector('body');
    
    // Toggle the 'active' class on the menu container
    navLinks.classList.toggle('active');
    
    // Toggle the scroll lock on the body
    body.classList.toggle('menu-open');
}