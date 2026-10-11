# Cloudflare Pages Deployment Guide

Your application is configured as a standalone **Progressive Web App (PWA)** with offline caching, high-resolution icons, and native-feeling installation.

The production bundle is built into the `dist` directory and is only **~540 KB** (down from the 115 MB desktop installer).

---

## Method 1: Instant Deploy via Terminal (Fastest)

You can publish the app directly from your terminal using Cloudflare's Wrangler tool without setting up Git:

1. **Build the production PWA:**
   ```bash
   npm run build
   ```

2. **Deploy directly to Cloudflare Pages:**
   ```bash
   npx wrangler pages deploy dist --project-name nbo-check-writer
   ```

3. If it's your first time, Wrangler will open your browser to log in to your Cloudflare account.
4. Once deployed, Cloudflare will give you an instant live URL (e.g., `https://nbo-check-writer.pages.dev`).

---

## Method 2: Git Integration via Cloudflare Dashboard (Automatic CI/CD)

If your code is stored in GitHub or GitLab:

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) &rarr; **Workers & Pages** &rarr; **Create application** &rarr; **Pages** &rarr; **Connect to Git**.
2. Select your repository.
3. Configure the build settings:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
4. Click **Save and Deploy**.
5. Every time you push changes to your repository, Cloudflare will automatically build and deploy the latest version worldwide.

---

## Features included in this PWA

1. **Installable Desktop/Mobile App:**
   - Chrome, Edge, Safari, and Android will show an **"Install"** icon in the address bar or via the **"Install PWA"** button in the header.
   - Users can install it to their desktop or home screen with zero installer download.

2. **100% Offline Support:**
   - Precached using Service Worker (Workbox).
   - Even without an internet connection, the app will open and print cheques.

3. **Persistent Settings in the Browser:**
   - Cheque dimensions, field alignment, and printer margins are saved locally to `localStorage`.
   - Settings can be exported and imported as JSON backups directly from the **Settings** tab.

4. **Zero Pop-up Warnings:**
   - Printing uses an invisible background iframe to trigger the native browser print dialog seamlessly without pop-up blocker alerts.
