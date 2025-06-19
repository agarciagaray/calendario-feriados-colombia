
// script.js

// FUTURE FEATURE: For localization, strings like month names, day names,
// holiday names, and UI labels should be stored in language-specific
// objects or files and loaded dynamically.
// Example: const currentLang = 'es'; // This could be set by user preference
// const L = {
//   es: {
//     monthNames: ["enero", "febrero", ...],
//     dayNamesShort: ["Dom", "Lun", ...],
//     dayNamesLong: ["Domingo", "Lunes", ...],
//     holidayNames: { "Año Nuevo": "Año Nuevo", "Día del Trabajo": "Día del Trabajo", ... },
//     controls: { selectYear: "Seleccionar Año:", view: "Vista:", today: "Hoy" }
//   },
//   en: {
//     monthNames: ["January", "February", ...],
//     dayNamesShort: ["Sun", "Mon", ...],
//     dayNamesLong: ["Sunday", "Monday", ...],
//     holidayNames: { "Año Nuevo": "New Year's Day", "Día del Trabajo": "Labor Day", ... },
//     controls: { selectYear: "Select Year:", view: "View:", today: "Today" }
//   }
// }
// Usage: const monthName = L[currentLang].monthNames[monthIndex];
// const holidayDisplayName = L[currentLang].holidayNames[holiday.name] || holiday.name;


// -----------------------------------------------------------------------------
// Core Holiday Calculation Logic
// Moved outside DOMContentLoaded for testability and modularity.
// -----------------------------------------------------------------------------

/**
 * Calculates Easter Sunday using the Anonymous Gregorian algorithm.
 * @param {number} year - The year for which to calculate Easter.
 * @returns {Date} The date of Easter Sunday.
 */
function getEasterSunday(year) {
    // Anonymous Gregorian algorithm to determine the date of Easter Sunday for a given year.
    // Valid for the Gregorian calendar (from 1583 onwards).
    const a = year % 19; // a = Metonic cycle position
    const b = Math.floor(year / 100); // b = Century
    const c = year % 100; // c = Year within the century
    const d = Math.floor(b / 4); // d = Leap year correction for century
    const e = b % 4; // e = Non-leap year correction for century
    const f = Math.floor((b + 8) / 25); // f = Correction for years when March equinox is late
    const g = Math.floor((b - f + 1) / 3); // g = Correction for lunar orbit
    const h = (19 * a + b - d - g + 15) % 30; // h = Number of days from March 21st to Paschal full moon
    const i = Math.floor(c / 4); // i = Leap year correction for year in century
    const k = c % 4; // k = Correction for leap years
    const l = (32 + 2 * e + 2 * i - h - k) % 7; // l = Number of days from March 21st to Paschal full moon
    const m = Math.floor((a + 11 * h + 22 * l) / 451); // m = Correction for very rare cases (e.g. 1981, 2076)

    // Calculate month and day of Easter Sunday
    const month = Math.floor((h + l - 7 * m + 114) / 31); // month: 3 for March, 4 for April
    const day = ((h + l - 7 * m + 114) % 31) + 1; // day of the month
    return new Date(year, month - 1, day); // month is 0-indexed in JavaScript Date
}

/**
 * Calculates Carnival days (Saturday to Tuesday before Ash Wednesday) and Ash Wednesday.
 * @param {number} year - The year for which to calculate Carnival.
 * @returns {Object} An object containing an array of Carnival day Date objects and Ash Wednesday Date object.
 */
function getCarnivalDays(year) {
    // Calculate Easter Sunday
    const easter = getEasterSunday(year);

    // Ash Wednesday is 46 days before Easter Sunday.
    const ashWednesday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 46);

    // Carnival traditionally includes the four days preceding Ash Wednesday:
    // Saturday, Sunday, Monday (Shrove Monday), and Tuesday (Shrove Tuesday/Mardi Gras).
    const carnivalDays = [];
    // Saturday (4 days before Ash Wednesday)
    carnivalDays.push(new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate() - 4));
    // Sunday (3 days before Ash Wednesday)
    carnivalDays.push(new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate() - 3));
    // Monday (2 days before Ash Wednesday)
    carnivalDays.push(new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate() - 2));
    // Tuesday (1 day before Ash Wednesday - Shrove Tuesday)
    carnivalDays.push(new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate() - 1));

    return { carnivalDays: carnivalDays, ashWednesday: ashWednesday };
}

/**
 * Retrieves the list of Colombian holidays for a given year.
 * This includes fixed holidays and those dependent on Easter.
 * @param {number} year - The year for which to get holidays.
 * @returns {Array<Object>} An array of holiday objects, each with name, date, and fixed status.
 */
function getHolidays(year) {
    // FUTURE FEATURE: Holiday names here are in Spanish. For localization,
    // these names would ideally be keys to a language pack.
    // e.g., { key: 'ANO_NUEVO', date: ..., fixed: true }
    // and then L[currentLang].holidayNames.ANO_NUEVO would provide the display name.
    // Fixed holidays that don't move
    let holidays = [
        { name: 'Año Nuevo', date: new Date(year, 0, 1), fixed: true },
        { name: 'Día del Trabajo', date: new Date(year, 4, 1), fixed: true },
        { name: 'Día de la Independencia', date: new Date(year, 6, 20), fixed: true },
        { name: 'Batalla de Boyacá', date: new Date(year, 7, 7), fixed: true },
        { name: 'Inmaculada Concepción', date: new Date(year, 11, 8), fixed: true },
        { name: 'Navidad', date: new Date(year, 11, 25), fixed: true }
    ];

    // Calculate Easter Sunday
    const easter = getEasterSunday(year);

    // Easter-related holidays (these don't move with Ley Emiliani)
    holidays.push({ name: 'Jueves Santo', date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 3), fixed: true });
    holidays.push({ name: 'Viernes Santo', date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2), fixed: true });

    // Holidays that can be moved by Ley Emiliani
    holidays.push({ name: 'Epifanía', date: new Date(year, 0, 6), fixed: false });
    holidays.push({ name: 'San José', date: new Date(year, 2, 19), fixed: false });
    holidays.push({ name: 'Ascensión de Jesús', date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 39), fixed: false });
    holidays.push({ name: 'Corpus Christi', date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 60), fixed: false });
    holidays.push({ name: 'Sagrado Corazón', date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 68), fixed: false });
    holidays.push({ name: 'San Pedro y San Pablo', date: new Date(year, 5, 29), fixed: false });
    holidays.push({ name: 'Asunción de la Virgen', date: new Date(year, 7, 15), fixed: false });
    holidays.push({ name: 'Día de la Raza', date: new Date(year, 9, 12), fixed: false });
    holidays.push({ name: 'Día de Todos los Santos', date: new Date(year, 10, 1), fixed: false });
    holidays.push({ name: 'Independencia de Cartagena', date: new Date(year, 10, 11), fixed: false });

    return holidays;
}

/**
 * Applies the "Ley Emiliani" to a list of holidays.
 * This law moves certain Colombian holidays to the following Monday.
 * @param {Array<Object>} holidays - An array of holiday objects.
 * @returns {Array<Object>} An array of holiday objects with dates adjusted according to Ley Emiliani.
 */
function applyLeyEmiliani(holidays) {
    const emilianiHolidays = [];

    holidays.forEach(holiday => {
        const originalDate = new Date(holiday.date);
        let newDate = new Date(originalDate);
        let moved = false;

        // If it's a fixed holiday (e.g., Christmas, Independence Day) or an Easter-related religious holiday
        // (like Good Friday), it is not moved by Ley Emiliani.
        if (holiday.fixed) {
            emilianiHolidays.push({
                name: holiday.name,
                originalDate: originalDate,
                date: newDate,
                moved: false
            });
            return;
        }

        // Apply Ley Emiliani: if the holiday does not fall on a Monday, move it to the next Monday.
        // Day 0 is Sunday, 1 is Monday, ..., 6 is Saturday.
        if (newDate.getDay() !== 1) {
            const daysUntilMonday = (1 - newDate.getDay() + 7) % 7;
            newDate.setDate(newDate.getDate() + daysUntilMonday);
            moved = true;
        }

        emilianiHolidays.push({
            name: holiday.name,
            originalDate: originalDate,
            date: newDate,
            moved: moved
        });
    });

    return emilianiHolidays;
}

// -----------------------------------------------------------------------------
// DOMContentLoaded - UI Initialization and Event Handling
// -----------------------------------------------------------------------------

/**
 * Main script for the Colombian Holiday Calendar.
 * Handles year and view selection, holiday calculation (including Ley Emiliani),
 * and rendering of annual and monthly calendar views.
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM element references
    const yearSelect = document.getElementById('year-select');
    const viewSelect = document.getElementById('view-select');
    const calendarContainer = document.getElementById('calendar-container');
    const monthNavigation = document.getElementById('month-navigation');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentMonthYear = document.getElementById('current-month-year');
    const todayButton = document.getElementById('today-button');

    // State variables for current view
    let currentMonth = new Date().getMonth(); // 0-indexed month
    let currentYear = new Date().getFullYear();

    /**
     * Initializes the year selector dropdown with a range of years.
     */
    const initializeYearSelector = () => {
        const baseYear = new Date().getFullYear(); // Use a fixed base year for range consistency
        for (let i = baseYear - 5; i <= baseYear + 10; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === currentYear) { // Select the initially set currentYear
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }
    };

    /**
     * Sets up all the main event listeners for UI elements.
     */
    const setupEventListeners = () => {
        yearSelect.addEventListener('change', () => {
            currentYear = parseInt(yearSelect.value);
            renderCalendar();
        });

        viewSelect.addEventListener('change', renderCalendar);

        prevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11; // December of previous year
                currentYear--;
                yearSelect.value = currentYear; // Update year selector
            }
            renderCalendar();
        });

        nextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0; // January of next year
                currentYear++;
                yearSelect.value = currentYear; // Update year selector
            }
            renderCalendar();
        });

        todayButton.addEventListener('click', () => {
            const today = new Date();
            currentYear = today.getFullYear();
            currentMonth = today.getMonth();
            yearSelect.value = currentYear;

            // Switch to monthly view to show the current month and day
            viewSelect.value = 'monthly';
            renderCalendar();

            // Optional: Scroll to the top of the page to ensure the calendar is visible
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };

    initializeYearSelector();
    setupEventListeners();

    // Note: The core holiday calculation functions (getEasterSunday, getCarnivalDays, getHolidays, applyLeyEmiliani)
    // are now defined globally at the top of this file for better structure and testability.

    /**
     * Main function to render the calendar based on selected year and view (annual/monthly).
     * It fetches holidays, carnival data, and then calls the appropriate rendering function.
     */
    function renderCalendar() {
        const year = parseInt(yearSelect.value);
        const view = viewSelect.value;
        const holidays = applyLeyEmiliani(getHolidays(year));
        const carnivalData = getCarnivalDays(year);

        calendarContainer.innerHTML = ''; // Clear previous content

        if (view === 'annual') {
            monthNavigation.style.display = 'none';
            renderAnnualCalendar(year, holidays, carnivalData);
        } else {
            monthNavigation.style.display = 'flex';
            renderMonthlyCalendar(year, currentMonth, holidays, carnivalData);
        }
    }

    /**
     * Creates a DOM element for a single day cell with appropriate styling.
     * @param {Date} date - The date for the cell.
     * @param {Array<Object>} holidays - Processed list of holidays.
     * @param {Object} carnivalData - Object containing carnival days and Ash Wednesday.
     * @returns {HTMLElement} The created day cell element.
     */
    function createDayCell(date, holidays, carnivalData) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell');
        dayCell.textContent = date.getDate();

        // Highlight Sundays
        if (date.getDay() === 0) { // 0 is Sunday
            dayCell.classList.add('sunday');
        }

        // Check for Ash Wednesday
        if (carnivalData.ashWednesday.toDateString() === date.toDateString()) {
            dayCell.classList.add('ash-wednesday');
            dayCell.title = 'Miércoles de Ceniza';
        }

        // Check for Carnival days
        const isCarnival = carnivalData.carnivalDays.some(carnivalDay => carnivalDay.toDateString() === date.toDateString());
        if (isCarnival) {
            dayCell.classList.add('carnival');
            dayCell.title = 'Carnaval de Barranquilla';
        }

        // Check for other holidays
        const holiday = holidays.find(h => h.date.toDateString() === date.toDateString());
        if (holiday) {
            // If it's a carnival day or Ash Wednesday, their specific styling takes precedence over generic holiday.
            // However, the title should still reflect the holiday name if applicable.
            if (dayCell.classList.contains('carnival') || dayCell.classList.contains('ash-wednesday')) {
                dayCell.title += ` / ${holiday.name}`;
                 if (holiday.moved) {
                    dayCell.title += ` (Movido desde: ${holiday.originalDate.toLocaleDateString('es-ES')})`;
                }
            } else {
                if (holiday.moved) {
                    dayCell.classList.add('emiliani-holiday');
                    dayCell.title = `${holiday.name} (Movido desde: ${holiday.originalDate.toLocaleDateString('es-ES')})`;
                } else {
                    dayCell.classList.add('holiday');
                    dayCell.title = holiday.name;
                }
            }
        }

        // Highlight today's date
        if (date.toDateString() === new Date().toDateString()) {
            dayCell.classList.add('today');
        }

        // FUTURE: Add event listener here to show holiday details on click.
        // This could involve populating a modal with holiday.name, holiday.originalDate (if moved),
        // and potentially a description if available.
        // Example: dayCell.addEventListener('click', () => showHolidayDetails(holiday, date));

        return dayCell;
    }

    /**
     * Renders the annual calendar view for the given year.
     * @param {number} year - The year to render.
     * @param {Array<Object>} holidays - Processed list of holidays.
     * @param {Object} carnivalData - Object containing carnival days and Ash Wednesday.
     */
    function renderAnnualCalendar(year, holidays, carnivalData) {
        const monthsContainer = document.createElement('div');
        monthsContainer.classList.add('annual-view');

        for (let i = 0; i < 12; i++) { // Iterate through each month (0-11)
            const monthDiv = document.createElement('div');
            monthDiv.classList.add('month-card');

            const monthName = document.createElement('div');
            monthName.classList.add('month-name');
            // FUTURE FEATURE: Localization: Month names should be dynamic.
            // Example: monthName.textContent = L[currentLang].monthNames[i];
            monthName.textContent = new Date(year, i).toLocaleString('es-ES', { month: 'long' });
            monthDiv.appendChild(monthName);

            const daysGrid = document.createElement('div');
            daysGrid.classList.add('calendar-grid');

            // Add day headers (Dom, Lun, Mar, etc.)
            // FUTURE FEATURE: Localization: Day names should be dynamic.
            // Example: const dayNames = L[currentLang].dayNamesShort;
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            dayNames.forEach(dayName => {
                const header = document.createElement('div');
                header.classList.add('day-header');
                header.textContent = dayName;
                daysGrid.appendChild(header);
            });

            // Add empty cells for days before the first day of the month
            const firstDayOfMonth = new Date(year, i, 1).getDay(); // 0 for Sunday, 1 for Monday...
            for (let j = 0; j < firstDayOfMonth; j++) {
                const emptyCell = document.createElement('div');
                emptyCell.classList.add('day-cell', 'empty-cell');
                daysGrid.appendChild(emptyCell);
            }

            // Add day cells for the month
            const daysInMonth = new Date(year, i + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, i, day);
                const dayCell = createDayCell(date, holidays, carnivalData);
                daysGrid.appendChild(dayCell);
            }
            monthDiv.appendChild(daysGrid);
            monthsContainer.appendChild(monthDiv);
        }
        calendarContainer.appendChild(monthsContainer);
    }

    /**
     * Renders the monthly calendar view for the given year and month.
     * @param {number} year - The year to render.
     * @param {number} month - The month to render (0-11).
     * @param {Array<Object>} holidays - Processed list of holidays.
     * @param {Object} carnivalData - Object containing carnival days and Ash Wednesday.
     */
    function renderMonthlyCalendar(year, month, holidays, carnivalData) {
        // FUTURE FEATURE: Localization: Month and year display should be dynamic.
        // Example: currentMonthYear.textContent = `${L[currentLang].monthNames[month]} ${year}`;
        currentMonthYear.textContent = `${new Date(year, month).toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`;

        const monthlyContainer = document.createElement('div');
        monthlyContainer.classList.add('monthly-view');

        const daysGrid = document.createElement('div');
        daysGrid.classList.add('calendar-grid');

        // Add day headers (Domingo, Lunes, Martes, etc.)
        // FUTURE FEATURE: Localization: Day names should be dynamic.
        // Example: const dayNames = L[currentLang].dayNamesLong;
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        dayNames.forEach(dayName => {
            const header = document.createElement('div');
            header.classList.add('day-header');
            header.textContent = dayName;
            daysGrid.appendChild(header);
        });

        // Add empty cells for days before the first day of the month
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        for (let j = 0; j < firstDayOfMonth; j++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day-cell', 'empty-cell');
            daysGrid.appendChild(emptyCell);
        }

        // Add day cells for the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            // For monthly view, we might pass an extra flag if specific styling is needed, but current createDayCell is generic.
            const dayCell = createDayCell(date, holidays, carnivalData);
            daysGrid.appendChild(dayCell);
        }

        monthlyContainer.appendChild(daysGrid);
        calendarContainer.appendChild(monthlyContainer);
    }

    // Initial render on page load
    renderCalendar();
});

// FUTURE FEATURE: function generateICalData(year, holidays) { /* ... */ }
// This function would iterate through all holidays (original and moved) for the given year,
// format them as iCalendar (.ics) events, and then trigger a download of the .ics file.
// Each event should have a UID, start date (DTSTART), end date (DTEND, typically next day for all-day events),
// summary (holiday name), and potentially a description (e.g., if it was moved by Ley Emiliani).
// Example event structure:
// BEGIN:VEVENT
// UID:20240101@colombianholidays.example.com
// DTSTAMP:YYYYMMDDTHHMMSSZ (timestamp of generation)
// DTSTART;VALUE=DATE:20240101
// DTEND;VALUE=DATE:20240102
// SUMMARY:Año Nuevo
// END:VEVENT

// For testing purposes, expose functions if running in a test-like environment (e.g. test-runner.html)
if (typeof window !== 'undefined' && window.location && window.location.pathname && window.location.pathname.includes('test-runner.html')) {
    window.testableFunctions = {
        getEasterSunday,
        getCarnivalDays,
        getHolidays,
        applyLeyEmiliani
    };
}
