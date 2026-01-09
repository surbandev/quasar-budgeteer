const PROD = true // Set to true for production

export function getAPIURL() {
  if (PROD) {
    return 'https://budgeteer.x01r.xyz'
  } else {
    return 'http://localhost:3000'
  }
}
