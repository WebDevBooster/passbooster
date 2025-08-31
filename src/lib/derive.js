import { formatPassword } from './format.js';

/**
 * TEMP KDF: PBKDF2-SHA256 (WebCrypto) so the page works now.
 * Next step: swap to Argon2id (inlined WASM) with memory-hard params.
 */
export async function derivePassword(master, salt, { length = 20, symbols = '@#%+=?^' } = {}) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(master),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    // Pick a work factor that feels ~quick on dev machines; we’ll auto-tune later.
    const iterations = 200000; // adjust if too slow/fast on your device
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt: encoder.encode(salt),
            iterations
        },
        keyMaterial,
        32 * 8
    );

    const K = new Uint8Array(derivedBits); // 32 bytes
    return formatPassword(K, length, symbols);
}
