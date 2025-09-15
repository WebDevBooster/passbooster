<script>
    import { onMount } from 'svelte';

    // ─────────────────────────────────────────────────────────────────────────────
    // WORD LISTS
    // Quick start: small built-in samples so the page runs immediately.
    // Replace with your curated lists by uncommenting the two imports below.
    // ─────────────────────────────────────────────────────────────────────────────

    // ✅ Use these imports when your files exist (one word per line, ASCII):
    // import adjRaw from '$lib/words/adjectives.txt?raw';
    // import nounRaw from '$lib/words/nouns.txt?raw';

    // function parseList(raw) {
    //   return raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    // }
    // const ADJ = parseList(adjRaw);   // expect ~500
    // const NOUN = parseList(nounRaw); // expect ~1000

    // Temporary tiny samples (remove when switching to real lists)
    const ADJ  = ['brisk','amber','quiet','noble','clever','swift','mellow','bright','lucky','calm'];
    const NOUN = ['otter','falcon','maple','planet','beacon','delta','harbor','meadow','signal','vertex'];

    // Checksum alphabet (20 consonants; add 'Y' if you prefer 21)
    const ALPH = 'BCDFGHJKLMNPQRSTVWXZ'; // length = 20

    // ─────────────────────────────────────────────────────────────────────────────
    // UI state
    // ─────────────────────────────────────────────────────────────────────────────
    let master = '';
    let showing = false;
    let out = '';                 // final stamp string
    let parts = null;             // debug: {adj, noun, num, cs, idxs}
    let seq = 0;                  // guards async order
    let inputEl;

    onMount(() => {
        setTimeout(() => inputEl?.focus({ preventScroll: true }), 0);
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────────
    const enc = new TextEncoder();
    const toU16 = (a, b) => ((a & 0xff) << 8) | (b & 0xff);    // big-endian 16-bit, 0..65535
    const pad4 = (n) => n.toString().padStart(4, '0');

    async function updateStamp() {
        const current = ++seq;
        const m = master.trim();
        if (!m) { out = ''; parts = null; return; }

        // Domain-separated, delimited input: "pb:v1:stamp" 0x00 master
        const payload = new Uint8Array(enc.encode('pb:v1:stamp').length + 1 + enc.encode(m).length);
        payload.set(enc.encode('pb:v1:stamp'), 0);
        payload[enc.encode('pb:v1:stamp').length] = 0x00;
        payload.set(enc.encode(m), enc.encode('pb:v1:stamp').length + 1);

        const buf = await crypto.subtle.digest('SHA-256', payload);
        if (current !== seq) return; // stale result

        const H = new Uint8Array(buf);
        // Draw 16-bit values from disjoint pairs
        const v0 = toU16(H[0], H[1]);   // adjective
        const v1 = toU16(H[2], H[3]);   // noun
        const v2 = toU16(H[4], H[5]);   // 4-digit number
        let   v3 = toU16(H[6], H[7]);   // checksum letters

        // Map with simple modulo (tiny bias OK)
        const adj  = ADJ.length  ? ADJ[v0 % ADJ.length]   : '(no-adj)';
        const noun = NOUN.length ? NOUN[v1 % NOUN.length] : '(no-noun)';
        const num  = v2 % 10000;

        // Two-letter checksum from ALPH (base-|ALPH| digits from v3)
        const A = ALPH.length;
        const c1 = ALPH[v3 % A]; v3 = Math.floor(v3 / A);
        const c2 = ALPH[v3 % A];

        out = `${adj}-${noun}-${pad4(num)}-${c1}${c2}`;
        parts = { adj, noun, num: pad4(num), cs: `${c1}${c2}`, idxs: { adjIdx: v0 % ADJ.length, nounIdx: v1 % NOUN.length } };
    }

    async function copyStamp() {
        if (!out) return;
        try { await navigator.clipboard.writeText(out); }
        catch { /* ignore; test page */ }
    }
</script>

<svelte:head>
    <title>PassBooster — Stamp Test</title>
</svelte:head>

<main class="container py-4">
    <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
            <div class="card shadow-sm">
                <div class="card-body">
                    <h1 class="h4 mb-3">Stamp Test</h1>

                    <label class="form-label">Master passphrase</label>
                    <div class="input-group">
                        <input
                                class="form-control"
                                type={showing ? 'text' : 'password'}
                                bind:value={master}
                                bind:this={inputEl}
                                on:input={updateStamp}
                                placeholder="Type here… (live stamp below)"
                                autocomplete="off"
                        />
                        <button class="btn btn-outline-secondary" type="button" on:click={() => (showing = !showing)}>
                            {showing ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <div class="form-text">
                        The stamp updates as you type. Use curated wordlists later by importing <code>adjectives.txt?raw</code> and <code>nouns.txt?raw</code>.
                    </div>

                    <hr class="my-3" />

                    <div>
                        <div class="text-muted mb-1">Stamp</div>
                        <div class="d-flex align-items-center gap-2">
                            <code class="fs-5">{out || '(empty)'}</code>
                            <button class="btn btn-sm btn-outline-secondary" on:click={copyStamp} disabled={!out}>Copy</button>
                        </div>
                        {#if parts}
                            <div class="mt-2 small text-muted">
                                adj: <code>{parts.adj}</code>,
                                noun: <code>{parts.noun}</code>,
                                number: <code>{parts.num}</code>,
                                checksum: <code>{parts.cs}</code>
                            </div>
                        {/if}
                    </div>

                    <div class="alert alert-info mt-3 mb-0">
                        <div class="small mb-1"><strong>How it’s made</strong></div>
                        <div class="small mb-0">
                            <code>H = SHA256("pb:v1:stamp" || 0x00 || master)</code><br />
                            adj = <code>ADJ[ U16(H[0..1]) mod |ADJ| ]</code>,
                            noun = <code>NOUN[ U16(H[2..3]) mod |NOUN| ]</code>,
                            number = <code>( U16(H[4..5]) mod 10000 )</code> (zero-padded),
                            checksum = two letters from <code>U16(H[6..7])</code> in alphabet <code>{ALPH}</code>.
                        </div>
                    </div>

                </div>
            </div>

            <div class="text-center mt-3">
                <a class="link-secondary" href="#/generate">← Back to Generate</a>
            </div>
        </div>
    </div>
</main>
