// --- 1. SETUP & KEYS ---
const SUPABASE_URL = 'https://afenurhtovmnbbdjftul.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZW51cmh0b3ZtbmJiZGpmdHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzM4NTgsImV4cCI6MjA4MTA0OTg1OH0.r-uZD8flq8ASNCuPyZTDE440DUwK5IHjol34X2awDX4';

const EMAILJS_PUBLIC_KEY = 'x9PAm8i8ok4zRcecm';
const EMAILJS_SERVICE_ID = 'service_bgc0wmi';
const EMAILJS_TEMPLATE_ID = 'template_gxzco2j';

// Initialize Clients
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
emailjs.init(EMAILJS_PUBLIC_KEY);

// State Variables
let selectedTime = null;

// --- DATA: BARBERS BY LOCATION ---
const staffRoster = {
    "Westferry": ["H", "Henrique", "Diego"],
    "Poplar": ["Remy", "Zak"],
    "Essex": ["Ozzy", "Junior"]
};

// --- 2. MODAL & NAVIGATION ---
function openModal() {
    document.getElementById('bookingModal').classList.add('active');
    
    // Set Default Date
    const dateInput = document.getElementById('dateSelect');
    if (!dateInput.value) {
        dateInput.valueAsDate = new Date();
    }

    // FIX: "Sticky" Location - If browser remembered location, trigger update
    const locSelect = document.getElementById('locationSelect');
    if (locSelect.value && locSelect.value !== "") {
        updateBarberList();
    }
}

// NEW: Function to open modal with pre-set location (for Homepage buttons)
function openModalWithLocation(locationName) {
    openModal();
    const locSelect = document.getElementById('locationSelect');
    locSelect.value = locationName;
    updateBarberList();
}

function closeModal() {
    document.getElementById('bookingModal').classList.remove('active');
    backToStep1(); // Reset form
}

// Custom Status Popup Functions
function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('active');
}

function showStatus(title, message, isSuccess) {
    const modal = document.getElementById('statusModal');
    const icon = document.getElementById('statusIcon');
    const titleEl = document.getElementById('statusTitle');
    const msgEl = document.getElementById('statusMessage');

    titleEl.innerText = title;
    msgEl.innerText = message;
    
    if (isSuccess) {
        icon.innerHTML = "✅"; 
        titleEl.style.color = "#d4af37"; // Gold
    } else {
        icon.innerHTML = "⚠️"; 
        titleEl.style.color = "#d9534f"; // Red
    }
    modal.classList.add('active');
}

window.onclick = function(event) {
    if (event.target == document.getElementById('bookingModal')) closeModal();
    if (event.target == document.getElementById('statusModal')) closeStatusModal();
}

function toggleMobileNav() {
    document.querySelector('.nav-links').classList.toggle('active');
    document.body.classList.toggle('menu-open');
}

// --- 3. BOOKING LOGIC ---

// Helper: Update Barbers based on Location
function updateBarberList() {
    const locSelect = document.getElementById('locationSelect');
    const barberSelect = document.getElementById('barberSelect');
    const selectedLoc = locSelect.value;
    
    // Clear current options
    barberSelect.innerHTML = "";
    
    if (staffRoster[selectedLoc]) {
        // Enable dropdown
        barberSelect.disabled = false;
        barberSelect.style.opacity = "1";
        
        // Add new options
        staffRoster[selectedLoc].forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.innerText = name;
            barberSelect.appendChild(opt);
        });
        
        // Refresh availability
        resetTimeSlot();
    }
}

// Reset slots when barber changes
function resetTimeSlot() {
    selectedTime = null;
    loadAvailability();
}

// Fetch taken slots from Supabase
async function loadAvailability() {
    const barber = document.getElementById('barberSelect').value;
    const date = document.getElementById('dateSelect').value;
    const container = document.getElementById('time-slots');
    const loading = document.getElementById('loading-text');

    if (!date) return;

    container.innerHTML = '';
    loading.style.display = 'block';

    const { data: bookings, error } = await supabaseClient
        .from('bookings')
        .select('booking_time')
        .eq('barber_name', barber)
        .eq('booking_date', date);

    loading.style.display = 'none';

    if (error) {
        console.error('Error fetching slots:', error);
        showStatus("System Error", "Could not load slots.", false);
        return;
    }

    const shopHours = [
        '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
    ];

    const takenTimes = bookings ? bookings.map(b => b.booking_time.slice(0, 5)) : [];

    shopHours.forEach(time => {
        const btn = document.createElement('button');
        btn.innerText = time;
        btn.className = 'slot-btn';
        
        if (takenTimes.includes(time)) {
            btn.classList.add('taken');
            btn.disabled = true;
            btn.title = "Already Booked";
        } else {
            btn.onclick = () => selectTime(time, btn);
        }
        container.appendChild(btn);
    });
}

function selectTime(time, btnElement) {
    document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');
    selectedTime = time;
    
    // Move to Step 2
    setTimeout(() => {
        document.getElementById('booking-step-1').style.display = 'none';
        document.getElementById('booking-step-2').style.display = 'block';
        document.getElementById('confirm-details-header').innerText = `Confirm: ${time} with ${document.getElementById('barberSelect').value}`;
    }, 300);
}

function backToStep1() {
    document.getElementById('booking-step-1').style.display = 'block';
    document.getElementById('booking-step-2').style.display = 'none';
}

// --- 4. FINALIZE & SAVE ---
async function finalizeBooking() {
    const name = document.getElementById('custName').value;
    const email = document.getElementById('custEmail').value;
    const phone = document.getElementById('custPhone').value;
    const barber = document.getElementById('barberSelect').value;
    const date = document.getElementById('dateSelect').value;
    const location = document.getElementById('locationSelect').value;

    if (!name || !email || !phone) {
        showStatus("Missing Info", "Please fill in all your details.", false);
        return;
    }

    const btn = document.querySelector('#booking-step-2 .btn');
    const originalText = btn.innerText;
    btn.innerText = "Processing...";
    btn.disabled = true;

    // A. Insert into Supabase
    const { data, error } = await supabaseClient
        .from('bookings')
        .insert([{
            customer_name: name,
            customer_email: email,
            customer_phone: phone,
            barber_name: barber,
            booking_date: date,
            booking_time: selectedTime,
            location: location
        }])
        .select();

    if (error) {
        if (error.code === '23505') {
            showStatus("Slot Taken", "Sorry! Someone just booked that slot.", false);
            backToStep1();
            loadAvailability();
        } else {
            showStatus("Error", "Error saving booking: " + error.message, false);
        }
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    // B. Generate the Link
    const currentUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    const bookingId = data[0].id;
    const manageLink = `${currentUrl}/cancel.html?id=${bookingId}`;

    // C. Send Email via EmailJS
    const emailParams = {
        name: name,
        email: email, // Sends to customer
        barber: barber,
        date: date,
        time: selectedTime,
        service: "Gents Haircut",
        cancel_link: manageLink 
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams)
        .then(() => {
            closeModal();
            showStatus("Booking Confirmed!", "Check your email for the confirmation.", true);
            
            // Clear Form
            document.getElementById('custName').value = '';
            document.getElementById('custEmail').value = '';
            document.getElementById('custPhone').value = '';
        }, (err) => {
            console.error("Email Failed:", err);
            closeModal();
            showStatus("Saved", "Booking saved, but email failed to send.", true);
        });
        
    btn.innerText = originalText;
    btn.disabled = false;
}