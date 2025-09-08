<svelte:head>
    <title>PassBooster — Why, How & Help</title>
</svelte:head>

<main class="container py-4">
    <div class="row">
        <div class="col-sm-12 offset-sm-0 col-md-10 offset-md-1 col-lg-8 offset-lg-2">
            <h1 class="h3 mb-3">Why, How &amp; Help</h1>

            <div class="row g-3">
                <!-- Why -->
                <div class="col-12">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body">
                            <h2 class="h5">Why PassBooster?</h2>
                            <ul class="mb-0">
                                <li>No sync/server = no worries. 100% local ⇒ safer than any online password manager.</li>
                                <li>Just ONE master passphrase. <strong>No need to save or remember any other passwords.</strong> <br>
                                    Just enter a website's domain (+ optional username) and this tool will always reliably <strong>recreate</strong> your password for that website. A <strong>strong password</strong>.
                                </li>
                                <li>Any number of accounts for a website via <em>labels</em>.</li>
                                <li>Easily change/rotate a password for any account with <em>version</em>.</li>
                                <li><strong>Safety:</strong> Because none of your passwords are ever saved anywhere and don't require any browser extensions to access, this is much safer than any password manager. Your master passphrase sits in the <em>memory</em> of the browser tab and disappears as soon as you close it.
                                </li>
                                <li><strong>Simplicity:</strong> Just a single self-contained HTML file that can open in your favorite browser from any USB drive and runs without any internet connection.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- How -->
                <div class="col-12">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body">
                            <h2 class="h5">How it works</h2>
                            <ul class="mb-0">
                                <li><strong>Input:</strong> Your master secret + salt are fed to <a href="https://en.wikipedia.org/wiki/Argon2" target="_blank">Argon2id</a>. <br>
                                    Salt is just a combo of eTLD+1 + optional label/username + version.</li>
                                <li><strong>Auto-clean:</strong> Accidental uppercase characters or spaces etc. in the username/label input are automatically cleaned to prevent any mishaps.</li>
                                <li><strong>Derive:</strong> Argon2id → base64url → deterministic placements of uppercase characters, numbers and symbols (to make sure every website is happy with your password).</li>
                                <li><strong>Output:</strong> Strong, site-unique password. Nothing stored.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Tips -->
                <div class="col-12">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body">
                            <h2 class="h5">Tips</h2>
                            <ul class="mb-0">
                                <li>Use a long master secret.</li>
                                <li>Enable 2FA or ideally use passkeys for passwordless authentication.
                                </li>
                                <li>The built file opens from <code>file://</code>.</li>
                                <li>Save the <a href="#/card">Algo Card</a> as PDF. That gives you the power to recreate this tool in any programming language. And it will produce the exact same output with your input.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div class="d-flex flex-wrap gap-2 mt-3">
                <a class="btn btn-primary" href="#/generate">Go to Generate</a>
                <a class="btn btn-outline-secondary" href="#/settings">Open Settings</a>
            </div>
        </div>
    </div>
</main>
