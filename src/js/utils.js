export function currencyFormat(amount) {
    let posNeg = '';
  
    posNeg = amount > 0 ? '+' : amount < 0 ? '-' : '';
  
    const currencySymbol = '$';
  
    const amountPositive = Math.abs(amount);
  
    const amountFormatted = amountPositive.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  
    return `${posNeg} ${currencySymbol} ${amountFormatted}`
  }

  export function useAmountColorClass(amount) {
    return amount > 0 ? 'text-positive' : amount < 0 ? 'text-negative' : 'text-grey-6';
  }