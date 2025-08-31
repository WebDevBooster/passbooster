import { formatPassword } from './format.js';

// Use a non-printable delimiter so labels can safely include ":" etc.
export const SALT_DELIM = '\u001F'; // Unit Separator (US)

/**
 * TEMP KDF: PBKDF2-SHA256 (placeholder).
 * Next step: swap to Argon2id with inlined WASM.
 */
export async function derivePassword(master, saltPieces, { length = 20, symbols = '@#%+=?^' } = {}) {
    const encoder = new TextEncoder();

    const salt = typeof saltPieces === 'string'
        ? saltPieces
        : saltPieces.join(SALT_DELIM);

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(master),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const iterations = 200000;
    const derivedBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations },
        keyMaterial,
        32 * 8
    );

    const K = new Uint8Array(derivedBits);
    return formatPassword(K, length, symbols);
}
