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

## Development Notes

- This is a static site export, not a live WordPress installation
- All PHP functionality has been converted to static HTML
- JavaScript files are minified with version parameters
- No build process or package manager configuration present
- Site uses WordPress's standard directory structure for assets