// Validation utilities

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
  }
  return { valid: true };
}

export function isValidQuantity(qty: number): boolean {
  return qty > 0 && isFinite(qty);
}

export function isValidPrice(price: number): boolean {
  return price > 0 && isFinite(price);
}
