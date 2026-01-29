// Currency formatting utilities
// Supports multiple currencies for international clubs

export type CurrencyCode =
  | 'EUR'  // Euro (Europe)
  | 'USD'  // US Dollar (USA, Ecuador, Panama)
  | 'MXN'  // Mexican Peso
  | 'ARS'  // Argentine Peso
  | 'CLP'  // Chilean Peso
  | 'COP'  // Colombian Peso
  | 'PEN'  // Peruvian Sol
  | 'BRL'  // Brazilian Real
  | 'MYR'  // Malaysian Ringgit
  | 'CRC'  // Costa Rican Colon
  | 'VES'; // Venezuelan Bolivar

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  position: 'before' | 'after'; // Symbol position relative to amount
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', position: 'after' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', position: 'before' },
  MXN: { code: 'MXN', symbol: '$', name: 'Peso Mexicano', position: 'before' },
  ARS: { code: 'ARS', symbol: '$', name: 'Peso Argentino', position: 'before' },
  CLP: { code: 'CLP', symbol: '$', name: 'Peso Chileno', position: 'before' },
  COP: { code: 'COP', symbol: '$', name: 'Peso Colombiano', position: 'before' },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Sol Peruano', position: 'before' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real Brasileño', position: 'before' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Ringgit Malayo', position: 'before' },
  CRC: { code: 'CRC', symbol: '₡', name: 'Colón Costarricense', position: 'before' },
  VES: { code: 'VES', symbol: 'Bs.', name: 'Bolívar Venezolano', position: 'before' },
};

// List of currencies for select dropdowns
export const CURRENCY_OPTIONS = Object.values(CURRENCIES).map(c => ({
  value: c.code,
  label: `${c.symbol} - ${c.name} (${c.code})`,
  symbol: c.symbol,
}));

/**
 * Format an amount with the appropriate currency symbol
 * @param amount - The numeric amount to format
 * @param currencyCode - ISO 4217 currency code (defaults to EUR)
 * @returns Formatted string with currency symbol
 */
export function formatCurrency(amount: number, currencyCode: string = 'EUR'): string {
  const currency = CURRENCIES[currencyCode as CurrencyCode] || CURRENCIES.EUR;

  const formattedAmount = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (currency.position === 'before') {
    return `${currency.symbol}${formattedAmount}`;
  }
  return `${formattedAmount} ${currency.symbol}`;
}

/**
 * Get the currency symbol for a given currency code
 * @param currencyCode - ISO 4217 currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currencyCode: string = 'EUR'): string {
  const currency = CURRENCIES[currencyCode as CurrencyCode];
  return currency?.symbol || currencyCode;
}