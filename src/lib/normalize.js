// Normalization steps are explicit and reversible via toggles.
// We DO NOT strip ":" anymore; the salt uses a safe delimiter (see derive.js).

export const defaultLabelSteps = {
    unicodeNFKC: true,            // Canonicalize Unicode
    trim: true,                   // Trim outer whitespace
    collapseWhitespaceToDash: true, // Internal whitespace → "-"
    toLower: true,                // Case-insensitive by default
    restrictCharset: true,        // Only keep [a-z0-9._@-] (or caseful variant)
    collapseDashes: true,         // "--" → "-"
    trimDashes: true              // Remove leading/trailing "-"
};

/**
 * Normalize a label with detailed change reporting so the UI
 * can show "Changed label to" and per-change Undo.
 *
 * @param {string} label
 * @param {object} steps - which steps are active (see defaultLabelSteps)
 * @returns {{ output: string, changes: Array<{key:string,title:string,detail:string,before:string,after:string}> }}
 */
export function normalizeLabelDetailed(label, steps = defaultLabelSteps) {
    let current = String(label ?? '');
    const changes = [];

    function applyStep(key, title, fnDetail) {
        if (!steps[key]) return;
        const before = current;
        const after = fnDetail(before);
        if (after !== before) {
            const detail = describeDiff(key, before, after);
            changes.push({ key, title, detail, before, after });
            current = after;
        }
    }

    applyStep('unicodeNFKC', 'Unicode canonicalization (NFKC)', (s) => s.normalize('NFKC'));

    applyStep('trim', 'Trim spaces', (s) => s.trim());

    applyStep('collapseWhitespaceToDash', 'Collapse whitespace to "-"', (s) => s.replace(/\s+/g, '-'));

    applyStep('toLower', 'Lowercase', (s) => s.toLowerCase());

    applyStep('restrictCharset', 'Replace disallowed chars with "-"', (s) => {
        const caseSensitive = !steps.toLower;
        const allowed = caseSensitive ? /[^A-Za-z0-9._@-]/g : /[^a-z0-9._@-]/g;
        return s.replace(allowed, '-');
    });

    applyStep('collapseDashes', 'Collapse repeated "-"', (s) => s.replace(/-+/g, '-'));

    applyStep('trimDashes', 'Trim leading/trailing "-"', (s) => s.replace(/^-+|-+$/g, ''));

    return { output: current, changes };
}

function describeDiff(key, before, after) {
    switch (key) {
        case 'unicodeNFKC': {
            return 'Canonicalized Unicode (NFKC).';
        }
        case 'trim': {
            const lead = before.match(/^\s+/)?.[0]?.length ?? 0;
            const trail = before.match(/\s+$/)?.[0]?.length ?? 0;
            if (lead || trail) return `Removed ${lead} leading and ${trail} trailing space(s).`;
            return 'Trimmed spaces.';
        }
        case 'collapseWhitespaceToDash': {
            const matches = before.match(/\s+/g)?.length ?? 0;
            return matches ? `Replaced ${matches} whitespace run(s) with "-".` : 'No internal spaces found.';
        }
        case 'toLower': {
            const changed = countCaseChanges(before);
            return changed ? `Lowercased ${changed} letter(s).` : 'Already lowercase.';
        }
        case 'restrictCharset': {
            const caseSensitive = /[A-Z]/.test(before) && before !== before.toLowerCase();
            const regex = caseSensitive ? /[^A-Za-z0-9._@-]/g : /[^a-z0-9._@-]/g;
            const hits = before.match(regex)?.length ?? 0;
            return hits ? `Replaced ${hits} disallowed character(s) with "-".` : 'All characters allowed.';
        }
        case 'collapseDashes': {
            const hits = before.match(/-+/g)?.filter(x => x.length > 1).length ?? 0;
            return hits ? `Collapsed ${hits} run(s) of "-"` : 'No duplicate "-" runs.';
        }
        case 'trimDashes': {
            const lead = /^-+/.test(before);
            const trail = /-+$/.test(before);
            if (lead || trail) return `Removed ${lead ? 'leading' : ''}${lead && trail ? ' and ' : ''}${trail ? 'trailing' : ''} "-".`;
            return 'No leading/trailing "-".';
        }
        default: return 'Changed.';
    }
}

function countCaseChanges(s) {
    let c = 0;
    for (const ch of s) {
        if (/[A-Z]/.test(ch)) c++;
    }
    return c;
}

/** Keep the same version normalizer as before */
export function normalizeVersion(v) {
    if (!v) return 'v1';
    const m = String(v).match(/(\d+)/);
    const n = m ? Math.max(1, parseInt(m[1], 10)) : 1;
    return `v${n}`;
}
