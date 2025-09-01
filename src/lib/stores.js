// src/lib/stores.js
import { writable } from 'svelte/store';
import { defaultLabelSteps } from './normalize.js';

const STORAGE_KEY = 'passbooster.settings.v1';

export const DEFAULTS = {
    // Output formatting
    length: 20,                  // 12..128
    symbols: '@#%+=?^',

    // Argon2id parameters
    passes: 3,                   // "iterations" / time cost
    memoryMiB: 128,              // 64..512 (we'll cap in UI)
    parallelism: 1,              // lanes
    hashBytes: 32,               // bytes -> base material before formatting

    // Clipboard
    clipboardClearSec: 20,

    // Label normalization (global defaults)
    labelSteps: { ...defaultLabelSteps } // you can toggle steps on Settings
};

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULTS };
        const parsed = JSON.parse(raw);
        return { ...DEFAULTS, ...parsed, labelSteps: { ...defaultLabelSteps, ...(parsed.labelSteps || {}) } };
    } catch {
        return { ...DEFAULTS };
    }
}

export const settings = writable(load());

settings.subscribe((val) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    } catch {
        // ignore quota errors
    }
});
