const { addMonths, parseISO, format, differenceInMonths } = require('date-fns');

/**
 * Calculate loan end date based on total loan amount, interest rate, and additional monthly principal payment
 * @param {number} totalLoanAmount - Total loan amount
 * @param {number} additionalPrincipalPayment - Additional monthly principal payment amount
 * @param {number} interestRate - Annual interest rate (as decimal, e.g., 0.05 for 5%)
 * @param {string} startDate - Loan start date (ISO string)
 * @returns {Object} - { endDate: string, monthlyPayment: number, totalInterest: number, totalPayments: number }
 */
function calculateLoanDetails(totalLoanAmount, additionalPrincipalPayment, interestRate, startDate, loanTerm = null) {
    if (!totalLoanAmount || !interestRate || !startDate) {
        return null;
    }

    const start = parseISO(startDate);
    const monthlyInterestRate = (interestRate / 100) / 12; // Convert annual percentage to monthly decimal rate
    
    let bestTerm = 60; // default to 5 years
    let standardMonthlyPayment = 0;
    
    // If loan term is provided, use it directly
    if (loanTerm && loanTerm > 0) {
        bestTerm = parseInt(loanTerm);
        standardMonthlyPayment = calculateMonthlyPayment(totalLoanAmount, interestRate, bestTerm);
    }
    
    // If no loan term provided or invalid, determine a reasonable term
    if (!loanTerm || standardMonthlyPayment === 0) {
        // For auto loans, we need to determine a reasonable term
        // Let's calculate what the standard payment would be for common auto loan terms
        const commonTerms = [36, 48, 60, 72, 84]; // months
        
        // Find the term that gives us a reasonable monthly payment (not too high, not too low)
        for (const term of commonTerms) {
            const payment = calculateMonthlyPayment(totalLoanAmount, interestRate, term);
            if (payment > 0 && payment < totalLoanAmount * 0.05) { // Less than 5% of loan amount per month
                bestTerm = term;
                standardMonthlyPayment = payment;
                break;
            }
        }
        
        // If no reasonable term found, use 60 months as default
        if (standardMonthlyPayment === 0) {
            bestTerm = 60;
            standardMonthlyPayment = calculateMonthlyPayment(totalLoanAmount, interestRate, bestTerm);
        }
    }

    // Calculate total monthly payment (standard payment + additional principal)
    const totalMonthlyPayment = standardMonthlyPayment + (additionalPrincipalPayment || 0);

    // Now calculate the actual payoff time with the additional principal
    let remainingBalance = totalLoanAmount;
    let totalInterest = 0;
    let paymentCount = 0;
    const maxPayments = bestTerm * 2; // Allow up to double the standard term

    while (remainingBalance > 0.01 && paymentCount < maxPayments) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const standardPrincipalPayment = Math.max(0, standardMonthlyPayment - interestPayment);
        const additionalPrincipal = Math.min(additionalPrincipalPayment || 0, remainingBalance - standardPrincipalPayment);
        const totalPrincipalPayment = standardPrincipalPayment + additionalPrincipal;
        
        totalInterest += interestPayment;
        remainingBalance -= totalPrincipalPayment;
        paymentCount++;
        
        // Prevent infinite loops
        if (paymentCount > maxPayments) break;
    }

    // Calculate end date
    const endDate = addMonths(start, paymentCount);
    
    return {
        endDate: format(endDate, 'yyyy-MM-dd'),
        monthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
        standardPayment: Math.round(standardMonthlyPayment * 100) / 100,
        additionalPrincipal: Math.round((additionalPrincipalPayment || 0) * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalPayments: paymentCount,
        remainingBalance: Math.round(remainingBalance * 100) / 100
    };
}

/**
 * Calculate monthly payment for a loan using standard loan formula
 * @param {number} principal - Loan principal amount
 * @param {number} annualRate - Annual interest rate (as decimal)
 * @param {number} months - Loan term in months
 * @returns {number} - Monthly payment amount
 */
function calculateMonthlyPayment(principal, annualRate, months) {
    if (!principal || !annualRate || !months || months <= 0) {
        return 0;
    }

    const monthlyRate = (annualRate / 100) / 12; // Convert annual percentage to monthly decimal rate
    
    if (monthlyRate === 0) {
        return principal / months;
    }

    const monthlyPayment = principal * 
        (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
        (Math.pow(1 + monthlyRate, months) - 1);

    return Math.round(monthlyPayment * 100) / 100;
}

/**
 * Calculate loan amortization schedule
 * @param {number} principal - Loan principal amount
 * @param {number} annualRate - Annual interest rate (as decimal)
 * @param {number} months - Loan term in months
 * @param {string} startDate - Loan start date (ISO string)
 * @returns {Array} - Array of payment objects
 */
function calculateAmortizationSchedule(principal, annualRate, months, startDate) {
    const schedule = [];
    const monthlyRate = annualRate / 12;
    const monthlyPayment = calculateMonthlyPayment(principal, annualRate, months);
    let remainingBalance = principal;
    let currentDate = parseISO(startDate);

    for (let i = 0; i < months; i++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance -= principalPayment;

        schedule.push({
            paymentNumber: i + 1,
            date: format(currentDate, 'yyyy-MM-dd'),
            payment: monthlyPayment,
            principal: principalPayment,
            interest: interestPayment,
            balance: Math.max(0, remainingBalance)
        });

        currentDate = addMonths(currentDate, 1);
    }

    return schedule;
}

/**
 * Validate loan parameters
 * @param {Object} loanData - Loan data object
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validateLoanData(loanData) {
    const errors = [];
    const { totalLoanAmount, additionalPrincipalPayment, interestRate, startDate } = loanData;

    if (!totalLoanAmount || totalLoanAmount <= 0) {
        errors.push('Total loan amount must be greater than 0');
    }

    if (additionalPrincipalPayment && additionalPrincipalPayment < 0) {
        errors.push('Additional principal payment cannot be negative');
    }

    if (!interestRate || interestRate < 0) {
        errors.push('Interest rate must be 0 or greater');
    }

    if (!startDate) {
        errors.push('Start date is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    calculateLoanDetails,
    calculateMonthlyPayment,
    calculateAmortizationSchedule,
    validateLoanData
};
