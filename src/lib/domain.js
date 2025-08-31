/**
 * Try to normalize to eTLD+1 offline. If `tldts` is installed, use it.
 * Otherwise, fall back to a reasonable hostname lowercase.
 */
export async function normalizeDomain(input) {
    if (!input) return '';
    let host = '';

    // Try URL parsing; if scheme missing, add http://
    try {
        const url = new URL(input.includes('://') ? input : `http://${input}`);
        host = url.hostname;
    } catch {
        host = input;
    }

    host = host.replace(/\.$/, '').toLowerCase();

    // If tldts is available, use it for eTLD+1 correctly (handles co.uk, etc.)
    try {
        const { getDomain } = await import('tldts');
        const domain = getDomain(host);
        if (domain) return domain;
    } catch {
        // no tldts installed — continue with fallback
    }

    // Fallback: return hostname as-is (not perfect for multi-part TLDs).
    return host.startsWith('www.') ? host.slice(4) : host;
}
