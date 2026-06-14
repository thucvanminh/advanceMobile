// Format utilities

export function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.01) return price.toFixed(6);
  return price.toFixed(8);
}

export function formatBalance(balance: number, currency: string = 'USDT'): string {
  if (currency === 'USDT') {
    return balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return balance.toFixed(6);
}

export function formatPercent(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

/**
 * Format a number with at least `sigFigs` significant figures.
 * Hiển thị đẹp: số lớn có dấu phẩy, số nhỏ không bị scientific notation.
 * Ví dụ: 12.3456 → "12.3456", 0.000123456 → "0.000123456"
 */
export function formatSignificant(value: number, sigFigs: number = 6): string {
  if (value === 0) return '0.00';

  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (abs >= 1) {
    const intDigits = Math.floor(Math.log10(abs)) + 1;
    const fractionDigits = Math.max(0, sigFigs - intDigits);
    const rounded = abs.toFixed(fractionDigits);
    const parts = rounded.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + parts.join('.');
  }

  // abs < 1: đếm số 0 sau dấu phẩy
  const str = abs.toFixed(20);
  const decimalPart = str.split('.')[1] || '';
  let leadingZeros = 0;
  for (const ch of decimalPart) {
    if (ch === '0') leadingZeros++;
    else break;
  }
  const totalPlaces = leadingZeros + sigFigs;
  return sign + abs.toFixed(totalPlaces);
}

export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatQuantity(qty: number, symbol: string): string {
  if (symbol.startsWith('BTC') || symbol.startsWith('ETH')) {
    return qty.toFixed(6);
  }
  return qty.toFixed(2);
}
