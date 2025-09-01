<svelte:head>
    <title>PassBooster — Why, How & Help</title>
</svelte:head>

<main class="container py-4">
    <h1 class="h3 mb-3">Why, How &amp; Help</h1>

    <div class="row g-3">
        <!-- Why -->
        <div class="col-12 col-lg-4">
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

        <!-- How -->
        <div class="col-12 col-lg-4">
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

        <!-- Tips -->
        <div class="col-12 col-lg-4">
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

    <!-- Optional quick links -->
    <div class="d-flex flex-wrap gap-2 mt-3">
        <a class="btn btn-primary" href="#/generate">Go to Generate</a>
        <a class="btn btn-outline-secondary" href="#/settings">Open Settings</a>
    </div>
</main>
