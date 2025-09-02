// Base64url encoder (browser-safe)
export function base64url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
}

/**
 * Deterministically formats a password from hash bytes, enforcing:
 *  - exact length
 *  - ≥1 digit and no more than 2 consecutive digits
 *  - ≥1 uppercase letter
 *  - ≥1 symbol if symbols != ''
 *
 * All choices are derived from hash bytes (reproducible across devices).
 */
export function formatPassword(hashBytes, { length, symbols }) {
    // Start from a letter/digit heavy base (base64url) and size to length
    const base = base64url(hashBytes);
    let chars = base.slice(0, length).split('');
    while (chars.length < length) {
        const need = length - chars.length;
        const chunk = base.slice(0, Math.min(need, base.length)).split('');
        chars.push(...chunk);
    }

    const L = chars.length;
    const used = new Set(); // indices we’ve already forced
    const isDigit = (c) => c >= '0' && c <= '9';
    const isUpper = (c) => c >= 'A' && c <= 'Z';
    const isLower = (c) => c >= 'a' && c <= 'z';
    const hasDigit = () => chars.some(isDigit);
    const hasUpper = () => chars.some(isUpper);
    const hasSymbol = () => symbols && symbols.split('').some((s) => chars.includes(s));

    // deterministic index picker (avoids re-using slots)
    function pickIndex(seed) {
        for (let k = 0; k < L + hashBytes.length; k++) {
            const i = (hashBytes[(seed + k) % hashBytes.length] + k) % L;
            if (!used.has(i)) return i;
        }
        return 0;
    }

    // Ensure ≥1 uppercase
    if (!hasUpper()) {
        const i = pickIndex(1);
        if (isLower(chars[i])) {
            chars[i] = chars[i].toUpperCase();
        } else if (!isUpper(chars[i])) {
            const code = 65 + (hashBytes[2] % 26); // 'A'..'Z'
            chars[i] = String.fromCharCode(code);
        }
        used.add(i);
    }

    // Ensure ≥1 digit
    if (!hasDigit()) {
        const i = pickIndex(3);
        chars[i] = String.fromCharCode(48 + (hashBytes[4] % 10)); // '0'..'9'
        used.add(i);
    }

    // Ensure ≥1 symbol if symbols provided
    if (symbols && !hasSymbol()) {
        const symList = symbols.split('');
        const i = pickIndex(5);
        chars[i] = symList[hashBytes[6] % symList.length];
        used.add(i);
    }

    // Enforce: no more than 2 consecutive digits
    // If a run exceeds 2, convert the excess positions into letters deterministically.
    let run = 0;
    for (let i = 0; i < L; i++) {
        if (isDigit(chars[i])) {
            run++;
            if (run > 2) {
                const letterBase = 97 + (hashBytes[(7 + i) % hashBytes.length] % 26); // 'a'..'z'
                const makeUpper = (hashBytes[(8 + i) % hashBytes.length] & 1) === 1;
                const ch = String.fromCharCode(letterBase);
                chars[i] = makeUpper ? ch.toUpperCase() : ch;
                run = 0; // reset after breaking the run deterministically
                used.add(i);
            }
        } else {
            run = 0;
        }
    }

    return chars.join('');
}

// (Optional) If you still call policyCheck anywhere, keep this lightweight shim.
export function policyCheck(pw, { length, symbols }) {
    const digit = /[0-9]/.test(pw);
    const upper = /[A-Z]/.test(pw);
    const symbol = symbols ? new RegExp('[' + symbols.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + ']').test(pw) : true;
    const okLen = pw.length >= length;

    // no-more-than-2 consecutive digits check
    const no3digits = !/[0-9]{3,}/.test(pw);

    const ok = okLen && digit && upper && symbol && no3digits;
    return { ok, length: okLen, digit, upper, symbol, no3digits };
}
