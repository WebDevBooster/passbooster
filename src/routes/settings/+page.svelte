<script>
    import { settings, DEFAULTS } from '$lib/stores.js';
    import { argon2id } from 'hash-wasm';
    $: s = $settings;  // auto-subscribed value

    // UI state
    let tuning = false;
    let tuneMsg = '';

    // Helpers
    function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

    function resetDefaults() {
        settings.set(structuredClone(DEFAULTS));
        tuneMsg = '';
    }

    function validateSymbols() {
        if (!s.symbols || s.symbols.length < 1) {
            settings.update(v => ({ ...v, symbols: '@#%+=?^' }));
        }
    }

    // Measure Argon2id time for given params
    async function measureOnce({ passes, memoryMiB, parallelism }) {
        const enc = new TextEncoder();
        const password = crypto.getRandomValues(new Uint8Array(16));
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const t0 = performance.now();
        await argon2id({
            password,
            salt,
            iterations: passes,
            parallelism,
            memorySize: memoryMiB * 1024, // KiB
            hashLength: 16,
            outputType: 'binary'
        });
        const t1 = performance.now();
        return t1 - t0;
    }

    // Auto-tune: try memory sizes to land roughly 300–700ms (desktop),
    // backing off if the device is weaker. Keeps passes fixed at 3 initially.
    async function autoTune() {
        tuning = true;
        tuneMsg = 'Tuning…';
        try {
            const passes = 3;
            const parallelism = 1;
            const candidates = [256, 192, 128, 96, 64]; // MiB
            let pickedMem = 64;
            let pickedMs = null;

            for (const mem of candidates) {
                try {
                    const ms = await measureOnce({ passes, memoryMiB: mem, parallelism });
                    // pick first that lands within 300–1000ms
                    if (ms >= 300 && ms <= 1000) {
                        pickedMem = mem; pickedMs = Math.round(ms); break;
                    }
                    // otherwise keep the slowest acceptable so far
                    if (!pickedMs || (ms > pickedMs && ms <= 1500)) {
                        pickedMem = mem; pickedMs = Math.round(ms);
                    }
                } catch {
                    // likely memory too high for device; try lower
                    continue;
                }
            }

            // If still too fast (<300ms) at 256 MiB, bump passes to 4
            let finalPasses = passes;
            if (pickedMs !== null && pickedMs < 300 && pickedMem === 256) {
                finalPasses = 4;
                const ms2 = await measureOnce({ passes: finalPasses, memoryMiB: pickedMem, parallelism });
                pickedMs = Math.round(ms2);
            }

            settings.update(v => ({ ...v, memoryMiB: pickedMem, passes: finalPasses, parallelism }));
            tuneMsg = `Set memory to ${pickedMem} MiB, passes ${finalPasses} (~${pickedMs ?? '?'} ms).`;
        } catch (e) {
            tuneMsg = 'Auto-tune failed (WASM blocked or low memory).';
        } finally {
            tuning = false;
        }
    }
</script>

<svelte:head>
    <title>PassBooster — Settings</title>
</svelte:head>

<main class="wrap">
    <h1>Settings</h1>

    <!-- Output formatting -->
    <section class="card">
        <h2>Output</h2>
        <div class="grid">
            <label>
                <span>Length</span>
                <input type="number" min="12" max="128" bind:value={s.length}
                       on:change={() => settings.update(v => ({ ...v, length: clamp(+s.length || 20, 12, 128) }))} />
            </label>

            <label>
                <span>Symbol set</span>
                <input bind:value={s.symbols} on:change={validateSymbols} />
                <small class="muted">Used for deterministic symbol placement.</small>
            </label>
        </div>
    </section>

    <!-- Argon2id parameters -->
    <section class="card">
        <h2>Argon2id</h2>
        <div class="grid">
            <label>
                <span>Passes (iterations)</span>
                <input type="number" min="1" max="6" bind:value={s.passes}
                       on:change={() => settings.update(v => ({ ...v, passes: clamp(+s.passes || 3, 1, 6) }))} />
            </label>
            <label>
                <span>Memory (MiB)</span>
                <input type="number" min="32" max="512" step="32" bind:value={s.memoryMiB}
                       on:change={() => settings.update(v => ({ ...v, memoryMiB: clamp(+s.memoryMiB || 128, 32, 512) }))} />
            </label>
            <label>
                <span>Parallelism (lanes)</span>
                <input type="number" min="1" max="4" bind:value={s.parallelism}
                       on:change={() => settings.update(v => ({ ...v, parallelism: clamp(+s.parallelism || 1, 1, 4) }))} />
            </label>
            <label>
                <span>Raw hash bytes</span>
                <input type="number" min="16" max="64" step="1" bind:value={s.hashBytes}
                       on:change={() => settings.update(v => ({ ...v, hashBytes: clamp(+s.hashBytes || 32, 16, 64) }))} />
                <small class="muted">Before formatting (base64url + placements).</small>
            </label>
        </div>
        <div class="row gap">
            <button class="btn" disabled={tuning} on:click={autoTune}>{tuning ? 'Tuning…' : 'Auto-tune'}</button>
            <span class="muted">{tuneMsg}</span>
        </div>
    </section>

    <!-- Clipboard -->
    <section class="card">
        <h2>Clipboard</h2>
        <div class="grid">
            <label>
                <span>Auto-clear timer (seconds)</span>
                <input type="number" min="0" max="120" bind:value={s.clipboardClearSec}
                       on:change={() => settings.update(v => ({ ...v, clipboardClearSec: clamp(+s.clipboardClearSec || 20, 0, 120) }))} />
                <small class="muted">UI hint only — browsers don’t let apps clear the clipboard.</small>
            </label>
        </div>
    </section>

    <!-- Label normalization -->
    <section class="card">
        <h2>Label normalization</h2>
        <div class="toggles">
            <label><input type="checkbox" bind:checked={s.labelSteps.unicodeNFKC}
                          on:change={() => settings.update(v => ({ ...v }))} /> Unicode canonicalization (NFKC)</label>
            <label><input type="checkbox" bind:checked={s.labelSteps.trim}
                          on:change={() => settings.update(v => ({ ...v }))} /> Trim outer spaces</label>
            <label><input type="checkbox" bind:checked={s.labelSteps.collapseWhitespaceToDash}
                          on:change={() => settings.update(v => ({ ...v }))} /> Collapse internal whitespace to “-”</label>
            <label><input type="checkbox" bind:checked={s.labelSteps.toLower}
                          on:change={() => settings.update(v => ({ ...v }))} /> Lowercase (case-insensitive labels)</label>
            <label><input type="checkbox" bind:checked={s.labelSteps.restrictCharset}
                          on:change={() => settings.update(v => ({ ...v }))} /> Restrict to <code>[a-z0-9._@-]</code> (replace others with “-”)</label>
            <label><input type="checkbox" bind:checked={s.labelSteps.collapseDashes}
                          on:change={() => settings.update(v => ({ ...v }))} /> Collapse repeated “-”</label>
            <label><input type="checkbox" bind:checked={s.labelSteps.trimDashes}
                          on:change={() => settings.update(v => ({ ...v }))} /> Trim leading/trailing “-”</label>
        </div>
        <small class="muted">These defaults mirror the Generate page’s per-change preview & undo.</small>
    </section>

    <div class="row gap">
        <button class="btn" on:click={resetDefaults}>Reset to defaults</button>
        <span class="muted">Settings save automatically to this browser only.</span>
    </div>
</main>

<style>
    :root {
        --bg: #0f172a; --card: #111827; --muted: #94a3b8; --text: #e5e7eb;
        --accent: #3b82f6; --accent-2: #60a5fa; --ok: #22c55e; --warn: #f59e0b;
        --radius: 16px; --shadow: 0 8px 24px rgba(0,0,0,.35);
    }
    .wrap { max-width: 820px; margin: 0 auto; padding: 24px; color: var(--text); }
    h1 { margin: 0 0 16px; letter-spacing: -0.02em; }
    h2 { margin: 6px 0 12px; font-size: 1.1rem; }
    .card {
        background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02));
        border: 1px solid rgba(255,255,255,.08);
        border-radius: var(--radius);
        padding: 16px 18px; box-shadow: var(--shadow); margin-bottom: 16px;
    }
    .grid {
        display: grid;
        grid-template-columns: repeat( auto-fit, minmax(240px, 1fr) );
        gap: 12px;
    }
    label span { display: block; font-size: .9rem; color: var(--muted); margin-bottom: 6px; }
    input {
        width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #2a3443;
        background: #0b1220; color: var(--text); outline: none;
    }
    .row { display: flex; align-items: center; }
    .row.gap { gap: 12px; }
    .btn {
        display: inline-block; padding: 10px 14px; border-radius: 999px;
        background: #1f2937; color: var(--text); text-decoration: none; border: 1px solid #2a3443;
        transition: transform .06s ease, background .2s ease, border-color .2s ease; cursor: pointer;
    }
    .btn:hover { transform: translateY(-1px); border-color: #3b475a; }
    small.muted { display: block; color: var(--muted); margin-top: 6px; }
    .toggles { display: grid; gap: 8px; }
    .toggles label { display: flex; gap: 10px; align-items: center; }
    code { background: rgba(255,255,255,.06); padding: 1px 6px; border-radius: 6px; }
</style>
