<script>
    import { setMaster } from '$lib/sessionMaster.js';
    import { onMount } from 'svelte';

    let masterEl;
    onMount(() => {
        // slight delay helps on some browsers before layout is ready
        setTimeout(() => masterEl?.focus({ preventScroll: true }), 0);
    });

    let master = '';
    let showing = false;

    function enterVault(e) {
        e?.preventDefault();
        const m = master.trim();
        if (!m) return;

        setMaster(m);

        // Hash navigation works on file:// and server with hash router
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
                        <form class="mx-auto" style="max-width: 520px" on:submit|preventDefault={enterVault}>
                            <label class="form-label" for="master">Master passphrase</label>
                            <div class="input-group">
                                <input
                                        id="master"
                                        class="form-control"
                                        type={showing ? 'text' : 'password'}
                                        placeholder="enter your memorized passphrase to get started"
                                        bind:value={master}
                                        bind:this={masterEl}
                                        autocomplete="current-password"
                                        autofocus
                                />
                                <button class="btn btn-outline-secondary" type="button" on:click={() => (showing = !showing)}>
                                    {showing ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <div class="form-text mb-3">
                                Your passphrase will only stay in memory for this tab until you close it or click ‘Forget’ on the next page.
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

        <!-- non-essential buttons in a separate row -->
        <div class="row">
            <div class="col-12 mt-2 text-center">
                <a class="link-secondary px-2" href="#/help">❔ Why &amp; How + Help</a>
                <a class="link-secondary px-2" href="#/settings">⚙️ Settings</a>
            </div>
        </div>
    </main>
</section>
