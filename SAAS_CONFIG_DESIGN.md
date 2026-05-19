# Multi-School SaaS — Configuration Reference

> **Purpose:** This document lists every place in the codebase that is school-specific.  
> When onboarding a new school, supply values for every section below, create  
> `src/content/schools/{slug}.json`, and the product adapts automatically.

---

## 1. School Identity

| Config Key | Description | Example (Evergreen) |
|---|---|---|
| `slug` | URL-safe unique ID — used as DB key & subdomain | `evergreen` |
| `name` | Full legal school name | `Evergreen Preschool & Daycare` |
| `shortName` | Used in app titles, SMS, WhatsApp | `Evergreen` |
| `tagline` | One-line brand promise | `Nurturing Young Minds` |
| `description` | 1–2 sentence SEO description | `Quality early childhood education...` |
| `type` | School category | `preschool` / `daycare` / `k12` |

---

## 2. Contact & Location

| Config Key | Description | Example |
|---|---|---|
| `contact.phone` | Primary phone (no spaces, no +91) | `7411574504` |
| `contact.email` | Primary email | `info@evergreenpreschool.com` |
| `contact.whatsappPhone` | WhatsApp number (with country code) | `917411574504` |
| `address.full` | Full postal address | `1427, 13th Cross Rd, Ananth Nagar...` |
| `address.short` | Short display address | `13th Cross, Electronic City, Bengaluru` |
| `address.city` | City name | `Bengaluru` |
| `address.state` | State name | `Karnataka` |
| `address.pincode` | PIN/ZIP | `560100` |
| `address.mapEmbedUrl` | Google Maps embed URL | `https://maps.google.com/maps?q=...` |
| `address.googleReviewsUrl` | Google Reviews search URL | `https://google.com/search?q=...` |

### Files that use contact/location
- `src/components/Navbar.tsx` — phone & email in top bar
- `src/components/Footer.tsx` — address, phone, email
- `src/app/enquiry/page.tsx` — map embed, WhatsApp CTA
- `src/app/contact/page.tsx` — address, map embed
- `src/app/api/auth/parent-login/route.ts` — WhatsApp OTP message
- `src/app/api/admin/staff-login/route.ts` — WhatsApp OTP message

---

## 3. Branding & Theme

| Config Key | Description | Example (Evergreen) |
|---|---|---|
| `theme.primaryColor` | Main brand colour (buttons, nav) | `#178F78` |
| `theme.secondaryColor` | Accent colour (CTAs, highlights) | `#E8694A` |
| `theme.accentColor` | Tertiary colour (badges, tags) | `#F5B829` |
| `theme.darkColor` | Dark text / headers | `#1A2F4A` |
| `theme.lightBg` | Page background | `#FAF0E8` |
| `theme.fontHeading` | Google Font for headings | `Fredoka` |
| `theme.fontBody` | Google Font for body | `Quicksand` |
| `branding.logoUrl` | Public path or CDN URL to logo | `/logo.png` |
| `branding.logoWhiteUrl` | White version for dark backgrounds | `/logo-white.png` |
| `branding.faviconUrl` | Favicon | `/favicon.ico` |

### How theme is applied
`src/components/ThemeProvider.tsx` — server component injected in `layout.tsx`.  
Outputs a `<style>` block setting CSS variables:
```css
:root {
  --color-primary:   #178F78;
  --color-secondary: #E8694A;
  --color-accent:    #F5B829;
  --color-dark:      #1A2F4A;
  --color-light-bg:  #FAF0E8;
}
```
All new components use `var(--color-primary)` instead of hardcoded hex.  
Legacy inline-style components read from the school config prop.

---

## 4. Social Media

| Config Key | Example |
|---|---|
| `social.facebook` | `https://facebook.com/evergreenpreschoolbangalore` |
| `social.instagram` | `https://instagram.com/evergreenpreschoolbangalore` |
| `social.youtube` | `""` (empty = hidden) |
| `social.twitter` | `""` |

---

## 5. Hours of Operation

| Config Key | Example |
|---|---|
| `hours.weekdays` | `7:00 AM – 7:00 PM` |
| `hours.saturday` | `8:00 AM – 1:00 PM` |
| `hours.sunday` | `Closed` |

---

## 6. Hero / Homepage Copy

| Config Key | Description |
|---|---|
| `hero.heading` | Main headline | 
| `hero.subheading` | Supporting text below headline |
| `hero.ctaPrimary` | Primary button label (`Enroll Now`) |
| `hero.ctaSecondary` | Secondary button label (`Explore Programs`) |
| `hero.stats[]` | Array of `{value, label}` stat chips |

---

## 7. About / Story

| Config Key | Description |
|---|---|
| `about.heading` | Section heading (`Our Story`) |
| `about.story` | Founding paragraph |
| `about.mission` | Mission statement |
| `about.vision` | Vision statement |
| `about.values[]` | `{icon, title, description}` array |
| `about.team[]` | `{name, role, bio, initials}` array |
| `about.facilities[]` | `{title, description}` array |

---

## 8. Rating & Reviews

| Config Key | Example |
|---|---|
| `rating.score` | `4.8` |
| `rating.count` | `123` |

Reviews/testimonials data should live in the `reviews` Supabase table  
filtered by `school_id` (Phase 3). For now stored in  
`src/content/schools/{slug}.reviews.json`.

---

## 9. AI Tools — School Context

The AI prompt builder in `src/app/api/ai-tools/route.ts` injects school  
name and city so generated content feels local to the school.

| Config Key | Used in prompt |
|---|---|
| `ai.schoolContext` | `"Evergreen Preschool & Daycare, Bengaluru, India"` |
| `ai.city` | `"Bengaluru"` |
| `ai.country` | `"India"` |
| `ai.curriculumFocus` | `"Indian early childhood education"` |

Example injection (activity prompt):
```
You are an expert early childhood educator at {ai.schoolContext}.
Design a fun, hands-on classroom activity for {age} year olds…
Make it engaging for {ai.city} children.
```

---

## 10. Authentication — WhatsApp Messages & Password Pattern

### Staff Login OTP (src/app/api/admin/staff-login/route.ts)
```
🌿 *{school.shortName} — Staff Portal*

Hello {name}! Your login credentials:
📱 Phone: {phone}
🔑 Password: {school.shortName}@{last4digits}
🔗 {school.domain}/teacher-login
```

### Parent Login OTP (src/app/api/auth/parent-login/route.ts)
```
🌿 *{school.shortName} — Parent Portal*

Hello! Your OTP: {otp}
Valid for 10 minutes.
🔗 {school.domain}/parent-login
```

### Auto-Generated Password Pattern
| Config Key | Description | Example |
|---|---|---|
| `auth.passwordPrefix` | Prefix for auto-generated passwords | `Evergreen` |
| `domain` | School's web domain | `https://evergreenprepschools.com` |

Password = `{auth.passwordPrefix}@{last4digitsOfPhone}`

---

## 11. Programs

Programs are stored in `src/content/programs.json` per school (or DB in Phase 3).  
Each program: `{id, name, ageRange, duration, time, fee, description, color}`.

| Config Key | Example |
|---|---|
| `programs[].name` | `Playgroup`, `Nursery`, `Jr. KG`, `Sr. KG` |
| `programs[].ageRange` | `2–3 years` |
| `programs[].fee` | `Monthly fee display string` |

---

## 12. Feature Flags

Control which modules are active per school:

| Flag | Default | Description |
|---|---|---|
| `features.transport` | `true` | GPS transport module |
| `features.aiTools` | `true` | AI tools for teachers & parents |
| `features.feePayment` | `false` | Online Razorpay fee payment |
| `features.medicalRecords` | `false` | Medical records module |
| `features.payroll` | `false` | Staff payroll module |
| `features.ptmScheduler` | `false` | Parent-Teacher Meeting scheduler |
| `features.blog` | `false` | News/blog module |
| `features.referral` | `false` | Referral program |
| `features.gallery` | `true` | Photo gallery |
| `features.community` | `false` | Community page |

---

## 13. Domain & SEO

| Config Key | Description | Example |
|---|---|---|
| `domain` | Canonical HTTPS domain | `https://evergreenprepschools.com` |
| `seo.title` | Full page `<title>` | `Evergreen Preschool \| Electronic City, Bengaluru` |
| `seo.keywords` | Meta keywords | `preschool bengaluru, daycare electronic city...` |
| `seo.ogImage` | Open Graph image URL | `/og-image.png` |

---

## 14. Files to Create / Update for a New School

### Create
```
src/content/schools/{slug}.json        ← full config (all fields above)
public/schools/{slug}/logo.png         ← school logo
public/schools/{slug}/logo-white.png   ← white variant
public/schools/{slug}/og-image.png     ← OG social preview
```

### Environment Variable
```env
NEXT_PUBLIC_SCHOOL_SLUG=evergreen      # or set via subdomain routing
```

### Database (Phase 3)
```sql
INSERT INTO schools (slug, name, config) VALUES ('{slug}', '{name}', '{...json}');
```

---

## 15. Subdomain Routing Plan (Phase 3)

| Subdomain | School |
|---|---|
| `app.preschoolsaas.com` | Default (onboarding) |
| `evergreen.preschoolsaas.com` | Evergreen Preschool |
| `sunflower.preschoolsaas.com` | Sunflower Kids |

`src/middleware.ts` reads `req.headers.host`, extracts subdomain slug,  
sets `x-school-slug` header. Every server component and API route  
calls `getSchoolConfig(slug)` to get the right config.

---

## 16. Onboarding Checklist for New School

- [ ] School fills onboarding form → config JSON generated
- [ ] Logo + images uploaded to `/public/schools/{slug}/`
- [ ] `src/content/schools/{slug}.json` created
- [ ] DNS CNAME set: `{slug}.preschoolsaas.com → app`
- [ ] Supabase row created in `schools` table
- [ ] Groq API key configured (shared or per-school)
- [ ] WhatsApp Business number configured
- [ ] Razorpay credentials added (if `features.feePayment = true`)
- [ ] Admin account created (`/owner` portal → Staff tab)
- [ ] Test login → verify branding, colours, name everywhere

---

## 17. Configuration Schema (TypeScript)

```typescript
export interface SchoolConfig {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  domain: string;

  contact: {
    phone: string;
    email: string;
    whatsappPhone: string;
  };

  address: {
    full: string;
    short: string;
    city: string;
    state: string;
    pincode: string;
    mapEmbedUrl: string;
    googleReviewsUrl: string;
  };

  theme: {
    primaryColor: string;    // #178F78
    secondaryColor: string;  // #E8694A
    accentColor: string;     // #F5B829
    darkColor: string;       // #1A2F4A
    lightBg: string;         // #FAF0E8
    fontHeading: string;     // Fredoka
    fontBody: string;        // Quicksand
  };

  branding: {
    logoUrl: string;
    logoWhiteUrl: string;
    faviconUrl: string;
  };

  social: {
    facebook: string;
    instagram: string;
    youtube: string;
    twitter: string;
  };

  hours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };

  hero: {
    heading: string;
    subheading: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: Array<{ value: string; label: string }>;
  };

  about: {
    heading: string;
    story: string;
    mission: string;
    vision: string;
    values: Array<{ icon: string; title: string; description: string }>;
    team: Array<{ name: string; role: string; bio: string; initials: string }>;
    facilities: Array<{ title: string; description: string }>;
  };

  rating: {
    score: string;
    count: string;
  };

  ai: {
    schoolContext: string;
    city: string;
    country: string;
    curriculumFocus: string;
  };

  auth: {
    passwordPrefix: string;
  };

  faq: Array<{ q: string; a: string }>;

  features: {
    transport: boolean;
    aiTools: boolean;
    feePayment: boolean;
    medicalRecords: boolean;
    payroll: boolean;
    ptmScheduler: boolean;
    blog: boolean;
    referral: boolean;
    gallery: boolean;
    community: boolean;
  };
}
```

---

*Last updated: 2026-05-19 — covers all hardcoded references found in audit.*
