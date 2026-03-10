# Manual Test Checklist

## Setup
- [ ] `cp Backend/.env.example Backend/.env` and fill all required vars
- [ ] `cp Frontend/.env.example Frontend/.env` and fill Cloudinary vars
- [ ] `docker compose up -d mongo` starts MongoDB without errors
- [ ] `npm run seed` seeds 3 mapping projects with no errors
- [ ] `npm run create-admin` creates admin account
- [ ] `npm run dev` (Backend) starts on port 3000
- [ ] `npm run dev` (Frontend) starts on port 5173

---

## Public — Home
- [ ] Page loads with correct `<title>` (Antonin TACCHI — FiveM Mapping Portfolio)
- [ ] Featured project hero section displays a real project (or graceful placeholder)
- [ ] "New this week" cards display without broken images
- [ ] Category cards navigate to `/projects?type=…`
- [ ] Dark/Light toggle in header switches theme instantly and persists on refresh

---

## Public — Projects Catalog
- [ ] Project list loads with pagination
- [ ] Search input debounces (no request sent on every keystroke)
- [ ] Search results update correctly; "no results" state shown when empty
- [ ] "Clear filters" button resets search + filters
- [ ] Filter dropdowns (type, style, performance…) narrow the list
- [ ] URL params update on filter/search change (shareable link)
- [ ] Broken cover images show SVG placeholder (not a broken icon)
- [ ] ProjectCard layout: vertical on mobile (<768px), horizontal on desktop

---

## Public — Project Details
- [ ] Page `<title>` is `<project name> — Antonin TACCHI`
- [ ] OG meta tags are present (`og:title`, `og:description`, `og:image`)
- [ ] Gallery renders images and 3D viewer tab if a model is present
- [ ] Before/After slider is functional (drag handle)
- [ ] "Copy link" button copies URL to clipboard and shows toast
- [ ] Favorite (heart) button toggles and persists across page refresh (localStorage)
- [ ] View count increments only once per hour per IP+slug (anti-spam)
- [ ] Broken gallery images fall back to SVG placeholder

---

## Contact
- [ ] Form validates: name (max 80), email (valid format), message (max 2000)
- [ ] Inline field errors appear on blur with char counter
- [ ] Submit with valid data → success toast; SMTP email received if configured
- [ ] If SMTP not configured → falls back to `console.log` (no crash)

---

## Auth — Admin Login
- [ ] `/admin/login` redirects to `/admin` if already logged in
- [ ] Wrong credentials → error toast
- [ ] Correct credentials → redirected to `/admin/dashboard`
- [ ] Access token is NOT stored in localStorage/sessionStorage (in-memory only)
- [ ] On page refresh → silent `/api/auth/refresh` call restores session via httpOnly cookie
- [ ] After 15 min of inactivity → next API call auto-refreshes the token
- [ ] Logout → cookie cleared, redirected to `/admin/login`

---

## Admin — Projects
- [ ] Project list loads, paginated
- [ ] Create project: all fields save correctly; slug auto-generated
- [ ] File validation: reject files > size limit, wrong MIME type (error toast)
- [ ] Image upload → Cloudinary URL saved; 3D model upload → R2 URL saved
- [ ] Edit project: existing values pre-filled; save → success toast
- [ ] Delete project: confirmation; success toast; project removed from list
- [ ] Accessing `/admin/*` without session → redirected to `/admin/login`

---

## Admin — Statistics
- [ ] `/admin/stats` loads 4 stat widgets (Total views, Published, This month, Favorites)
- [ ] Top 5 most viewed projects listed with progress bars
- [ ] 30-day bar chart renders if data exists
- [ ] Chart tooltip shows correct values on hover

---

## Security
- [ ] `POST /api/projects` without Bearer token → `401 Unauthorized`
- [ ] `POST /api/projects` with valid token → `201 Created`
- [ ] `GET /api/projects` without token → `200 OK` (public)
- [ ] More than 100 GET requests in 15 min from same IP → `429 Too Many Requests`
- [ ] More than 10 POST requests in 15 min from same IP → `429 Too Many Requests`
- [ ] `docker-compose.yml` contains no hardcoded credentials (`grep rootpass` → empty)
- [ ] `.env` files are listed in `.gitignore` and not tracked

---

## Docker
- [ ] `docker compose up -d --build` starts all 4 services without errors
- [ ] MongoDB healthcheck passes (check `docker compose ps`)
- [ ] Backend healthcheck passes (`/api/health` returns 200)
- [ ] `seed` service exits with code 0 after seeding

---

## SEO & Accessibility
- [ ] All `<img>` tags have meaningful `alt` attributes
- [ ] `robots.txt` accessible at `/robots.txt`, disallows `/admin/`
- [ ] `sitemap.xml` accessible at `/sitemap.xml`
- [ ] Lighthouse score: Performance ≥ 80, Accessibility ≥ 90, SEO ≥ 90
- [ ] No console errors on any public page in production build
