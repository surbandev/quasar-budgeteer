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

  export function showSuccessCheckmark() {
    // Create overlay element
    const overlay = document.createElement('div')
    overlay.className = 'success-checkmark-overlay'
    overlay.innerHTML = '<i class="material-icons success-checkmark-icon">check_circle</i>'
    document.body.appendChild(overlay)

    // Trigger animation
    setTimeout(() => {
      overlay.classList.add('show')
    }, 10)

    // Remove after 1.5 seconds
    setTimeout(() => {
      overlay.classList.remove('show')
      setTimeout(() => {
        document.body.removeChild(overlay)
      }, 300) // Wait for fade out animation
    }, 1500)
  }
