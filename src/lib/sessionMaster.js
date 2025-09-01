// src/lib/sessionMaster.js
const KEY = 'pb:master';

// Prefer per-tab sessionStorage; fall back to in-memory if unavailable.
let mem = '';
const canUseSession = (() => {
    try {
        const t = '__pb_test__';
        sessionStorage.setItem(t, '1');
        sessionStorage.removeItem(t);
        return true;
    } catch {
        return false;
    }
})();

export function setMaster(m) {
    const v = (m ?? '').trim();
    if (canUseSession) {
        try { sessionStorage.setItem(KEY, v); } catch { mem = v; }
    } else {
        mem = v;
    }
}

export function getMaster() {
    if (canUseSession) {
        try { return sessionStorage.getItem(KEY) ?? ''; } catch { return mem; }
    }
    return mem;
}

export function clearMaster() {
    if (canUseSession) {
        try { sessionStorage.removeItem(KEY); } catch {}
    }
    mem = '';
}
