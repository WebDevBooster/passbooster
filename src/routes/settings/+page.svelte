<script>
    import { settings, DEFAULTS } from '$lib/stores.js';
    import { argon2id } from 'hash-wasm';

    // reactive view of the store
    let s; $: s = $settings;

    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n ?? lo));
    const set = (patch) => settings.update(v => ({ ...v, ...patch }));

    // Profile string + short fingerprint (ID)
    let profileId = '…';
    $: profileStr = `argon2id m${s.memoryMiB} t${s.passes} p${s.parallelism} h${s.hashBytes}`;
    $: (async () => {
        const enc = new TextEncoder().encode(profileStr);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
        profileId = hex.slice(0, 10).toUpperCase(); // short, readable
    })();

    function resetDefaults() {
        settings.set(structuredClone(DEFAULTS));
        tuneMsg = '';
        unlockPrompt = '';
    }

    function updateNumber(key, value, lo, hi) {
        const n = clamp(Number(value), lo, hi);
        set({ [key]: n });
    }

    function updateText(key, value, fallback = '') {
        set({ [key]: value?.toString() || fallback });
    }

    function toggleStep(step, checked) {
        set({ labelSteps: { ...s.labelSteps, [step]: !!checked } });
    }

    // ---- Auto-tune (unchanged logic) ----
    let tuning = false;
    let tuneMsg = '';

    async function measureOnce({ passes, memoryMiB, parallelism }) {
        const password = crypto.getRandomValues(new Uint8Array(16));
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const t0 = performance.now();
        await argon2id({
            password, salt,
            iterations: passes,
            parallelism,
            memorySize: memoryMiB * 1024,
            hashLength: 16,
            outputType: 'binary'
        });
        return performance.now() - t0;
    }

    async function autoTune() {
        tuning = true; tuneMsg = 'Tuning…';
        try {
            const passes = 3, parallelism = 1;
            const candidates = [256, 192, 128, 96, 64];
            let pickMem = 64, pickMs = Infinity;
            for (const mem of candidates) {
                try {
                    const ms = await measureOnce({ passes, memoryMiB: mem, parallelism });
                    if (ms >= 300 && ms <= 1000) { pickMem = mem; pickMs = ms; break; }
                    if (ms < pickMs) { pickMem = mem; pickMs = ms; }
                } catch { /* too much mem for this device */ }
            }
            let finalPasses = passes;
            if (pickMem === 256 && pickMs < 300) {
                finalPasses = 4;
                pickMs = await measureOnce({ passes: finalPasses, memoryMiB: pickMem, parallelism });
            }
            set({ memoryMiB: pickMem, passes: finalPasses, parallelism });
            tuneMsg = `Set memory to ${pickMem} MiB, passes ${finalPasses} (~${Math.round(pickMs)} ms).`;
        } catch {
            tuneMsg = 'Auto-tune failed (WASM blocked or low memory).';
        } finally {
            tuning = false;
        }
    }

    // ---- KDF unlock flow ----
    let ack = false;        // big warning checkbox
    let unlockShown = false;
    let unlockPrompt = '';  // user must type the Profile ID to unlock
    function lockKdf() { set({ kdfLocked: true }); unlockShown = false; unlockPrompt = ''; }
    function requestUnlock() { unlockShown = true; unlockPrompt = ''; }
    function confirmUnlock() {
        if (unlockPrompt.trim().toUpperCase() === profileId) {
            set({ kdfLocked: false });
            unlockShown = false;
            unlockPrompt = '';
        }
    }
</script>

<svelte:head>
    <title>PassBooster — Settings</title>
</svelte:head>

<main class="container py-4">
    <h1 class="h3 mb-3">Settings</h1>

    {#if s.settingsLocked}
        <!-- Big warning gate -->
        <div class="card shadow-sm">
            <div class="card-body">
                <h2 class="h5 text-danger">Warning</h2>
                <div class="alert alert-danger">
                    <strong>Changing settings can change your passwords.</strong><br />
                    The Argon2id parameters (time, memory, lanes, hash length) are inputs to the key derivation.
                    If they change, the generated passwords change — even for the same domain/label/version.
                </div>
                <div class="mb-2">Proceed only if you understand the impact.</div>
                <div class="form-check mb-3">
                    <input class="form-check-input" id="ack" type="checkbox" bind:checked={ack} />
                    <label class="form-check-label" for="ack">I understand that changes may alter my derived passwords.</label>
                </div>
                <button class="btn btn-danger" disabled={!ack} on:click={() => set({ settingsLocked: false })}>
                    Show settings
                </button>
                <a class="btn btn-outline-secondary ms-2" href="#/">Cancel</a>
            </div>
        </div>
    {:else}
        <!-- Settings content -->
        <!-- Profile banner -->
        <div class="card shadow-sm mb-3">
            <div class="card-body d-flex flex-wrap gap-2 align-items-center justify-content-between">
                <div class="h5 mb-0">KDF profile</div>
                <div class="text-muted">
                    <span class="badge text-bg-light">{profileStr}</span>
                    <span class="badge text-bg-secondary">ID {profileId}</span>
                </div>
                <div class="ms-auto">
                    {#if s.kdfLocked}
                        <button class="btn btn-outline-danger" on:click={requestUnlock}>Unlock Argon2id controls</button>
                    {:else}
                        <button class="btn btn-outline-secondary" on:click={lockKdf}>Lock Argon2id controls</button>
                    {/if}
                </div>
            </div>
            {#if unlockShown && s.kdfLocked}
                <div class="card-body border-top">
                    <div class="alert alert-warning mb-3">
                        To unlock, type the current profile ID <strong>{profileId}</strong> and confirm.
                    </div>
                    <div class="row g-2 align-items-end">
                        <div class="col-12 col-md-6">
                            <label class="form-label">Profile ID</label>
                            <input class="form-control" bind:value={unlockPrompt} placeholder="e.g. {profileId}" />
                        </div>
                        <div class="col-auto">
                            <button class="btn btn-danger" on:click={confirmUnlock} disabled={unlockPrompt.trim().toUpperCase() !== profileId}>Unlock</button>
                        </div>
                        <div class="col-auto">
                            <button class="btn btn-outline-secondary" on:click={() => { unlockShown = false; unlockPrompt=''; }}>Cancel</button>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Output -->
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <h2 class="h5">Output</h2>
                <div class="row g-3">
                    <div class="col-12 col-md-3">
                        <label class="form-label">Length</label>
                        <input
                                type="number"
                                class="form-control"
                                value={s.length}
                                min="12" max="128"
                                on:input={(e) => updateNumber('length', e.currentTarget.value, 12, 128)}
                        />
                        <div class="form-text">12–128 characters.</div>
                    </div>

                    <div class="col-12 col-md-9">
                        <label class="form-label">Symbol set</label>
                        <input
                                class="form-control"
                                value={s.symbols}
                                on:input={(e) => updateText('symbols', e.currentTarget.value, '@#%+=?^')}
                        />
                        <div class="form-text">Used for deterministic symbol placement.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Argon2id -->
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <h2 class="h5">Argon2id</h2>
                <div class="row g-3">
                    <div class="col-6 col-md-3">
                        <label class="form-label">Passes (iterations)</label>
                        <input
                                type="number"
                                class="form-control"
                                value={s.passes}
                                min="1" max="6"
                                disabled={s.kdfLocked}
                                on:input={(e) => updateNumber('passes', e.currentTarget.value, 1, 6)}
                        />
                    </div>

                    <div class="col-6 col-md-3">
                        <label class="form-label">Memory (MiB)</label>
                        <input
                                type="number"
                                class="form-control"
                                value={s.memoryMiB}
                                min="32" max="512" step="32"
                                disabled={s.kdfLocked}
                                on:input={(e) => updateNumber('memoryMiB', e.currentTarget.value, 32, 512)}
                        />
                    </div>

                    <div class="col-6 col-md-3">
                        <label class="form-label">Parallelism (lanes)</label>
                        <input
                                type="number"
                                class="form-control"
                                value={s.parallelism}
                                min="1" max="4"
                                disabled={s.kdfLocked}
                                on:input={(e) => updateNumber('parallelism', e.currentTarget.value, 1, 4)}
                        />
                    </div>

                    <div class="col-6 col-md-3">
                        <label class="form-label">Raw hash bytes</label>
                        <input
                                type="number"
                                class="form-control"
                                value={s.hashBytes}
                                min="16" max="64"
                                disabled={s.kdfLocked}
                                on:input={(e) => updateNumber('hashBytes', e.currentTarget.value, 16, 64)}
                        />
                        <div class="form-text">Material before formatting.</div>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2 mt-3">
                    <button class="btn btn-outline-secondary" disabled={tuning || s.kdfLocked} on:click={autoTune}>
                        {tuning ? 'Tuning…' : 'Auto-tune'}
                    </button>
                    <div class="text-muted" aria-live="polite">{tuneMsg}</div>
                </div>
            </div>
        </div>

        <!-- Clipboard -->
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <h2 class="h5">Clipboard</h2>
                <div class="row g-3">
                    <div class="col-12 col-md-4">
                        <label class="form-label">Auto-clear timer (seconds)</label>
                        <input
                                type="number"
                                class="form-control"
                                value={s.clipboardClearSec}
                                min="0" max="120"
                                on:input={(e) => updateNumber('clipboardClearSec', e.currentTarget.value, 0, 120)}
                        />
                        <div class="form-text">UI reminder only; browsers can’t force-clear the clipboard.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Label normalization -->
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <h2 class="h5">Label normalization</h2>

                <div class="row row-cols-1 row-cols-md-2 g-2">
                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="nfkc" type="checkbox"
                                   checked={s.labelSteps.unicodeNFKC}
                                   on:change={(e) => toggleStep('unicodeNFKC', e.currentTarget.checked)} />
                            <label class="form-check-label" for="nfkc">Unicode canonicalization (NFKC)</label>
                        </div>
                    </div>

                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="trim" type="checkbox"
                                   checked={s.labelSteps.trim}
                                   on:change={(e) => toggleStep('trim', e.currentTarget.checked)} />
                            <label class="form-check-label" for="trim">Trim outer spaces</label>
                        </div>
                    </div>

                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="collapseSpace" type="checkbox"
                                   checked={s.labelSteps.collapseWhitespaceToDash}
                                   on:change={(e) => toggleStep('collapseWhitespaceToDash', e.currentTarget.checked)} />
                            <label class="form-check-label" for="collapseSpace">Collapse internal whitespace to “-”</label>
                        </div>
                    </div>

                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="lower" type="checkbox"
                                   checked={s.labelSteps.toLower}
                                   on:change={(e) => toggleStep('toLower', e.currentTarget.checked)} />
                            <label class="form-check-label" for="lower">Lowercase (case-insensitive labels)</label>
                        </div>
                    </div>

                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="restrict" type="checkbox"
                                   checked={s.labelSteps.restrictCharset}
                                   on:change={(e) => toggleStep('restrictCharset', e.currentTarget.checked)} />
                            <label class="form-check-label" for="restrict">
                                Restrict to <code>[a-z0-9._@-]</code> (replace others with “-”)
                            </label>
                        </div>
                    </div>

                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="collapseDash" type="checkbox"
                                   checked={s.labelSteps.collapseDashes}
                                   on:change={(e) => toggleStep('collapseDashes', e.currentTarget.checked)} />
                            <label class="form-check-label" for="collapseDash">Collapse repeated “-”</label>
                        </div>
                    </div>

                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="trimDash" type="checkbox"
                                   checked={s.labelSteps.trimDashes}
                                   on:change={(e) => toggleStep('trimDashes', e.currentTarget.checked)} />
                            <label class="form-check-label" for="trimDash">Trim leading/trailing “-”</label>
                        </div>
                    </div>
                </div>

                <div class="text-muted mt-2">These defaults mirror the Generate page’s preview & undo.</div>
            </div>
        </div>

        <!-- Footer actions -->
        <div class="d-flex align-items-center gap-2">
            <button class="btn btn-outline-secondary" on:click={resetDefaults}>Reset to defaults</button>
            <div class="text-muted">Settings save automatically to this browser only.</div>
        </div>
    {/if}
</main>
