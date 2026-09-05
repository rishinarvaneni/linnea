export function formatCurrency(amountPaise: number): string {
  return `₹${(amountPaise / 100).toLocaleString('en-IN')}`
}
