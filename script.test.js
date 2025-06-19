// script.test.js

document.addEventListener('DOMContentLoaded', () => {
    const resultsDiv = document.getElementById('test-results');
    resultsDiv.innerHTML = ''; // Clear "Loading tests..." message

    // Helper function to display test results in the HTML
    function displayTestResult(testName, success, message = '') {
        const resultP = document.createElement('p');
        resultP.textContent = `${testName}: ${success ? 'PASSED' : 'FAILED'} ${message}`;
        resultP.className = success ? 'passed' : 'failed';
        resultsDiv.appendChild(resultP);
    }

    // Access functions from script.js
    const {
        getEasterSunday,
        getCarnivalDays,
        getHolidays,
        applyLeyEmiliani
    } = window.testableFunctions || {};

    if (!getEasterSunday || !getCarnivalDays || !getHolidays || !applyLeyEmiliani) {
        displayTestResult('Function Loading', false, 'Not all testable functions were found. Check script.js `window.testableFunctions`.');
        return;
    }

    // --- Helper to compare dates (ignoring time) ---
    function datesAreEqual(date1, date2) {
        if (!date1 || !date2) return false;
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    // --- Tests for getEasterSunday ---
    try {
        const easter2023 = getEasterSunday(2023);
        displayTestResult('getEasterSunday(2023)', datesAreEqual(easter2023, new Date(2023, 3, 9)), `Expected Apr 9, Got ${easter2023.toDateString()}`);

        const easter2024 = getEasterSunday(2024);
        displayTestResult('getEasterSunday(2024)', datesAreEqual(easter2024, new Date(2024, 2, 31)), `Expected Mar 31, Got ${easter2024.toDateString()}`);

        const easter2025 = getEasterSunday(2025);
        displayTestResult('getEasterSunday(2025)', datesAreEqual(easter2025, new Date(2025, 3, 20)), `Expected Apr 20, Got ${easter2025.toDateString()}`);
    } catch (e) {
        displayTestResult('getEasterSunday general error', false, e.message);
    }

    // --- Tests for getCarnivalDays ---
    try {
        const carnival2024 = getCarnivalDays(2024); // Easter 2024 is Mar 31
        displayTestResult('getCarnivalDays(2024) - Ash Wednesday', datesAreEqual(carnival2024.ashWednesday, new Date(2024, 1, 14)), `Expected Feb 14, Got ${carnival2024.ashWednesday.toDateString()}`);
        const carnivalDays2024 = carnival2024.carnivalDays;
        displayTestResult('getCarnivalDays(2024) - Carnival Saturday', datesAreEqual(carnivalDays2024[0], new Date(2024, 1, 10)), `Expected Feb 10, Got ${carnivalDays2024[0].toDateString()}`);
        displayTestResult('getCarnivalDays(2024) - Carnival Sunday', datesAreEqual(carnivalDays2024[1], new Date(2024, 1, 11)), `Expected Feb 11, Got ${carnivalDays2024[1].toDateString()}`);
        displayTestResult('getCarnivalDays(2024) - Carnival Monday', datesAreEqual(carnivalDays2024[2], new Date(2024, 1, 12)), `Expected Feb 12, Got ${carnivalDays2024[2].toDateString()}`);
        displayTestResult('getCarnivalDays(2024) - Carnival Tuesday', datesAreEqual(carnivalDays2024[3], new Date(2024, 1, 13)), `Expected Feb 13, Got ${carnivalDays2024[3].toDateString()}`);
    } catch (e) {
        displayTestResult('getCarnivalDays general error', false, e.message);
    }

    // --- Tests for getHolidays ---
    try {
        const holidays2024 = getHolidays(2024); // Raw holidays, before Ley Emiliani
        const anoNuevo2024 = holidays2024.find(h => h.name === 'Año Nuevo');
        displayTestResult('getHolidays(2024) - Año Nuevo (Fixed)', datesAreEqual(anoNuevo2024.date, new Date(2024, 0, 1)));

        const juevesSanto2024 = holidays2024.find(h => h.name === 'Jueves Santo'); // Easter 2024 is Mar 31
        displayTestResult('getHolidays(2024) - Jueves Santo (Easter-dependent, Fixed)', datesAreEqual(juevesSanto2024.date, new Date(2024, 2, 28)));
    } catch (e) {
        displayTestResult('getHolidays general error', false, e.message);
    }

    // --- Tests for applyLeyEmiliani ---
    try {
        // Test 1: Holiday on Wednesday, should move to next Monday
        // San Jose in 2025 is March 19 (Wednesday). Should move to March 24.
        const sanJose2025_original = { name: 'San José', date: new Date(2025, 2, 19), fixed: false }; // March 19, 2025
        const holidaysToMove = [sanJose2025_original];
        const movedHolidays1 = applyLeyEmiliani(holidaysToMove);
        displayTestResult('applyLeyEmiliani - San José 2025 (Wednesday to Monday)',
            datesAreEqual(movedHolidays1[0].date, new Date(2025, 2, 24)) && movedHolidays1[0].moved === true,
            `Expected Mar 24, Got ${movedHolidays1[0].date.toDateString()}`);

        // Test 2: Holiday on Monday, should not move
        // Using a hypothetical "Test Holiday Monday" for clarity
        const testHolidayMonday_original = { name: 'Test Holiday Monday', date: new Date(2024, 6, 15), fixed: false }; // July 15, 2024 is a Monday
        const holidaysNotToMove = [testHolidayMonday_original];
        const movedHolidays2 = applyLeyEmiliani(holidaysNotToMove);
        displayTestResult('applyLeyEmiliani - Holiday on Monday (Should not move)',
            datesAreEqual(movedHolidays2[0].date, new Date(2024, 6, 15)) && movedHolidays2[0].moved === false,
            `Expected Jul 15, Got ${movedHolidays2[0].date.toDateString()}`);

        // Test 3: Fixed holiday, should not move
        const navidad2024_original = { name: 'Navidad', date: new Date(2024, 11, 25), fixed: true }; // Dec 25
        const fixedHolidays = [navidad2024_original];
        const movedHolidays3 = applyLeyEmiliani(fixedHolidays);
        displayTestResult('applyLeyEmiliani - Fixed Holiday (Navidad)',
            datesAreEqual(movedHolidays3[0].date, new Date(2024, 11, 25)) && movedHolidays3[0].moved === false,
            `Expected Dec 25, Got ${movedHolidays3[0].date.toDateString()}`);

        // Test 4: Holiday on Sunday, should move to next Monday
        const testHolidaySunday_original = { name: 'Test Holiday Sunday', date: new Date(2024, 6, 14), fixed: false }; // July 14, 2024 is a Sunday
        const holidaysToMoveSunday = [testHolidaySunday_original];
        const movedHolidays4 = applyLeyEmiliani(holidaysToMoveSunday);
        displayTestResult('applyLeyEmiliani - Holiday on Sunday (Should move to Monday)',
            datesAreEqual(movedHolidays4[0].date, new Date(2024, 6, 15)) && movedHolidays4[0].moved === true,
            `Expected Jul 15, Got ${movedHolidays4[0].date.toDateString()}`);

    } catch (e) {
        displayTestResult('applyLeyEmiliani general error', false, e.message);
    }

});
