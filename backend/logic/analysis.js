const _ = require('lodash');
const scenarioDAL = require('../dal/scenario');
const dates = require('./dates');
const { addDays, isBefore, isWeekend, addMonths, isAfter, parseISO } = require('date-fns');

async function getSummaryForDate(scenarioID, profileID, cutoffDateStr) {
    const cutoffDate = parseISO(cutoffDateStr);

    const rows = await scenarioDAL.getEventsForScenarioByDate(scenarioID, profileID, cutoffDateStr);

    let totalCredits = 0;
    let totalDebits = 0;

    for (const event of rows) {
        const occurrences = calculateOccurrences(event, cutoffDate);
        const totalAmount = occurrences * parseFloat(event.amount);

        if (event.type === 'CREDIT') {
            totalCredits += totalAmount;
        } else if (event.type === 'DEBIT') {
            totalDebits += totalAmount;
        }
    }

    let netBalance = totalCredits - totalDebits;

    return { totalCredits, totalDebits, netBalance };
}

function calculateOccurrences(event, cutoffDate) {
    const start = parseISO(event.start_date);
    const end = event.end_date ? parseISO(event.end_date) : cutoffDate;
    const finalDate = isBefore(end, cutoffDate) ? end : cutoffDate;

    let count = 0;
    let current = start;

    const frequency = event.frequency;

    while (!isAfter(current, finalDate)) {
        switch (frequency) {
            case 'ONCE':
                return 1;
            case 'DAILY':
                count++;
                current = addDays(current, 1);
                break;
            case 'EVERY_OTHER_DAY':
                count++;
                current = addDays(current, 2);
                break;
            case 'WEEKDAYS_ONLY':
                if (!isWeekend(current)) count++;
                current = addDays(current, 1);
                break;
            case 'WEEKENDS_ONLY':
                if (isWeekend(current)) count++;
                current = addDays(current, 1);
                break;
            case 'WEEKLY':
                count++;
                current = addDays(current, 7);
                break;
            case 'EVERY_OTHER_WEEK':
                count++;
                current = addDays(current, 14);
                break;
            case 'MONTHLY':
                count++;
                current = addMonths(current, 1);
                break;
            case 'EVERY_OTHER_MONTH':
                count++;
                current = addMonths(current, 2);
                break;
            case 'TWICE_PER_YEAR':
                count++;
                current = addMonths(current, 6);
                break;
            case 'YEARLY':
                count++;
                current = addMonths(current, 12);
                break;
            default:
                return 0;
        }
    }

    return count;
}

function addIfInMonth(d, calendarMonthStart, calendarMonthEnd, result) {
    if (d >= calendarMonthStart && d <= calendarMonthEnd) {
        const exists = result.some(x => x.getTime() === d.getTime());
        if (!exists) {
            result.push(new Date(d));
        }
    }
}

function generateOccurrences(startDate, endDate, calendarMonthStart, calendarMonthEnd, intervalDays, result) {
    for (let d = new Date(startDate); d <= calendarMonthEnd; d.setDate(d.getDate() + intervalDays)) {
        if (d.getTime() > endDate.getTime()) {
            continue;
        }
        addIfInMonth(d, calendarMonthStart, calendarMonthEnd, result);
    }

    for (let d = new Date(startDate); d >= calendarMonthStart; d.setDate(d.getDate() - intervalDays)) {
        if (d.getTime() < startDate.getTime()) {
            continue;
        }
        addIfInMonth(d, calendarMonthStart, calendarMonthEnd, result);
    }
}

function generateMonthlyOccurences(startDate, endDate, calendarMonthStart, calendarMonthEnd, result, targetYear, targetMonth) {
    //we'll base it on start date
    const dateOfMonth = new Date(startDate).getUTCDate();
    
    // Create the actual target date within the target month in UTC
    const targetDate = new Date(Date.UTC(targetYear, targetMonth, dateOfMonth));
    
    // Check if the target date falls within the event's date range
    if (targetDate.getTime() >= startDate.getTime() && 
        (!endDate || targetDate.getTime() <= endDate.getTime())) {
        addIfInMonth(targetDate, calendarMonthStart, calendarMonthEnd, result);
    }
}

function isAligned(dateA, startDate, intervalDays) {
    const diffTime = dateA.getTime() - startDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays % intervalDays === 0;
}

function generateOccurrencesForMonth(event, targetMonth, targetYear) {
    targetMonth = Number(targetMonth);
    targetYear = Number(targetYear);

    const startDate = dates.getNormalizedLocalDate(event.start_date);
    const endDate = dates.getNormalizedLocalDate(event.end_date);
    const frequency = event.frequency;
    const result = [];

    let calendarMonthStart = new Date(targetYear, targetMonth, 1);
    let calendarMonthEnd = new Date(targetYear, targetMonth + 1, 0);

    calendarMonthStart.setDate(calendarMonthStart.getDate() - calendarMonthStart.getDay());
    calendarMonthEnd.setDate(calendarMonthEnd.getDate() + (6 - calendarMonthEnd.getDay()));

    switch (frequency) {
        case 'ONCE':
            addIfInMonth(startDate, calendarMonthStart, calendarMonthEnd, result);
            break;

        case 'DAILY':
            generateOccurrences(startDate, endDate, calendarMonthStart, calendarMonthEnd, 1, result);
            break;

        case 'EVERY_OTHER_DAY':
            generateOccurrences(startDate, endDate, calendarMonthStart, calendarMonthEnd, 2, result);
            break;

        case 'WEEKLY':
            generateOccurrences(startDate, endDate, calendarMonthStart, calendarMonthEnd, 7, result);
            break;

        case 'EVERY_OTHER_WEEK':
            generateOccurrences(startDate, endDate, calendarMonthStart, calendarMonthEnd, 14, result);
            break;

        case 'WEEKDAYS_ONLY':
            for (let d = new Date(calendarMonthStart); d <= calendarMonthEnd; d.setDate(d.getDate() + 1)) {
                if ((d.getDay() >= 1 && d.getDay() <= 5) && isAligned(d, startDate, 1)) {
                    addIfInMonth(d, calendarMonthStart, calendarMonthEnd, result);
                }
            }
            break;

        case 'WEEKENDS_ONLY':
            for (let d = new Date(calendarMonthStart); d <= calendarMonthEnd; d.setDate(d.getDate() + 1)) {
                if ((d.getDay() === 0 || d.getDay() === 6) && isAligned(d, startDate, 1)) {
                    addIfInMonth(d, calendarMonthStart, calendarMonthEnd, result);
                }
            }
            break;

        case 'MONTHLY':
            console.log('Processing MONTHLY event:', {
                eventName: event.name,
                startDate: startDate.toISOString(),
                targetYear,
                targetMonth,
                dateOfMonth: new Date(startDate).getUTCDate()
            });
            generateMonthlyOccurences(startDate, endDate, calendarMonthStart, calendarMonthEnd, result, targetYear, targetMonth);
            console.log('MONTHLY result:', result);
            //addIfInMonth(new Date(targetYear, targetMonth, startDate.getDate()), calendarMonthStart, calendarMonthEnd, result);
            break;

        case 'EVERY_OTHER_MONTH':
            const monthsBetween = (targetYear - startDate.getFullYear()) * 12 + (targetMonth - startDate.getMonth());
            if (monthsBetween % 2 === 0 && monthsBetween >= -24 && monthsBetween <= 24) {
                generateMonthlyOccurences(startDate, endDate, calendarMonthStart, calendarMonthEnd, result, targetYear, targetMonth);
                //addIfInMonth(new Date(targetYear, targetMonth, startDate.getDate()), calendarMonthStart, calendarMonthEnd, result);
            }
            break;

        case 'TWICE_PER_YEAR':
            const firstMonth = startDate.getUTCMonth();
            const secondMonth = (firstMonth + 6) % 12;
            if (targetMonth === firstMonth || targetMonth === secondMonth) {
                addIfInMonth(new Date(targetYear, targetMonth, startDate.getUTCDate()), calendarMonthStart, calendarMonthEnd, result);
            }
            break;

        case 'YEARLY':
            if (startDate.getUTCMonth() === targetMonth) {
                addIfInMonth(new Date(targetYear, targetMonth, startDate.getUTCDate()), calendarMonthStart, calendarMonthEnd, result);
            }
            break;
    }

    return result;
}



// Main function
async function getScenarioEventsForMonth(scenarioID, profileID, month, year, userID) {
    let events = await scenarioDAL.getScenarioEvents(scenarioID, profileID, userID);

    // Debug logging to see what fields are available
    if (events && events.length > 0) {
        console.log('Sample event fields from database:', Object.keys(events[0]));
        console.log('Sample event data:', events[0]);
    }

    const results = [];

    for (const event of events) {
        const occurrences = generateOccurrencesForMonth(event, month, year);
        
        // Debug logging for loan events
        if (event.category === 'AUTO_LOAN' || event.category === 'HOUSING' || event.category === 'GENERIC_LOAN') {
            console.log('Backend processing loan event:', {
                name: event.name,
                category: event.category,
                amount: event.amount,
                monthly_payment: event.monthly_payment,
                original_amount: event.original_amount
            });
        }
        
        results.push({ event, occurrences });
        
        // Debug the final result structure for loan events
        if (event.category === 'AUTO_LOAN' || event.category === 'HOUSING' || event.category === 'GENERIC_LOAN') {
            console.log('Backend final result for loan event:', {
                name: event.name,
                eventStructure: { event, occurrences },
                eventMonthlyPayment: event.monthly_payment,
                resultEventMonthlyPayment: results[results.length - 1].event.monthly_payment
            });
        }
    }

    return results;
}


module.exports = {
    getSummaryForDate,
    getScenarioEventsForMonth
}