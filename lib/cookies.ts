// lib/cookies.ts

export function getDecodedUserEmailFromClient(): string | null {
  if (typeof document === 'undefined') return null; // Check if running in browser

  const cookies = document.cookie.split('; ');
  const emailCookie = cookies.find(cookie => cookie.startsWith('user_email='));

  if (!emailCookie) return null;

  const rawValue = emailCookie.split('=')[1];

  // ✅ Only decode if rawValue is defined
  return rawValue ? decodeURIComponent(rawValue) : null;
}
