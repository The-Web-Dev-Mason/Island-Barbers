
    // --- 1. SETUP & KEYS ---
// PASTE YOUR KEYS HERE (Ensure no extra spaces!)
const SUPABASE_URL = 'https://afenurhtovmnbbdjftul.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZW51cmh0b3ZtbmJiZGpmdHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzM4NTgsImV4cCI6MjA4MTA0OTg1OH0.r-uZD8flq8ASNCuPyZTDE440DUwK5IHjol34X2awDX4';


const EMAILJS_PUBLIC_KEY = 'x9PAm8i8ok4zRcecm';
const EMAILJS_SERVICE_ID = 'service_bgc0wmi';
const EMAILJS_TEMPLATE_ID = 'template_gxzco2j';

// Initialize Clients
// FIX: We renamed the variable to 'supabaseClient' to avoid the error
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
emailjs.init(EMAILJS_PUBLIC_KEY);

// State Variables
let selectedTime = null;

// --- 2. MODAL & NAVIGATION ---
function openModal() {
    document.getElementById('bookingModal').classList.add('active');
    // Set default date to today if empty
    const dateInput = document.getElementById('dateSelect');
    if (!dateInput.value) {
        dateInput.valueAsDate = new Date();
    }
    loadAvailability();
}

function closeModal() {
    document.getElementById('bookingModal').classList.remove('active');
    backToStep1(); // Reset form
}

window.onclick = function(event) {
    if (event.target == document.getElementById('bookingModal')) closeModal();
}

function toggleMobileNav() {
    document.querySelector('.nav-links').classList.toggle('active');
    document.body.classList.toggle('menu-open');
}

// --- 3. BOOKING LOGIC ---

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

    // Query Database: Using 'supabaseClient' instead of 'supabase'
    const { data: bookings, error } = await supabaseClient
        .from('bookings')
        .select('booking_time')
        .eq('barber_name', barber)
        .eq('booking_date', date);

    loading.style.display = 'none';

    if (error) {
        console.error('Error fetching slots:', error);
        alert("Database Error: " + error.message); // Show error on screen for debugging
        return;
    }

    // List of all possible shop hours
    const shopHours = [
        '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
    ];

    // Convert database results to a simple array
    const takenTimes = bookings ? bookings.map(b => b.booking_time.slice(0, 5)) : [];

    // Create Buttons
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

// --- 4. FINALIZE & SAVE (DEBUG VERSION) ---
async function finalizeBooking() {
    console.log("--- STARTING BOOKING PROCESS ---"); 

    const name = document.getElementById('custName').value;
    const email = document.getElementById('custEmail').value;
    const phone = document.getElementById('custPhone').value;
    const barber = document.getElementById('barberSelect').value;
    const date = document.getElementById('dateSelect').value;

    if (!name || !email || !phone) {
        alert("Please fill in all details.");
        return;
    }

    const btn = document.querySelector('#booking-step-2 .btn');
    const originalText = btn.innerText;
    btn.innerText = "Processing...";
    btn.disabled = true;

    // A. Insert into Supabase
    console.log("Attempting to save to Supabase..."); 

    const { data, error } = await supabaseClient
        .from('bookings')
        .insert([{
            customer_name: name,
            customer_email: email,
            customer_phone: phone,
            barber_name: barber,
            booking_date: date,
            booking_time: selectedTime
        }])
        .select(); // Ask Supabase to give us the new row back

    if (error) {
        console.error("Supabase Error:", error); 
        if (error.code === '23505') {
            alert("Sorry! That slot was just taken.");
            backToStep1();
            loadAvailability();
        } else {
            alert("Error saving booking: " + error.message);
        }
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    console.log("Supabase Success! Data returned:", data); 

    // B. Generate the Link
    if (!data || data.length === 0) {
        alert("Error: Booking saved, but no ID returned. Cannot generate link.");
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    const currentUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    const bookingId = data[0].id;
    const manageLink = `${currentUrl}/cancel.html?id=${bookingId}`;

    console.log("---------------------------------------------");
    console.log("GENERATED LINK:", manageLink);
    console.log("---------------------------------------------");

    // C. Send Email via EmailJS
    console.log("Sending Email..."); 

    const emailParams = {
        name: name,
        email: email,
        barber: barber,
        date: date,
        time: selectedTime,
        service: "Gents Haircut",
        cancel_link: manageLink 
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams)
        .then(() => {
            console.log("Email Sent Successfully!"); 
            alert("Booking Confirmed! Check your email.");
            closeModal();
            document.getElementById('custName').value = '';
            document.getElementById('custEmail').value = '';
            document.getElementById('custPhone').value = '';
        }, (err) => {
            console.error("Email Failed:", err); 
            alert("Booking saved, but email failed to send.");
            closeModal();
        });
        
    btn.innerText = originalText;
    btn.disabled = false;
}