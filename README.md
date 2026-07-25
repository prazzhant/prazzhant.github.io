# My Daily Log — setup notes

## Files
- `index.html` — the homepage (list of entries, dark mode, grouped by month)
- `admin.html` — the page you use to publish a new entry from your phone
- `style.css`, `app.js` — shared styling and homepage logic
- `posts.json` — where entries are stored (edited automatically by `admin.html`)
- `robots.txt`, `sitemap.xml` — help Google find and index the site

## Create a GitHub personal access token
This is what lets `admin.html` publish on your behalf.
1. github.com → your profile photo → Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → Generate new token.
2. Set Resource owner to your account, and Repository access to
   "Only select repositories" → choose this repo.
3. Under Permissions → Repository permissions, set Contents to
   Read and write. Leave everything else as-is.
4. Generate it and copy the token (starts with `github_pat_`).

**Note on security:** this token lives only in your phone/browser's local
storage — it's typed into `admin.html` once and never leaves your device or
gets committed to the repo. Still, anyone who gets hold of it could push to
this one repo, so don't share it, and revoke/regenerate it from GitHub any
time if you're ever unsure.

## Set up the posting page on your phone
1. Visit `https://prazzhant.github.io/admin.html`.
2. Tap Connection settings, fill in your username, repo name, branch
   (usually `main`), and the token above. Tap Save settings.
3. Add the page to your home screen (Chrome: ⋮ menu → Add to Home screen)
   so it opens like an app.

From then on, posting is: open the app → type a heading → type the entry →
tap Publish. It commits directly to `posts.json` and the site updates
within a minute or two.

## Get Google indexing it
1. Go to Google Search Console, add your site (`https://prazzhant.github.io/`).
2. Submit `sitemap.xml` under Sitemaps.
3. Use URL Inspection → Request indexing for the homepage to nudge
   Google to crawl it right away.

## Notes
- "Archiving" is automatic: the current month's entries are shown expanded,
  older months collapse into a tab you can tap open — nothing to manage.
- Multiple posts a day work fine; each is timestamped to the minute.
- `admin.html` is excluded from search indexing and from the sitemap.
