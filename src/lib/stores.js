// src/lib/stores.js
import { writable } from 'svelte/store';
import { defaultLabelSteps } from './normalize.js';

const STORAGE_KEY = 'passbooster.settings.v1';

export const DEFAULTS = {
    // Output formatting
    length: 20,
    symbols: '@#%+=?^',

    // Argon2id parameters (LOCKED by default)
    passes: 3,
    memoryMiB: 128,
    parallelism: 1,
    hashBytes: 32,

    // Clipboard
    clipboardClearSec: 20,

    // Label normalization
    labelSteps: { ...defaultLabelSteps },

    // NEW: gates
    settingsLocked: true, // gate the whole settings page behind a big warning
    kdfLocked: true       // gate the Argon2id controls
};

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULTS };
        const parsed = JSON.parse(raw);
        return {
            ...DEFAULTS,
            ...parsed,
            labelSteps: { ...defaultLabelSteps, ...(parsed.labelSteps || {}) }
        };
    } catch {
        return { ...DEFAULTS };
    }
}

export const settings = writable(load());

settings.subscribe(val => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(val)); } catch {}
});
