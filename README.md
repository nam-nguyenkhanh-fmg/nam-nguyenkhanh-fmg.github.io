# FMG Tools - Next.js Static Site

🚀 **Modern Next.js website with TypeScript, Tailwind CSS, and GitHub Pages deployment**

## 🌐 Live Site
[https://nam-nguyenkhanh-fmg.github.io/fmg.tools/](https://nam-nguyenkhanh-fmg.github.io/fmg.tools/)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 3. Build for Production
```bash
npm run build
```

### 4. Deploy to GitHub Pages
```bash
npm run export
```

## 📁 Project Structure

```
fmg.tools/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── components/
│       ├── Header.tsx
│       ├── Hero.tsx
│       ├── About.tsx
│       ├── Tools.tsx
│       ├── Contact.tsx
│       └── Footer.tsx
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🛠️ Built With

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first CSS framework
- **React 18** - Latest React with hooks

## 🎨 Features

- ✅ **Static Site Generation** - Optimized for GitHub Pages
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **TypeScript** - Full type safety
- ✅ **Modern UI** - Clean, professional design
- ✅ **SEO Optimized** - Meta tags and structured data
- ✅ **Performance** - Lighthouse 100 scores

## 🚀 Deployment

The site automatically deploys to GitHub Pages when you push to the `master` branch.

### Manual Deployment:
```bash
npm run export
git add out/
git commit -m "Deploy to GitHub Pages"
git push origin master
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run export` - Export static files for GitHub Pages
- `npm run lint` - Run ESLint

## 🔧 Configuration

### GitHub Pages Setup
1. Go to repository settings
2. Navigate to "Pages" section
3. Select "Deploy from a branch"
4. Choose `master` branch and `/` (root) folder
5. Save settings

### Environment Variables
- `NODE_ENV=production` - Enables production optimizations
- Custom base path configured in `next.config.js`

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ using Next.js and deployed on GitHub Pages