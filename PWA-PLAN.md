# PWA Conversion Plan

## Overview
Turn the Next.js static export into a Progressive Web App for mobile use.

---

## Steps

### 1. Install `next-pwa`
```bash
npm install next-pwa
```

### 2. Create App Icons
Place icons in `public/icons/`:
- `icon-192x192.png`
- `icon-512x512.png`

Generate from any logo using [realfavicongenerator.net](https://realfavicongenerator.net) or similar.

### 3. Create Web App Manifest
Create `public/manifest.json`:
```json
{
  "name": "FMG Tools",
  "short_name": "FMG Tools",
  "description": "A collection of useful utilities and resources",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 4. Update `next.config.js`
```js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: '',
  assetPrefix: '',
};

module.exports = withPWA(nextConfig);
```

### 5. Update `src/app/layout.tsx` metadata
Add manifest and theme color to the metadata export:
```tsx
export const metadata = {
  // ...existing metadata
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FMG Tools',
  },
};
```

### 6. Build & Deploy
```bash
npm run build
```
This generates `sw.js` and workbox files in `public/`. Deploy as usual.

---

## Verification
1. Open the deployed site on mobile Chrome/Safari
2. You should see an "Add to Home Screen" / "Install App" prompt
3. The app opens in standalone mode (no browser chrome)
4. Works offline after first visit (static assets cached by service worker)
