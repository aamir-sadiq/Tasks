AMIR TASK MANAGER — OFFLINE PWA

FILES
- index.html
- styles.css
- app.js
- manifest.webmanifest
- sw.js
- icons/

WHAT IT DOES
- Dashboard with Today / Overdue / Complete / In Progress
- Dynamic monthly calendar
- Tap any date to view tasks
- Add task from selected date
- Personal / Office areas
- One-Time / Daily / Weekly / Monthly recurrence
- Status and priority tracking
- Search + filters
- Six themes
- Backup / restore JSON
- Export CSV
- Offline local storage
- Installable as a PWA when served over HTTPS or localhost

IMPORTANT
For the PWA install/offline cache to work, the files must be served through a web server.
Opening index.html directly as file:// will show the app, but browser security rules block service workers.

QUICK PC TEST
1. Extract the ZIP.
2. In the extracted folder, open Command Prompt.
3. Run:
   py -m http.server 8080
   (or: python -m http.server 8080)
4. Open:
   http://localhost:8080

IPHONE
For proper iPhone Home Screen installation, host this folder on an HTTPS site.
Then:
1. Open the site in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Open the installed app once online so the offline cache is created.

DATA
Tasks are stored in browser localStorage on each device.
Use Export Backup regularly if the data is important.


AUTOMATIC PC <-> IPHONE SYNC
----------------------------
This version adds optional private synchronization using your own Supabase project.

SETUP:
1. Create a Supabase project.
2. Open SQL Editor and run SUPABASE_SETUP.sql.
3. In Authentication > Users, create one login for yourself, or enable Email authentication.
4. In Project Settings / API, copy:
   - Project URL
   - anon/public key
5. Open Amir Task Manager > Reports > Automatic Sync.
6. Paste Project URL + anon key + your email/password.
7. Press Sign In / Connect.
8. On your iPhone, install/open the same PWA and connect with the SAME account.

SYNC BEHAVIOR:
- Local-first: edits save immediately on the current device.
- Online changes push automatically after about 1 second.
- The app checks for newer cloud data every 60 seconds.
- When internet comes back, sync resumes.
- Sync Now is available manually.
- Export Backup remains recommended as an extra safety copy.
