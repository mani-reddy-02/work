/**
 * Resolves a document URL (Supabase Storage CDN, full URL, or backend /uploads/ path)
 * to an absolute loadable URL for previews and downloads.
 */
export function resolveFileUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const backendBase = (import.meta as any).env?.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}
