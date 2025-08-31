// src/lib/derive.js
import { argon2id } from 'hash-wasm';
import { formatPassword } from './format.js';

// Non-printable delimiter so labels can safely include ":" etc.
export const SALT_DELIM = '\u001F'; // Unit Separator

/**
 * Derive + format using Argon2id (hash-wasm embeds WASM; no Vite plugins needed).
 * opts:
 *  - length (chars)
 *  - symbols (string)
 *  - passes  -> argon2 "iterations" (time cost)
 *  - memoryMiB -> argon2 memory size in MiB (converted to KiB)
 *  - parallelism
 *  - hashBytes -> output K length in bytes before formatting
 */
export async function derivePassword(
    master,
    saltPieces,
    {
        length = 20,
        symbols = '@#%+=?^',
        passes = 3,
        memoryMiB = 128,
        parallelism = 1,
        hashBytes = 32
    } = {}
) {
    const enc = new TextEncoder();
    const password = enc.encode(master);
    const salt = enc.encode(Array.isArray(saltPieces) ? saltPieces.join(SALT_DELIM) : saltPieces);

    // hash-wasm expects memorySize in KiB and uses "iterations" for time cost
    const K = await argon2id({
        password,
        salt,
        parallelism,
        iterations: passes,
        memorySize: Math.max(8, memoryMiB | 0) * 1024, // KiB
        hashLength: hashBytes,
        outputType: 'binary' // Uint8Array
    });

    return formatPassword(K, length, symbols);
}
