# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static WordPress site export for Normand PLLC, a law firm specializing in class action lawsuits. The site has been exported as static HTML files with associated assets.

## Architecture

The codebase consists of:

1. **Static HTML Pages** - Pre-generated HTML files from WordPress export
   - Homepage: `index.html`
   - Practice areas in subdirectories (e.g., `/class-action/`, `/case-studies/`)
   - Legal pages: `/privacy-policy/`, `/disclaimer/`
   - Team pages: `/our-team/`

2. **WordPress Theme Assets** - Located in `wp-content/themes/normand/`
   - JavaScript files: `assets/js/` (minified, includes GSAP animations, locomotive scroll, navigation)
   - CSS files: `assets/css/` (minified global styles, content, home, comments)

3. **WordPress Plugin Assets** - Located in `wp-content/plugins/`
   - Gravity Forms plugin for contact forms
   - Custom Normand plugin

4. **Media Assets** - Located in `wp-content/uploads/`
   - Images organized by year/month folders

## Key Technologies

- Static HTML (exported from WordPress)
- Minified CSS and JavaScript assets
- GSAP for animations
- Locomotive Scroll for smooth scrolling
- Gravity Forms for contact functionality

## Development Commands

### Local Development Server (Port 7000)
```bash
# Start development server with API functions
npm run dev
# or
node server.js

# Access site at: http://localhost:7001
```

### Vercel Development (Port 7002)
```bash
# Start with Vercel CLI (requires login)
npm run dev:vercel
# or
vercel dev --listen 7002

# Access site at: http://localhost:7002
```

### Deployment
```bash
# Deploy to Vercel production
npm run deploy
# or
vercel --prod
```

## Development Notes

- **Port Requirements**: Always use ports 7000+ for local development
- **Forms**: Serverless functions handle form submissions (`/api/contact`)
- **Static Export**: Converted from WordPress, all PHP → static HTML
- **Assets**: Minified CSS/JS with version parameters for cache busting
- **API Functions**: Located in `/api/` directory for Vercel deployment

## Form Testing

- Forms work locally via `/api/contact` endpoint
- Submissions logged to console during development
- Add email provider (Resend/SendGrid) via Vercel environment variables
- update '/Users/michaelmishayev/Desktop/AizikBusinessPage/www.normandpllc.com/DOCS/bugs/adminLog.md' for admin panel bugs and solution
- '/Users/michaelmishayev/Desktop/AizikBusinessPage/www.normandpllc.com/DOCS/bugs/adminLog.md'update bugs and hpw fix it. only admin panel