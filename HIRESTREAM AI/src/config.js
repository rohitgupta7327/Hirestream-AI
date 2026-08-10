// API Configuration
let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5054';

// Ensure protocol scheme is present (prevents Vercel relative path bug)
if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}

// Remove trailing slash
export const API_URL = rawUrl.replace(/\/+$/, '');
