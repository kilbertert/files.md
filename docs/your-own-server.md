# Run your own server

## Deploy on your own server

Prepare server (tested on Debian-based systems):
```bash
$ make init_server host=<YOUR_SSH_HOST> salt=<YOUR_SECRET_SALT>
```

Deploy a systemd service:
```bash
$ make deploy_systemd host=<YOUR_SSH_HOST>
```

## Run your own Telegram Bot
1) Install [Go](https://go.dev/doc/install)
2) Register new telegram bot via [@BotFather](https://t.me/BotFather)
3) Add `BOT_API_TOKEN=<YOUR_TELEGRAM_API_TOKEN>` line to `.env` file
4) Redeploy/relaunch the server

Bot's artifacts can be seen in `/app/storage/<USER_ID>` folder

### Additional bot's settings
1) Enable `Inline Mode` for your bot in [@BotFather](https://t.me/BotFather)
2) Press "Edit Commands", and send the following list:
```
today - 🏠 Today
files - 📄 Files
dirs - 🗂 Dirs
checklists - ☑️ Checklists
schedule - 📆 Schedule
postpone - 🦥 Postpone
rename - ✏️ Rename
move - ➡️ Move
app - 🔗 Open in app
settings - ⚙️ Settings
help - 📕 Help
```



## Transfer files to another server

1) Backup your data (`/app/storage`)
2) Be sure that all client app fully synced with the server (bring the app in the focus)
3) Stop bot on old server, so no new files would be created.
4) Compress all the files on one server: `tar -czvf storage.tar.gz storage`
5) `scp` the file to your host machine: `scp SSH_HOST:/app/storage.tar.gz .`
6) `scp` the file to your target machine

Synchronization is relying on `mtime`, so after compressing/decompressing the flag wouldn't be lost.

1) `cd /opt/files.md`
2) `tar -czvf tokens.tar.gz tokens`
3) `scp` to same dir on target machine

We don't need to transfer fslog (renames), if we're certain that all clients read the log.

1) Extract all files on new server
2) Transfer `BOT_API_TOKEN`
3) Launch server
4) Execute `localStorage.setItem('ApiHost', 'YOUR_NEW_API_HOST');` in your PWA applications
5) Make sure that all files are available
6) Cleanup the oldserver
