import { writable } from 'svelte/store';

// Ephemeral (in-memory) session state.
// Resets on page reload — by design.
export const session = writable({ master: '' });

export function setMaster(master) {
    session.set({ master: master ?? '' });
}

export function clearMaster() {
    session.set({ master: '' });
}
