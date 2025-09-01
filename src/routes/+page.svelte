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

<main class="container py-4">
    <!-- Hero -->
    <div class="row">
        <div class="col-12">
            <div class="card shadow-sm mb-3">
                <div class="card-body text-center">
                    <h1 class="display-5 mb-2">PassBooster</h1>
                    <p class="lead mb-3 text-muted">Offline, deterministic password generator (Argon2id).</p>

                    <div class="d-flex flex-wrap justify-content-center gap-2 mb-2">
                        <a class="btn btn-primary" href="#/generate">Get started</a>
                        <a class="btn btn-outline-secondary" href="#/settings">Settings</a>
                        <a class="btn btn-outline-secondary" href="#/help">Help</a>
                    </div>

                    <div class="mt-1">
            <span class={"badge rounded-pill " + (online ? "bg-success" : "bg-warning")}>
              {online ? 'Ready (works offline after build)' : 'Offline'}
            </span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Info cards -->
    <div class="row g-3">
        <div class="col-12 col-md-4">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h2 class="h5">How it works</h2>
                    <ul class="mb-0">
                        <li><strong>Input:</strong> master secret + eTLD+1 + optional label + version.</li>
                        <li><strong>Derive:</strong> Argon2id → base64url → deterministic placements.</li>
                        <li><strong>Output:</strong> strong, site-unique password. Nothing stored.</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="col-12 col-md-4">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h2 class="h5">Why PassBooster?</h2>
                    <ul class="mb-0">
                        <li>No sync/server — 100% local.</li>
                        <li>Multiple accounts via <em>labels</em>.</li>
                        <li>Rotation with per-account <em>version</em>.</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="col-12 col-md-4">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h2 class="h5">Tips</h2>
                    <ul class="mb-0">
                        <li>Use a long master secret.</li>
                        <li>Enable 2FA / passkeys.</li>
                        <li>The built file opens from <code>file://</code>.</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</main>
