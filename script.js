
// script.js

document.addEventListener('DOMContentLoaded', () => {
    const yearSelect = document.getElementById('year-select');
    const viewSelect = document.getElementById('view-select');
    const calendarContainer = document.getElementById('calendar-container');
    const monthNavigation = document.getElementById('month-navigation');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentMonthYear = document.getElementById('current-month-year');
    const todayButton = document.getElementById('today-button');

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    // Initialize year selector
    for (let i = currentYear - 5; i <= currentYear + 10; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }

    yearSelect.addEventListener('change', () => {
        currentYear = parseInt(yearSelect.value);
        renderCalendar();
    });

    viewSelect.addEventListener('change', renderCalendar);

    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
            yearSelect.value = currentYear;
        }
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
            yearSelect.value = currentYear;
        }
        renderCalendar();
    });

    todayButton.addEventListener('click', () => {
        const today = new Date();
        currentYear = today.getFullYear();
        currentMonth = today.getMonth();
        yearSelect.value = currentYear;

        // Switch to monthly view to show today
        viewSelect.value = 'monthly';
        renderCalendar();

        // Scroll to top to see the current month
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    function getCarnivalDays(year) {
        // Calculate Easter Sunday
        const easter = getEasterSunday(year);

        // Ash Wednesday is 46 days before Easter
        const ashWednesday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 46);

        // Carnival days are Saturday, Sunday, Monday, and Tuesday before Ash Wednesday
        const carnivalDays = [];

        // Saturday before Ash Wednesday (3 days before)
        const saturday = new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate() - 3);
        carnivalDays.push(saturday);

        // Sunday before Ash Wednesday (2 days before)
        const sunday = new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate() - 2);
        carnivalDays.push(sunday);

        // Monday before Ash Wednesday (1 day before)
        const monday = new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate() - 1);
        carnivalDays.push(monday);

        // Tuesday before Ash Wednesday (same as Shrove Tuesday)
        const tuesday = new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate() - 0);
        // Actually, Tuesday is the day before Ash Wednesday, so it should be -1 day from Ash Wednesday
        const shroveTuesday = new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate() - 1);

        // Let me recalculate this properly
        // If Ash Wednesday is day X, then:
        // Tuesday (Shrove Tuesday) = X - 1
        // Monday = X - 2  
        // Sunday = X - 3
        // Saturday = X - 4

        const carnivalDaysCorrect = [];
        for (let i = 4; i >= 1; i--) {
            const carnivalDay = new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate() - i);
            carnivalDaysCorrect.push(carnivalDay);
        }

        return { carnivalDays: carnivalDaysCorrect, ashWednesday: ashWednesday };
    }

    function getHolidays(year) {
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

    function applyLeyEmiliani(holidays) {
        const emilianiHolidays = [];

        holidays.forEach(holiday => {
            const originalDate = new Date(holiday.date);
            let newDate = new Date(originalDate);
            let moved = false;

            // If it's a fixed holiday, don't move it
            if (holiday.fixed) {
                emilianiHolidays.push({
                    name: holiday.name,
                    originalDate: originalDate,
                    date: newDate,
                    moved: false
                });
                return;
            }

            // Apply Ley Emiliani: move to next Monday if not already Monday
            if (newDate.getDay() !== 1) { // 1 is Monday
                const daysUntilMonday = (1 + 7 - newDate.getDay()) % 7;
                if (daysUntilMonday === 0) {
                    // If it's Sunday, move to next Monday
                    newDate.setDate(newDate.getDate() + 1);
                } else {
                    newDate.setDate(newDate.getDate() + daysUntilMonday);
                }
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

    // Function to calculate Easter Sunday (Meeus/Jones/Butcher algorithm)
    function getEasterSunday(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    }

    function renderCalendar() {
        const year = parseInt(yearSelect.value);
        const view = viewSelect.value;
        const holidays = applyLeyEmiliani(getHolidays(year));
        const carnivalData = getCarnivalDays(year);

        calendarContainer.innerHTML = '';

        if (view === 'annual') {
            monthNavigation.style.display = 'none';
            renderAnnualCalendar(year, holidays, carnivalData);
        } else {
            monthNavigation.style.display = 'flex';
            renderMonthlyCalendar(year, currentMonth, holidays, carnivalData);
        }
    }

    function renderAnnualCalendar(year, holidays, carnivalData) {
        const monthsContainer = document.createElement('div');
        monthsContainer.classList.add('annual-view');

        for (let i = 0; i < 12; i++) {
            const monthDiv = document.createElement('div');
            monthDiv.classList.add('month-card');

            const monthName = document.createElement('div');
            monthName.classList.add('month-name');
            monthName.textContent = new Date(year, i).toLocaleString('es-ES', { month: 'long' });
            monthDiv.appendChild(monthName);

            const daysGrid = document.createElement('div');
            daysGrid.classList.add('calendar-grid');

            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            dayNames.forEach(dayName => {
                const header = document.createElement('div');
                header.classList.add('day-header');
                header.textContent = dayName;
                daysGrid.appendChild(header);
            });

            const firstDayOfMonth = new Date(year, i, 1).getDay();
            for (let j = 0; j < firstDayOfMonth; j++) {
                const emptyCell = document.createElement('div');
                emptyCell.classList.add('day-cell', 'empty-cell');
                daysGrid.appendChild(emptyCell);
            }

            const daysInMonth = new Date(year, i + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, i, day);
                const dayCell = document.createElement('div');
                dayCell.classList.add('day-cell');
                dayCell.textContent = day;

                if (date.getDay() === 0) { // Sunday
                    dayCell.classList.add('sunday');
                }

                // Check if it's Ash Wednesday
                const isAshWednesday = carnivalData.ashWednesday.toDateString() === date.toDateString();
                if (isAshWednesday) {
                    dayCell.classList.add('ash-wednesday');
                    dayCell.title = 'Miércoles de Ceniza';
                }

                // Check if it's a carnival day
                const isCarnival = carnivalData.carnivalDays.some(carnivalDay => carnivalDay.toDateString() === date.toDateString());
                if (isCarnival) {
                    dayCell.classList.add('carnival');
                    dayCell.title = 'Carnaval de Barranquilla';
                }

                const holiday = holidays.find(h => h.date.toDateString() === date.toDateString());
                if (holiday) {
                    if (holiday.moved) {
                        dayCell.classList.add('emiliani-holiday');
                        dayCell.title = `${holiday.name} (Movido desde: ${holiday.originalDate.toLocaleDateString('es-ES')})`;
                    } else {
                        dayCell.classList.add('holiday');
                        dayCell.title = holiday.name;
                    }
                }

                if (date.toDateString() === new Date().toDateString()) {
                    dayCell.classList.add('today');
                }

                daysGrid.appendChild(dayCell);
            }
            monthDiv.appendChild(daysGrid);
            monthsContainer.appendChild(monthDiv);
        }
        calendarContainer.appendChild(monthsContainer);
    }

    function renderMonthlyCalendar(year, month, holidays, carnivalData) {
        currentMonthYear.textContent = `${new Date(year, month).toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`;

        const monthlyContainer = document.createElement('div');
        monthlyContainer.classList.add('monthly-view');

        const daysGrid = document.createElement('div');
        daysGrid.classList.add('calendar-grid');

        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        dayNames.forEach(dayName => {
            const header = document.createElement('div');
            header.classList.add('day-header');
            header.textContent = dayName;
            daysGrid.appendChild(header);
        });

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        for (let j = 0; j < firstDayOfMonth; j++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day-cell', 'empty-cell');
            daysGrid.appendChild(emptyCell);
        }

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayCell = document.createElement('div');
            dayCell.classList.add('day-cell');
            dayCell.textContent = day;

            if (date.getDay() === 0) { // Sunday
                dayCell.classList.add('sunday');
            }

            // Check if it's Ash Wednesday
            const isAshWednesday = carnivalData.ashWednesday.toDateString() === date.toDateString();
            if (isAshWednesday) {
                dayCell.classList.add('ash-wednesday');
                dayCell.title = 'Miércoles de Ceniza';
            }

            // Check if it's a carnival day
            const isCarnival = carnivalData.carnivalDays.some(carnivalDay => carnivalDay.toDateString() === date.toDateString());
            if (isCarnival) {
                dayCell.classList.add('carnival');
                dayCell.title = 'Carnaval de Barranquilla';
            }

            const holiday = holidays.find(h => h.date.toDateString() === date.toDateString());
            if (holiday) {
                if (holiday.moved) {
                    dayCell.classList.add('emiliani-holiday');
                    dayCell.title = `${holiday.name} (Movido desde: ${holiday.originalDate.toLocaleDateString('es-ES')})`;
                } else {
                    dayCell.classList.add('holiday');
                    dayCell.title = holiday.name;
                }
            }

            if (date.toDateString() === new Date().toDateString()) {
                dayCell.classList.add('today');
            }

            daysGrid.appendChild(dayCell);
        }

        monthlyContainer.appendChild(daysGrid);
        calendarContainer.appendChild(monthlyContainer);
    }

    renderCalendar();
});


