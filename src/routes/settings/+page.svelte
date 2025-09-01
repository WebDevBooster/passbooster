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
