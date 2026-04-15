# 🌿 Evergreen Preschool & Daycare — Website

A modern, fast, and **self-upgrading** website for Evergreen Preschool built with Next.js 15, TypeScript, and Tailwind CSS. All site content is managed via simple JSON files — no code knowledge needed to update text, programs, photos, or contact info.

---

## 🗂️ Project Structure

```
evergreen-preschool/
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml          ← Auto-deploy on every push to main
│   │   ├── upgrade.yml         ← Weekly self-upgrade (every Monday)
│   │   ├── lighthouse.yml      ← Performance audit on every PR
│   │   └── validate-content.yml← Validates JSON CMS files on change
│   ├── dependabot.yml          ← Auto-creates dependency update PRs
│   └── pull_request_template.md
├── src/
│   ├── app/                    ← Next.js App Router pages
│   │   ├── page.tsx            ← Home page
│   │   ├── about/page.tsx      ← About page
│   │   ├── programs/page.tsx   ← Programs page
│   │   ├── gallery/page.tsx    ← Gallery with lightbox + filter
│   │   ├── contact/page.tsx    ← Contact form + map
│   │   ├── not-found.tsx       ← Custom 404 page
│   │   ├── layout.tsx          ← Root layout (Navbar + Footer)
│   │   └── globals.css         ← Global styles + design tokens
│   ├── components/
│   │   ├── Navbar.tsx          ← Sticky responsive navigation
│   │   └── Footer.tsx          ← Full footer with links
│   └── content/                ← ✏️ EDIT THESE TO UPDATE THE SITE
│       ├── site.json           ← Name, phone, hours, hero, team
│       ├── programs.json       ← All 6 programs with pricing
│       ├── gallery.json        ← Gallery photos and categories
│       └── testimonials.json   ← Parent reviews
├── .lighthouserc.json          ← Performance thresholds
├── .env.example                ← Environment variable template
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- npm 10+
- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/evergreen-preschool.git
cd evergreen-preschool
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Open .env.local and fill in your values
```

### 3. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 4. Build for production

```bash
npm run build
npm run start
```

---

## ✏️ How to Update the Website (No Code Needed)

All content lives in `src/content/`. Just edit the JSON file and push to GitHub — the site rebuilds and deploys automatically.

### Update contact info, hours, social links

Edit `src/content/site.json`:

```json
{
  "phone": "+1 (555) 123-4567",   ← Change your phone number
  "email": "hello@yourschool.com",← Change your email
  "address": "123 Main St, ...",  ← Change your address
  "hours": {
    "weekdays": "7:00 AM – 6:00 PM"
  }
}
```

### Add or edit a program

Edit `src/content/programs.json`. Each program looks like:

```json
{
  "id": "toddler",
  "title": "Toddler Program",
  "ageRange": "13 months – 2.5 years",
  "icon": "🐣",
  "color": "orange",       ← pink | orange | yellow | green | blue | teal
  "price": "$1,650/month",
  "description": "...",
  "highlights": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"]
}
```

### Add a gallery photo

Add an item to `src/content/gallery.json`:

```json
{
  "id": 10,
  "src": "https://your-image-url.com/photo.jpg",
  "alt": "Description of the photo",
  "category": "Art & Creativity",  ← Must match existing category or creates new tab
  "caption": "Fun caption text"
}
```

### Add a testimonial

Add to `src/content/testimonials.json`:

```json
{
  "id": 6,
  "name": "Parent Name",
  "child": "Parent of [Name], Age [X]",
  "avatar": "PN",      ← 2 initials shown in avatar circle
  "rating": 5,
  "text": "The review text..."
}
```

---

## 🤖 GitHub Automation

### Workflows overview

| Workflow | Trigger | What it does |
|---|---|---|
| `deploy.yml` | Push to `main` | Lint → Type-check → Build → Deploy to Vercel |
| `upgrade.yml` | Every Monday 9 AM | Updates all minor/patch deps, opens a PR |
| `lighthouse.yml` | Every PR | Runs Lighthouse audit, posts scores as comment |
| `validate-content.yml` | JSON file changes | Validates all CMS JSON files are correct |

### Setting up GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions** and add:

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Run `vercel whoami` in your project |
| `VERCEL_PROJECT_ID` | Run `vercel link` in your project |

### Setting up Vercel

```bash
npm i -g vercel
vercel login
vercel link   # follow the prompts
```

### Connecting Vercel to GitHub

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Connect your GitHub repo
3. Vercel auto-deploys on every push to `main`

### How auto-upgrade works

Every **Monday at 9 AM UTC**, the `upgrade.yml` workflow:
1. Runs `npm-check-updates` to find newer packages
2. Updates all **minor and patch** versions
3. Runs `build`, `lint`, and `type-check`
4. If they all pass → opens a Pull Request
5. If all CI checks pass → **auto-merges** the PR

For **major version updates** (e.g. Next.js 15 → 16), the workflow opens a GitHub Issue with upgrade instructions instead of auto-merging.

---

## 🔧 Development Commands

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run format       # Prettier format all files
npm run type-check   # TypeScript type check (no emit)
```

---

## 🎨 Customisation

### Change the colour scheme

Edit the `evergreen` color palette in `tailwind.config.ts`. The whole site uses `evergreen-*` tokens.

### Add a new page

1. Create `src/app/your-page/page.tsx`
2. Add it to the nav in `src/components/Navbar.tsx`
3. Add it to the footer in `src/components/Footer.tsx`

### Connect a real contact form

The contact form uses a simulated submit. To make it real:

**Option A — Formspree (easiest, free):**
1. Sign up at [formspree.io](https://formspree.io)
2. Create a form and get your endpoint
3. In `src/app/contact/page.tsx`, replace the `setTimeout` with:
```ts
const res = await fetch("https://formspree.io/f/YOUR_ID", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(form),
});
if (res.ok) setStatus("success"); else setStatus("error");
```

**Option B — Resend + API route:**
1. Create `src/app/api/contact/route.ts`
2. Use the [Resend](https://resend.com) SDK to send email

---

## 📊 Performance Targets (Lighthouse)

| Metric | Target |
|---|---|
| Performance | ≥ 80 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |

Lighthouse runs on every PR and posts scores as a comment.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Fonts | Playfair Display + Nunito (Google Fonts) |
| Deployment | Vercel |
| CI/CD | GitHub Actions |
| Auto-upgrades | npm-check-updates + Dependabot |
| Performance | Lighthouse CI |

---

## 🤝 Contributing

1. Create a branch: `git checkout -b feat/your-feature`
2. Make changes
3. Push and open a PR
4. All checks must pass (build, lint, type-check, Lighthouse)
5. Request a review

---

## 📄 License

Private — © Evergreen Preschool & Daycare. All rights reserved.
