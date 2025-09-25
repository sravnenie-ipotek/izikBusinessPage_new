# Tech Stack - Normand PLLC Website

## Core Platform & CMS

### WordPress 6.8.1
- Primary content management system
- WordPress REST API enabled (`/wp-json/` endpoints)
- Standard WordPress directory structure
- Block Editor support

## Frontend Technologies

### HTML5
- Semantic HTML structure
- Open Graph meta tags
- Twitter Cards support
- Structured data (JSON-LD)

### CSS
- **Custom CSS Architecture** - No major frameworks
- WordPress Block Theme support with CSS custom properties
- Responsive design with viewport meta tag
- Custom color palette with theme-specific variables
- Minified CSS files for performance

### JavaScript Libraries

#### Animation & Interaction
- **GSAP v3.6.0** - Professional animation library
  - Core GSAP library
  - ScrollTrigger plugin for scroll-based animations
  - ScrollToPlugin for smooth scrolling animations

- **Locomotive Scroll v4.1.3** - Smooth scrolling effects
- **ImagesLoaded v4.1.4** - Image loading detection

#### Core Libraries
- **jQuery v3.7.1** - JavaScript library
- **jQuery Migrate v3.4.1** - jQuery backwards compatibility

## WordPress Theme & Plugins

### Custom Theme
- **"Normand" Theme v2.0.1**
  - Custom-built WordPress theme
  - Located at `/wp-content/themes/normand/`
  - Minified JavaScript and CSS assets
  - Version 2.0.1 across all theme assets

### WordPress Plugins

#### Form Management
- **Gravity Forms v2.9.12**
  - Professional form builder
  - jQuery JSON support
  - Masked input functionality
  - Placeholder support
  - Advanced form validation

#### Security & Anti-Spam
- **Gravity Forms reCAPTCHA v1.8.0**
  - Google reCAPTCHA v3 integration
  - Invisible reCAPTCHA implementation
  - Site key: 6LctezwqAAAAADmTyNO19XuWwlvX02ZmNpiKhJQF

#### SEO
- **Rank Math SEO**
  - Meta tags optimization
  - Schema.org structured data
  - Social media optimization
  - XML sitemap generation
  - Rich snippets support

#### Custom Functionality
- **Normand Custom Plugin**
  - Site-specific functionality
  - Custom styles and features
  - Located at `/wp-content/plugins/normand/`

## Third-Party Services

### Content Delivery Networks (CDNs)
- **Cloudflare** (cdnjs.cloudflare.com) - GSAP library hosting
- **jsDelivr** (cdn.jsdelivr.net) - Locomotive Scroll hosting
- **unpkg** (unpkg.com) - ImagesLoaded library hosting

### External Services
- **Google reCAPTCHA v3** - Bot protection and form security
- **Gravatar** - User avatar service
- **WordPress.org** - Emoji and core assets

## Hosting & Infrastructure

### Hosting Platform
- **Pantheon** - Enterprise WordPress hosting
  - Evidence: "live-normand.pantheonsite.io" in image URLs
  - Professional hosting with staging environments

### Performance Optimization
- Minified CSS and JavaScript assets
- Async/defer script loading
- DNS prefetching for external resources
- Lazy loading support for images
- WebP image format support

## SEO & Marketing

### Search Engine Optimization
- Canonical URLs implementation
- Meta descriptions and title tags
- Open Graph protocol for social sharing
- Twitter Cards for Twitter sharing
- Schema.org structured data markup
- XML sitemap support
- RSS feeds enabled

### Analytics & Tracking
- Ready for Google Analytics integration
- Social media meta tags configured

## Security Features

### Form Security
- Google reCAPTCHA v3 protection
- Honeypot fields for spam prevention
- Form validation and sanitization
- CSRF protection via WordPress nonces

### Content Security
- WordPress security headers
- Secure avatar loading via Gravatar
- HTTPS enforcement

## Development Tools

### WordPress Core Features
- WordPress emoji support system
- WordPress DOM utilities (dom-ready, hooks, i18n, a11y)
- WordPress Block Library
- WordPress REST API

### Asset Management
- Version control for cache busting (e.g., `?ver=2.0.1`)
- Minification for all production assets
- Organized asset structure in theme directory

## Browser Support

### Modern Browser Features
- ES6+ JavaScript support
- CSS3 animations and transitions
- Responsive design for all devices
- Touch-friendly interactions

## Content Management

### WordPress Features
- Custom post types
- Categories and tags
- Media library with organized uploads
- Comment system support
- User management system

## Static Site Export
- Site has been exported as static HTML
- Maintains WordPress asset structure
- All dynamic PHP converted to static HTML
- Preserved JavaScript functionality