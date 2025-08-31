<script>
    // Online/offline badge (purely informational)
    let online = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (typeof window !== 'undefined') {
        const update = () => (online = navigator.onLine);
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
    }
</script>

<svelte:head>
    <title>PassBooster — Offline deterministic password generator</title>
    <meta name="description" content="PassBooster derives strong, unique passwords locally from a master secret using Argon2id, with per-site domain normalization, labels, and rotation." />
</svelte:head>

<main class="wrap">
    <header class="hero card">
        <h1>PassBooster</h1>
        <p class="tagline">Offline, deterministic password generator (Argon2id).</p>

        <div class="cta">
            <a class="btn primary" href="#/generate">Get started</a>
            <a class="btn" href="#/settings">Settings</a>
            <a class="btn" href="#/help">Help</a>
        </div>

        <div class="status" aria-live="polite">
            <span class="dot {online ? 'ok' : 'warn'}"></span>
            {online ? 'Ready (works offline after build)' : 'Offline'}
        </div>
    </header>

    <section class="grid">
        <article class="card">
            <h2>How it works</h2>
            <ul>
                <li><strong>Input:</strong> master secret + site’s domain (eTLD+1) + optional label + version.</li>
                <li><strong>Derive:</strong> Argon2id → base64url → deterministic character placements.</li>
                <li><strong>Output:</strong> a strong, site-unique password. Nothing is stored.</li>
            </ul>
        </article>

        <article class="card">
            <h2>Why PassBooster?</h2>
            <ul>
                <li>No sync or server — runs entirely in your browser.</li>
                <li>Handles multiple accounts per site via <em>labels</em>.</li>
                <li>Easy rotation by bumping a per-account <em>version</em>.</li>
            </ul>
        </article>

        <article class="card">
            <h2>Tips</h2>
            <ul>
                <li>Use a long master secret (e.g., several random words).</li>
                <li>Turn on 2-factor auth; use passkeys where available.</li>
                <li>After building, you can open the single HTML file from <code>file://</code>.</li>
            </ul>
        </article>
    </section>
</main>

<style>
    :root {
        --bg: #0f172a;         /* slate-900 */
        --card: #111827;       /* gray-900 */
        --muted: #94a3b8;      /* slate-400 */
        --text: #e5e7eb;       /* gray-200 */
        --accent: #3b82f6;     /* blue-500 */
        --accent-2: #60a5fa;   /* blue-400 */
        --ok: #22c55e;         /* green-500 */
        --warn: #f59e0b;       /* amber-500 */
        --radius: 16px;
        --shadow: 0 8px 24px rgba(0,0,0,.35);
    }

    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
        margin: 0;
        background: radial-gradient(1200px 600px at 20% -10%, rgba(59,130,246,.15), transparent),
        radial-gradient(1000px 500px at 120% 10%, rgba(96,165,250,.12), transparent),
        var(--bg);
        color: var(--text);
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji";
        line-height: 1.5;
    }

    .wrap {
        max-width: 980px;
        margin: 0 auto;
        padding: 24px;
    }

    .hero {
        padding: 28px;
        text-align: center;
        margin-bottom: 24px;
    }
    h1 { margin: 0 0 6px; font-size: 2.25rem; letter-spacing: -0.02em; }
    .tagline { margin: 0 0 18px; color: var(--muted); }

    .cta {
        display: inline-flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
        margin-bottom: 10px;
    }

    .btn {
        display: inline-block;
        padding: 10px 14px;
        border-radius: 999px;
        background: #1f2937; /* gray-800 */
        color: var(--text);
        text-decoration: none;
        border: 1px solid #2a3443;
        transition: transform .06s ease, background .2s ease, border-color .2s ease;
        user-select: none;
    }
    .btn:hover { transform: translateY(-1px); border-color: #3b475a; }
    .btn.primary {
        background: linear-gradient(180deg, var(--accent-2), var(--accent));
        border-color: rgba(255,255,255,.15);
    }

    .status {
        margin-top: 8px;
        font-size: 0.9rem;
        color: var(--muted);
        display: inline-flex;
        align-items: center;
        gap: 8px;
        justify-content: center;
    }
    .dot {
        width: 9px; height: 9px; border-radius: 50%;
        display: inline-block; background: var(--warn);
    }
    .dot.ok { background: var(--ok); }
    .dot.warn { background: var(--warn); }

    .grid {
        display: grid;
        grid-template-columns: repeat( auto-fit, minmax(260px, 1fr) );
        gap: 16px;
    }

    .card {
        background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02));
        border: 1px solid rgba(255,255,255,.08);
        border-radius: var(--radius);
        padding: 16px 18px;
        box-shadow: var(--shadow);
    }
    h2 { margin: 6px 0 8px; font-size: 1.15rem; }
    ul { padding-left: 18px; margin: 8px 0 0; }
    code { background: rgba(255,255,255,.06); padding: 2px 6px; border-radius: 6px; }
</style>
