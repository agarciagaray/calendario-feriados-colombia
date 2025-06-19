
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
        { name: 'Año Nuevo', date: new Date(year, 0, 1), fixed: true, type: 'Feriado Cívico' },
        { name: 'Día del Trabajo', date: new Date(year, 4, 1), fixed: true, type: 'Feriado Cívico' },
        { name: 'Día de la Independencia', date: new Date(year, 6, 20), fixed: true, type: 'Feriado Cívico' },
        { name: 'Batalla de Boyacá', date: new Date(year, 7, 7), fixed: true, type: 'Feriado Cívico' },
        { name: 'Inmaculada Concepción', date: new Date(year, 11, 8), fixed: true, type: 'Religioso (Católico)' },
        { name: 'Navidad', date: new Date(year, 11, 25), fixed: true, type: 'Religioso (Cristiano)' }
    ];

    // Calculate Easter Sunday
    const easter = getEasterSunday(year);

    // Easter-related holidays (these don't move with Ley Emiliani)
    holidays.push({ name: 'Jueves Santo', date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 3), fixed: true, type: 'Religioso (Católico)' });
    holidays.push({ name: 'Viernes Santo', date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2), fixed: true, type: 'Religioso (Católico)' });

    // Holidays that can be moved by Ley Emiliani
    holidays.push({ name: 'Epifanía', date: new Date(year, 0, 6), fixed: false, type: 'Religioso (Católico)' });
    holidays.push({ name: 'San José', date: new Date(year, 2, 19), fixed: false, type: 'Religioso (Católico)' });
    holidays.push({ name: 'Ascensión de Jesús', date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 39), fixed: false, type: 'Religioso (Católico)' });
    holidays.push({ name: 'Corpus Christi', date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 60), fixed: false, type: 'Religioso (Católico)' });
    holidays.push({ name: 'Sagrado Corazón', date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 68), fixed: false, type: 'Religioso (Católico)' });
    holidays.push({ name: 'San Pedro y San Pablo', date: new Date(year, 5, 29), fixed: false, type: 'Religioso (Católico)' });
    holidays.push({ name: 'Asunción de la Virgen', date: new Date(year, 7, 15), fixed: false, type: 'Religioso (Católico)' });
    holidays.push({ name: 'Día de la Raza', date: new Date(year, 9, 12), fixed: false, type: 'Feriado Cívico' });
    holidays.push({ name: 'Día de Todos los Santos', date: new Date(year, 10, 1), fixed: false, type: 'Religioso (Católico)' });
    holidays.push({ name: 'Independencia de Cartagena', date: new Date(year, 10, 11), fixed: false, type: 'Feriado Cívico' });

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

    // Modal DOM Elements
    const holidayModal = document.getElementById('holiday-modal');
    const modalHolidayName = document.getElementById('modal-holiday-name');
    const modalHolidayDate = document.getElementById('modal-holiday-date');
    const modalHolidayOriginalDateContainer = document.getElementById('modal-holiday-original-date-container');
    const modalHolidayOriginalDate = document.getElementById('modal-holiday-original-date');
    const modalHolidayDescription = document.getElementById('modal-holiday-description');
    const closeModalButton = holidayModal.querySelector('.close-button');
    const exportICalButton = document.getElementById('export-ical-button'); // Export button

    // Detailed descriptions for Carnival days
    const carnivalDayNames = [
        "Sábado de Carnaval",
        "Domingo de Carnaval",
        "Lunes de Carnaval",
        "Martes de Carnaval (Entierro de Joselito)"
    ];
    const carnivalDayDescriptions = [
        "Batalla de Flores: El desfile inaugural, con carrozas, comparsas, grupos de baile y disfraces, encabezado por la Reina del Carnaval.\nDesfile del Rey Momo: Un desfile satírico donde el personaje del Rey Momo, que representa la crítica social, recorre las calles.",
        "Gran Parada de Tradición y Folclor: Un desfile que muestra la riqueza de las danzas y disfraces autóctonos de la región, como la danza del Congo, el Garabato, el Mapalé, entre otros.",
        "Gran Parada de Comparsas: Un desfile donde las comparsas muestran sus elaborados trajes y coreografías, destacando la creatividad y la tradición.\nFestival de Orquestas: Un evento musical que celebra la rica tradición musical de la región con la presentación de diversas orquestas.\nEncuentro de Comedias: Un espacio para el humor y la sátira, con presentaciones de grupos que representan situaciones de la vida cotidiana con ingenio.",
        "Entierro de Joselito: Un evento que marca el fin del Carnaval, donde un muñeco llamado Joselito es \"enterrado\" por los asistentes, simbolizando el fin de la fiesta y el inicio de la Cuaresma."
    ];

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
     * Opens the holiday details modal and populates it with information.
     * @param {Object} holidayData - An object containing details about the holiday.
     *                               Expected properties: name, date (Date object),
     *                               originalDate (Date object, optional), moved (boolean, optional),
     *                               description (string, optional, formerly type).
     */
    function openModal(holidayData) {
        modalHolidayName.textContent = holidayData.name;
        modalHolidayDate.textContent = holidayData.date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        // Using 'description' field now for modal content, which can be type or detailed carnival desc.
        modalHolidayDescription.textContent = holidayData.description || 'No especificado';

        if (holidayData.moved && holidayData.originalDate) {
            modalHolidayOriginalDate.textContent = holidayData.originalDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            modalHolidayOriginalDateContainer.style.display = 'block';
        } else {
            modalHolidayOriginalDateContainer.style.display = 'none';
        }
        holidayModal.style.display = 'block';
    }

    /**
     * Closes the holiday details modal.
     */
    function closeModal() {
        holidayModal.style.display = 'none';
    }

    // Event listeners for closing the modal
    closeModalButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === holidayModal) { // Clicked on the modal backdrop
            closeModal();
        }
    });

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

        // FUTURE: Add event listener here to show holiday details on click. (Implemented below)
        // This could involve populating a modal with holiday.name, holiday.originalDate (if moved),
        // and potentially a description if available.
        // Example: dayCell.addEventListener('click', () => showHolidayDetails(holiday, date));

        // --- Add click listener for modal ---
        let holidayDataForModal = null;

        if (holiday) { // Prioritize full holiday object if available
            holidayDataForModal = { ...holiday, date: date, description: holiday.type }; // Use 'type' as 'description' for regular holidays
        } else if (isCarnival) {
            const carnivalDayIndex = carnivalData.carnivalDays.findIndex(
                carnivalDate => carnivalDate.toDateString() === date.toDateString()
            );
            if (carnivalDayIndex !== -1) {
                holidayDataForModal = {
                    name: carnivalDayNames[carnivalDayIndex] || 'Carnaval de Barranquilla',
                    date: date,
                    description: carnivalDayDescriptions[carnivalDayIndex] || 'Celebración del Carnaval.'
                };
            } else { // Should not happen if isCarnival is true, but as a fallback
                holidayDataForModal = {
                    name: 'Carnaval de Barranquilla',
                    date: date,
                    description: 'Celebración Cultural'
                };
            }
        } else if (carnivalData.ashWednesday.toDateString() === date.toDateString()) {
            holidayDataForModal = {
                name: 'Miércoles de Ceniza',
                date: date,
                description: 'Religioso (Católico)' // Using 'description' field
            };
        }

        if (holidayDataForModal) {
            dayCell.style.cursor = 'pointer'; // Indicate it's clickable
            dayCell.addEventListener('click', () => {
                // If the holiday object from getHolidays already has 'type', it will be used.
                // Otherwise, the synthetic 'type' for Carnival/Ash Wednesday is used.
                // Ensure the 'date' in holidayDataForModal is the actual cell date, not potentially a moved date's original instance.
                const finalHolidayData = {
                    name: holidayDataForModal.name,
                    date: date, // This is the actual date of the cell being clicked
                    originalDate: holidayDataForModal.originalDate, // From the main holiday list if Emiliani
                    moved: holidayDataForModal.moved, // From the main holiday list if Emiliani
                    // The 'description' field is now directly set in holidayDataForModal
                    description: holidayDataForModal.description || (holiday ? (holiday.moved ? 'Feriado (Ley Emiliani)' : 'Feriado') : 'Día Especial')
                };
                openModal(finalHolidayData);
            });
        }
        // --- End click listener for modal ---

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

    // --- iCalendar Export Functionality ---

    /**
     * Formats a JavaScript Date object into YYYYMMDD string format for iCalendar.
     * @param {Date} date - The date to format.
     * @returns {string} The date string in YYYYMMDD format.
     */
    function formatICalDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }

    /**
     * Generates iCalendar (.ics) data string from a list of events.
     * @param {number} year - The year for which the calendar is generated.
     * @param {Array<Object>} eventsToExport - Array of event objects.
     *                                         Each object should have: name, date, type,
     *                                         optional: originalDate, moved.
     * @returns {string} The iCalendar data as a string.
     */
    function generateICalData(year, eventsToExport) {
        let icalString = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//AlejandroGarcia//ColombianHolidayCalendar//NONSGML v1.0//ES', // Personalized PRODID
            'CALSCALE:GREGORIAN',
            `X-WR-CALNAME:Feriados Colombia ${year}` // Calendar name
        ].join('\r\n') + '\r\n';

        const dtstamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

        eventsToExport.forEach(event => {
            const startDate = event.date;
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1); // All-day events typically end the next day

            const uid = `${formatICalDate(startDate)}-${event.name.replace(/[^a-zA-Z0-9]/g, '')}@colombian-holidays.agarc.dev`;

            let description = event.type || '';
            if (event.moved && event.originalDate) {
                description += ` (Originalmente: ${event.originalDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}). Movido por Ley Emiliani.`;
            }
            description = description.replace(/\n/g, '\\n'); // Escape newlines

            icalString += [
                'BEGIN:VEVENT',
                `UID:${uid}`,
                `DTSTAMP:${dtstamp}`,
                `DTSTART;VALUE=DATE:${formatICalDate(startDate)}`,
                `DTEND;VALUE=DATE:${formatICalDate(endDate)}`,
                `SUMMARY:${event.name}`,
                `DESCRIPTION:${description}`,
                // Optional: Add location if relevant, or other properties
                // 'LOCATION:Colombia',
                'END:VEVENT'
            ].join('\r\n') + '\r\n';
        });

        icalString += 'END:VCALENDAR\r\n';
        return icalString;
    }

    /**
     * Handles the iCalendar export process.
     * Collects events, generates iCal data, and triggers download.
     */
    function handleExportICal() {
        const yearToExport = parseInt(yearSelect.value);

        // 1. Collect all holidays from getHolidays (already processed by Ley Emiliani)
        const processedHolidays = applyLeyEmiliani(getHolidays(yearToExport));

        // 2. Get Carnival and Ash Wednesday
        const carnivalData = getCarnivalDays(yearToExport);
        const carnivalEvents = carnivalData.carnivalDays.map(d => ({
            name: 'Carnaval de Barranquilla',
            date: d,
            type: 'Celebración Cultural'
        }));
        const ashWednesdayEvent = {
            name: 'Miércoles de Ceniza',
            date: carnivalData.ashWednesday,
            type: 'Religioso (Católico)'
        };

        // 3. Combine all events
        // We need to be careful about duplicates if a Carnival day or Ash Wednesday is also a listed holiday (unlikely but possible).
        // For simplicity, we'll add them; iCal clients often handle duplicate UIDs or overlapping events gracefully.
        // A more robust approach might filter duplicates based on date and name.
        const eventsToExport = [
            ...processedHolidays, // These objects already have name, date, type, moved, originalDate
            ...carnivalEvents,
            ashWednesdayEvent
        ];

        const icalData = generateICalData(yearToExport, eventsToExport);

        const blob = new Blob([icalData], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Feriados_Colombia_${yearToExport}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up the object URL
    }

    // Attach event listener to the export button
    if (exportICalButton) {
        exportICalButton.addEventListener('click', handleExportICal);
    }

});

// For testing purposes, expose functions if running in a test-like environment (e.g. test-runner.html)
if (typeof window !== 'undefined' && window.location && window.location.pathname && window.location.pathname.includes('test-runner.html')) {
    window.testableFunctions = {
        getEasterSunday,
        getCarnivalDays,
        getHolidays,
        applyLeyEmiliani,
        formatICalDate, // Expose for potential testing
        generateICalData // Expose for potential testing
    };
}
