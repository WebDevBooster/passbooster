// Canonicalize labels and versions so minor differences don't change the salt.
// Label normalization avoids confusables & whitespace surprises.
// IMPORTANT: we strip ":" because it's our salt delimiter.

export function normalizeLabel(label, { caseSensitive = false } = {}) {
    if (!label) return '';
    let s = String(label)
        .normalize('NFKC')         // Unicode canonicalization
        .replace(/:/g, '-')        // avoid breaking "<domain>:<label>:<version>"
        .trim()
        .replace(/\s+/g, '-');     // collapse whitespace → "-"

    if (!caseSensitive) s = s.toLowerCase();

    // Keep a conservative, portable character set
    const allowed = caseSensitive ? /[^A-Za-z0-9._@-]/g : /[^a-z0-9._@-]/g;
    s = s.replace(allowed, '-');

    // Collapse multiple dashes
    s = s.replace(/-+/g, '-');

    // Avoid leading/trailing dashes
    s = s.replace(/^-+|-+$/g, '');

    return s;
}

export function normalizeVersion(v) {
    if (!v) return 'v1';
    const m = String(v).match(/(\d+)/);
    const n = m ? Math.max(1, parseInt(m[1], 10)) : 1;
    return `v${n}`;
}
