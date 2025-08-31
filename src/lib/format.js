/** Base64url encode bytes (no padding) */
export function base64url(bytes) {
    let str = '';
    for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
    const b64 = btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return b64;
}

/**
 * Deterministically format a password from K (bytes)
 * 1) Start with base64url(K) and take `length` chars.
 * 2) Ensure at least one upper, digit, symbol at positions derived from K.
 *    Resolve collisions by moving forward to next free slot.
 */
export function formatPassword(K, length = 20, symbols = '@#%+=?^') {
    const L = Math.max(12, Math.min(128, length));
    const base = base64url(K);
    const pool = (base + base).slice(0, Math.max(L + 10, base.length)); // extra for replacements
    let out = pool.slice(0, L).split('');

    const used = new Set();

    const place = (idx) => {
        let i = idx % L;
        for (let step = 0; step < L; step++) {
            if (!used.has(i)) { used.add(i); return i; }
            i = (i + 1) % L;
        }
        return idx % L; // fallback
    };

    // Uppercase
    const upperIdx = place(K[0] % L);
    out[upperIdx] = String.fromCharCode(65 + (K[1] % 26));

    // Digit
    const digitIdx = place(K[2] % L);
    out[digitIdx] = String.fromCharCode(48 + (K[3] % 10));

    // Symbol
    const symIdx = place(K[4] % L);
    out[symIdx] = symbols.charAt(K[5] % symbols.length);

    return out.join('');
}

/** Quick policy check for the UI badge */
export function policyCheck(pwd, { length = 20, symbols = '@#%+=?^' } = {}) {
    if (!pwd) return { ok: false, length: false, digit: false, upper: false, symbol: false };
    const hasLen = pwd.length >= length;
    const hasDigit = /\d/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasSymbol = new RegExp('[' + escapeForRegex(symbols) + ']').test(pwd);
    return { ok: hasLen && hasDigit && hasUpper && hasSymbol, length: hasLen, digit: hasDigit, upper: hasUpper, symbol: hasSymbol };
}

function escapeForRegex(s) {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
