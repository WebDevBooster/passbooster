<script>
    import { setMaster } from '$lib/session.js';

    let online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (typeof window !== 'undefined') {
        const update = () => (online = navigator.onLine);
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
    }

    let master = '';
    let showing = false;

    function enterVault(e) {
        e?.preventDefault();
        const m = master.trim();
        if (!m) return;
        // Works on file:// and http(s) with hash routing
        window.location.hash = '/generate';
    }
</script>


<svelte:head>
    <title>PassBooster — Offline deterministic password generator</title>
    <meta name="description" content="PassBooster derives strong, unique passwords locally from a master secret using Argon2id." />
</svelte:head>

<section class="min-vh-100 d-flex align-items-center justify-content-center">
    <main class="container py-4">
        <div class="row">
            <div class="col-12">
                <div class="card shadow-sm mb-3">
                    <div class="card-body text-center">
                        <h1 class="mb-1">PassBooster</h1>
                        <p class="lead text-muted mb-4">Offline, deterministic password generator (Argon2id).</p>

                        <!-- Master passphrase -->
                        <form class="mx-auto" style="max-width: 520px" on:submit={enterVault}>
                            <label for="master" class="form-label">Master passphrase</label>
                            <div class="input-group">
                                <input
                                        id="master"
                                        class="form-control"
                                        type={showing ? 'text' : 'password'}
                                        placeholder="enter your memorized passphrase to get started"
                                        bind:value={master}
                                        autocomplete="current-password"
                                />
                                <button class="btn btn-outline-secondary" type="button" on:click={() => (showing = !showing)}>
                                    {showing ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <div class="form-text mb-3">
                                Your passphrase only stays in device memory until page reload. That's by design.
                            </div>

                            <div class="d-flex flex-wrap justify-content-center gap-2">
                                <button class="btn btn-primary" type="submit" disabled={!master.trim()}>
                                    Get started
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12 mb-3 text-center">
                <a class="btn btn-outline-secondary" href="#/help">Why, How &amp; Help</a>
                <a class="btn btn-outline-secondary" href="#/settings">Settings</a>
            </div>
            <div class="col-12 text-center">
            <span class={"badge rounded-pill " + (online ? "bg-success" : "bg-warning")}>
              {online ? 'Ready (works offline after build)' : 'Offline'}
            </span>
            </div>
        </div>
    </main>
</section>
