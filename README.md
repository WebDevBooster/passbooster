# PassBooster

### DOWNLOAD
You can download a compiled ready-to-use HTML file in [releases](https://github.com/WebDevBooster/passbooster/releases/) or try it on this [online playground](https://webdevbooster.github.io/passbooster/).

--- 

Deterministic offline password generator (better than any online password manager). Ships as a single self-contained HTML file that you can safely run on a USB drive. Creates safe passwords for any number of usernames on a website (Argon2id + domain/label/version). No need to remember or save any passwords. It reliably and safely recreates them.

Based on just **ONE** memorized secret master passphrase, PassBooster derives strong, unique passwords entirely offline for any number of usernames on a website. 

The target site (eTLD+1) + username are used as *salt* and combined with the master passphrase **Argon2id** generates a strong password.

And if passwords on a given website are ever compromised, you can just increase the version number in the salt (known as "rotation") to derive/create a completely unique new password. 

This SvelteKit project is designed to create a single portable index.html file that runs offline and can be copied to a USB drive or any device. That's all you need to safely re-create the password for any website based on that website's domain and the username you have there. One secret master passphrase is the only thing you ever need to remember. 

You can also print out (or save as a PDF) an "Algorithm card". That puts all algorithm parameters into a tidy one-page cheat-sheet. So, if needed, you can always rebuild this deterministic password generator from scratch (with any programming language) and be sure that it will always generate the exact same passwords based on the same input.

Therefore, with this little tool, you never need to use any online password managers (which can be attacked and compromised). And you never even need to save any passwords on your local device. 
