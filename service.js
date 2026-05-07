// ===================================================
// QUEENS NAILS BY ROSE — service.js
// Lógica de reservas y UI interactiva
// ===================================================

// ===== ALMACENAMIENTO DE RESERVAS =====
// Guarda las reservas en memoria (sesión actual).
// Para persistencia real, reemplazar con llamadas a una API/backend.
const BookingStore = (() => {
    // Estructura: { 'YYYY-MM-DD': ['HH:MM', 'HH:MM', ...] }
    let bookedSlots = {};

    /**
     * Registra un horario como ocupado para una fecha.
     * @param {string} dateStr - Fecha en formato 'YYYY-MM-DD'
     * @param {string} time    - Hora en formato 'HH:MM'
     * @returns {boolean} true si se guardó correctamente, false si ya estaba ocupado
     */
    function addBooking(dateStr, time) {
        if (!bookedSlots[dateStr]) {
            bookedSlots[dateStr] = [];
        }
        if (bookedSlots[dateStr].includes(time)) {
            return false; // Ya ocupado
        }
        bookedSlots[dateStr].push(time);
        return true;
    }

    /**
     * Devuelve los horarios ocupados para una fecha.
     * @param {string} dateStr - Fecha en formato 'YYYY-MM-DD'
     * @returns {string[]} Array de horas ocupadas
     */
    function getTakenSlots(dateStr) {
        return bookedSlots[dateStr] || [];
    }

    /**
     * Verifica si un horario específico está ocupado.
     * @param {string} dateStr
     * @param {string} time
     * @returns {boolean}
     */
    function isSlotTaken(dateStr, time) {
        return (bookedSlots[dateStr] || []).includes(time);
    }

    /**
     * Devuelve todas las reservas almacenadas (útil para debug/admin).
     * @returns {object}
     */
    function getAllBookings() {
        return { ...bookedSlots };
    }

    return { addBooking, getTakenSlots, isSlotTaken, getAllBookings };
})();


// ===== MOBILE MENU =====
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    const body = document.body;

    if (menu.classList.contains('active')) {
        closeMobileMenu();
    } else {
        menu.classList.add('active');
        overlay.classList.add('active');
        body.classList.add('menu-open');
    }
}

function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    const body = document.body;

    menu.classList.remove('active');
    overlay.classList.remove('active');
    body.classList.remove('menu-open');
}


// ===== BOOKING MODAL — ESTADO =====
let currentStep = 1;
let bookingData = {
    service: '',
    price: 0,
    duration: '',
    date: null,
    time: '',
    name: '',
    phone: '',
    email: '',
    notes: ''
};


// ===== APERTURA Y CIERRE DEL MODAL =====
function openBookingModal(preselectedService = null) {
    const modal = document.getElementById('bookingModalOverlay');
    document.body.classList.add('modal-open');
    modal.classList.add('active');

    // Reset de estado
    currentStep = 1;
    bookingData = {
        service: '', price: 0, duration: '',
        date: null, time: '',
        name: '', phone: '', email: '', notes: ''
    };
    updateStepIndicator();
    showStep(1);

    // Preseleccionar servicio si se indica
    if (preselectedService) {
        const options = document.querySelectorAll('.service-option');
        options.forEach(opt => {
            if (opt.dataset.service === preselectedService) {
                selectService(opt);
            }
        });
    }

    initCalendar();
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModalOverlay');
    document.body.classList.remove('modal-open');
    modal.classList.remove('active');
}

// Cerrar con Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeBookingModal();
        closeMobileMenu();
    }
});


// ===== NAVEGACIÓN DE PASOS =====
function showStep(step) {
    document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
    document.getElementById('step' + step).classList.add('active');

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.style.display = step > 1 ? 'block' : 'none';

    if (step === 4) {
        nextBtn.textContent = 'Confirmar Reserva';
        updateSummary();
    } else {
        nextBtn.textContent = 'Siguiente';
    }

    validateStep();
}

function nextStep() {
    if (currentStep < 4) {
        currentStep++;
        updateStepIndicator();
        showStep(currentStep);
    } else {
        submitBooking();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepIndicator();
        showStep(currentStep);
    }
}

function updateStepIndicator() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById('stepDot' + i);
        dot.classList.remove('active', 'completed');
        if (i === currentStep) {
            dot.classList.add('active');
        } else if (i < currentStep) {
            dot.classList.add('completed');
        }
    }
}

function validateStep() {
    const nextBtn = document.getElementById('nextBtn');
    let valid = false;

    switch (currentStep) {
        case 1:
            valid = bookingData.service !== '';
            break;
        case 2:
            valid = bookingData.date !== null && bookingData.time !== '';
            break;
        case 3:
            valid = document.getElementById('clientName').value.trim() !== '' &&
                    document.getElementById('clientPhone').value.trim() !== '';
            break;
        case 4:
            valid = true;
            break;
    }

    nextBtn.disabled = !valid;
}


// ===== PASO 1: SELECCIÓN DE SERVICIO =====
function selectService(element) {
    document.querySelectorAll('.service-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');

    bookingData.service = element.dataset.service;
    bookingData.price = parseInt(element.dataset.price);
    bookingData.duration = element.dataset.time;

    validateStep();
}


// ===== PASO 2: CALENDARIO =====
let currentCalendarDate = new Date();
const today = new Date();
const maxDate = new Date();
maxDate.setMonth(maxDate.getMonth() + 1);

const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

function initCalendar() {
    renderCalendar();
}

function changeMonth(delta) {
    const newDate = new Date(currentCalendarDate);
    newDate.setMonth(newDate.getMonth() + delta);

    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    if (newDate >= minMonth && newDate <= maxMonth) {
        currentCalendarDate = newDate;
        renderCalendar();
    }

    document.getElementById('prevMonthBtn').disabled = newDate <= minMonth;
    document.getElementById('nextMonthBtn').disabled = newDate >= maxMonth;
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('currentMonthLabel');

    label.textContent = monthNames[currentCalendarDate.getMonth()] + ' ' + currentCalendarDate.getFullYear();
    grid.innerHTML = '';

    // Etiquetas de días
    dayNames.forEach(day => {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'calendar-day-label';
        dayLabel.textContent = day;
        grid.appendChild(dayLabel);
    });

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Días del mes anterior (deshabilitados)
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month disabled';
        day.textContent = daysInPrevMonth - i;
        grid.appendChild(day);
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        const date = new Date(year, month, i);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = date.toDateString() === today.toDateString();
        const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isFuture = date > maxDate;

        day.className = 'calendar-day';
        day.textContent = i;

        if (isToday) day.classList.add('today');
        if (isPast || isFuture) day.classList.add('disabled');

        if (bookingData.date && dateStr === bookingData.date.toISOString().split('T')[0]) {
            day.classList.add('selected');
        }

        if (!isPast && !isFuture) {
            day.onclick = () => selectDate(date);
        }

        grid.appendChild(day);
    }

    // Días del mes siguiente (relleno)
    const remainingCells = 42 - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month disabled';
        day.textContent = i;
        grid.appendChild(day);
    }
}

function selectDate(date) {
    bookingData.date = date;
    bookingData.time = '';
    renderCalendar();
    renderTimeSlots(date);
    document.getElementById('timeSlotsContainer').style.display = 'block';
    validateStep();
}


// ===== HORARIOS DISPONIBLES =====
// Lunes a viernes: 09:00 - 20:00 | Sábado: 09:00 - 18:00 | Domingo: cerrado
function renderTimeSlots(date) {
    const container = document.getElementById('timeSlots');
    const dateStr = date.toISOString().split('T')[0];
    const allSlots = [
        '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
    ];
    const dayOfWeek = date.getDay();
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;

    // Sábado cierra a las 18:00; domingo cerrado
    const availableSlots = isSunday
        ? []
        : isSaturday
            ? allSlots.filter(s => parseInt(s) < 18)
            : allSlots;

    container.innerHTML = '';

    if (availableSlots.length === 0) {
        container.innerHTML = '<p style="color: var(--gray); text-align: center; grid-column: span 4; font-size: 0.85rem;">No hay horarios disponibles los domingos</p>';
        return;
    }

    const taken = BookingStore.getTakenSlots(dateStr);

    availableSlots.forEach(slot => {
        const btn = document.createElement('button');
        btn.className = 'time-slot';
        btn.textContent = slot;

        if (taken.includes(slot)) {
            btn.classList.add('taken');
            btn.disabled = true;
        } else if (bookingData.time === slot) {
            btn.classList.add('selected');
        }

        if (!taken.includes(slot)) {
            btn.onclick = () => selectTime(slot);
        }

        container.appendChild(btn);
    });
}

function selectTime(time) {
    bookingData.time = time;
    document.querySelectorAll('.time-slot').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === time && !btn.classList.contains('taken')) {
            btn.classList.add('selected');
        }
    });
    validateStep();
}


// ===== PASO 3: VALIDACIÓN EN TIEMPO REAL =====
document.getElementById('clientName').addEventListener('input', validateStep);
document.getElementById('clientPhone').addEventListener('input', validateStep);


// ===== PASO 4: RESUMEN =====
function updateSummary() {
    bookingData.name = document.getElementById('clientName').value;
    bookingData.phone = document.getElementById('clientPhone').value;
    bookingData.email = document.getElementById('clientEmail').value;
    bookingData.notes = document.getElementById('clientNotes').value;

    document.getElementById('summaryService').textContent = bookingData.service;
    document.getElementById('summaryDate').textContent = bookingData.date
        ? bookingData.date.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '-';
    document.getElementById('summaryTime').textContent = bookingData.time || '-';
    document.getElementById('summaryDuration').textContent = bookingData.duration;
    document.getElementById('summaryName').textContent = bookingData.name || '-';
    document.getElementById('summaryPhone').textContent = bookingData.phone || '-';
    document.getElementById('summaryPrice').textContent = '$' + bookingData.price.toLocaleString('es-CL');
}


// ===== CONFIRMAR RESERVA =====
function submitBooking() {
    const dateStr = bookingData.date.toISOString().split('T')[0];

    // Guardar el horario como ocupado antes de redirigir
    const saved = BookingStore.addBooking(dateStr, bookingData.time);
    if (!saved) {
        alert('Este horario acaba de ser reservado. Por favor selecciona otro.');
        currentStep = 2;
        updateStepIndicator();
        showStep(2);
        return;
    }

    const dateFormatted = bookingData.date.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let message = `Hola Queens Nails by Rose! 👑✨%0A%0A`;
    message += `Me gustaria reservar una cita:%0A%0A`;
    message += `*Servicio:* ${bookingData.service}%0A`;
    message += `*Fecha:* ${dateFormatted}%0A`;
    message += `*Hora:* ${bookingData.time}%0A`;
    message += `*Duracion:* ${bookingData.duration}%0A`;
    message += `*Precio:* $${bookingData.price.toLocaleString('es-CL')}%0A%0A`;
    message += `*Mis datos:*%0A`;
    message += `Nombre: ${bookingData.name}%0A`;
    message += `Telefono: ${bookingData.phone}%0A`;
    if (bookingData.email) message += `Email: ${bookingData.email}%0A`;
    if (bookingData.notes) message += `Notas: ${bookingData.notes}%0A`;
    message += `%0AGracias! Espero confirmacion. 💅`;

    const whatsappUrl = `https://wa.me/56989589294?text=${message}`;
    window.open(whatsappUrl, '_blank');

    closeBookingModal();
}


// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});


// ===== SCROLL REVEAL =====
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

revealElements.forEach(el => revealObserver.observe(el));


// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});