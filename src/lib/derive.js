// src/lib/derive.js
import { argon2id } from 'hash-wasm';
import { formatPassword } from './format.js';

// Non-printable delimiter so labels can safely include ":" etc.
export const SALT_DELIM = '\u001F'; // Unit Separator

/**
 * Derive a deterministic password string from:
 *  master (secret), pieces = [domain, label, version], and options.
 */
export async function derivePassword(master, pieces, opts) {
    const te = new TextEncoder();
    const saltStr = pieces.join(SALT_DELIM);
    const salt = te.encode(saltStr);
    const password = te.encode(master);

    const hash = await argon2id({
        password,
        salt,
        iterations: opts.passes,
        parallelism: opts.parallelism,
        memorySize: opts.memoryMiB * 1024, // KiB
        hashLength: opts.hashBytes,
        outputType: 'binary'
    });

    // Enforce policy via deterministic formatter (no RNG).
    return formatPassword(new Uint8Array(hash), {
        length: opts.length,
        symbols: opts.symbols
    });
}
