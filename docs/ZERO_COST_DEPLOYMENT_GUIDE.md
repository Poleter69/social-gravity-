# Social Gravity — Zero-Cost Production Deployment Guide

This guide walks you through deploying **Social Gravity** to production for **$0.00/month**.

---

## Deployment Option A: Cloudflare Pages (Recommended)

Cloudflare Pages provides unlimited bandwidth, instant worldwide CDN caching, free SSL certificates, and 100,000 serverless edge requests per day at zero cost.

### Prerequisites
1. A free [Cloudflare Account](https://dash.cloudflare.com/sign-up).
2. Your GitHub repository fork of `social-gravity`.

### Step-by-Step Instructions
1. Navigate to the Cloudflare Dashboard -> **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Select your `social-gravity` repository.
3. Configure the build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js Version**: In **Environment variables**, set `NODE_VERSION` to `20`.
4. (Optional) Under **Environment variables**, configure any free services:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Public Anon Key
5. Click **Save and Deploy**.
6. In approximately 60 seconds, your site is live at `https://social-gravity.pages.dev`!

---

## Deployment Option B: GitHub Pages (100% Free on GitHub)

If you do not want to register for third-party hosting, you can deploy Social Gravity entirely within GitHub for free.

### Step-by-Step Instructions
1. In your GitHub repository, go to **Settings** -> **Pages**.
2. Under **Build and deployment** -> **Source**, choose **GitHub Actions**.
3. Push any commit to `main` or manually trigger the workflow:
   - Go to **Actions** -> **Deploy to GitHub Pages (100% Free & Open)** -> **Run workflow**.
4. GitHub Actions will build and deploy the app to `https://<username>.github.io/<repo>/`.

---

## Deployment Option C: Vercel (Free Hobby Tier)

1. Sign in to [Vercel](https://vercel.com) using your GitHub account.
2. Click **Add New Project** and import `social-gravity`.
3. Vercel will automatically detect `vite` from `package.json` and `vercel.json`.
4. Click **Deploy**. Your app will be live at `https://social-gravity.vercel.app`.

---

## Database Setup: Free Supabase PostgreSQL

Supabase offers a perpetual free tier with a 500MB PostgreSQL database, built-in REST API, 50,000 monthly active users for authentication, and 1GB of file storage.

### Step-by-Step Instructions
1. Create a free account at [supabase.com](https://supabase.com).
2. Click **New Project**, select an organization, choose a strong database password, and select your nearest region.
3. Once provisioned (approx. 45 seconds), open the **SQL Editor** in the left sidebar.
4. Open the file [`db/schema.sql`](../db/schema.sql) in this repository, paste the contents into the SQL Editor, and click **Run**.
5. Run [`db/migrations/002_row_level_security.sql`](../db/migrations/002_row_level_security.sql) to enable Row Level Security.
6. (Optional) Run [`db/seeds/001_initial_seed.sql`](../db/seeds/001_initial_seed.sql) to populate benchmark data.
7. Go to **Project Settings** -> **API**:
   - Copy **Project URL** -> set as `VITE_SUPABASE_URL`.
   - Copy **anon public key** -> set as `VITE_SUPABASE_ANON_KEY`.

### Enabling GitHub OAuth for $0:
1. In Supabase Dashboard, go to **Authentication** -> **Providers** -> **GitHub**.
2. Enable GitHub and follow the instructions to create a free GitHub OAuth App in GitHub Developer Settings.
3. Paste the Client ID and Client Secret into Supabase.

---

## Free Production Health Monitoring: UptimeRobot

To ensure 99.9% uptime monitoring without paying for Pingdom or Datadog:
1. Create a free account at [uptimerobot.com](https://uptimerobot.com) (50 free monitors with 5-minute interval).
2. Click **Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Social Gravity Health Probe`
   - **URL**: `https://<your-domain>/api/health`
   - **Monitoring Interval**: `5 minutes`
3. Save. UptimeRobot will notify you immediately via email if an edge node fails.
