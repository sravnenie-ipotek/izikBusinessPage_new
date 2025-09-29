# Design System

## Colors

### Primary Palette
- **Primary**: `#fc5a2b` (Orange)
- **Secondary**: `#f2f2f2` (Light Gray)
- **Black**: `#010101` (Near Black)
- **White**: `#fff` (White)
- **Grey**: `#ccc` (Medium Gray)

### Functional Colors
- **Text**: `#000` (Black)
- **Link**: `#fc5a2b` (Orange)
- **Link Visited**: `#ccc` (Gray)
- **Quote Citation**: `#666` (Dark Gray)
- **Highlight**: `#fff9c0` (Pale Yellow)
- **Menu Items**: `grey` (Gray)
- **Nav Toggle**: `#b3b3b3` (Light Gray)

## Typography

### Font Families
- **Primary**: `Gotham-Medium, serif`
- **Headings**: `Knockout, sans-serif` (condensed, uppercase)
- **H1**: `Knockout-Full, sans-serif`
- **Body Light**: `Gotham-Book, serif`

### Font Sizes (Responsive)
- **Base**: `14px`
- **H1**: `calc(75px + (6500vw - 24375px)/1065)`
- **H2**: `calc(65px + (5500vw - 20625px)/1065)`
- **H3**: `calc(48px + (3200vw - 12000px)/1065)`
- **H4**: `calc(28px + (1200vw - 4500px)/1065)`
- **H5**: `calc(18px + (200vw - 750px)/1065)`
- **H6**: `calc(14px + (400vw - 1500px)/1065)`

### Line Heights
- **Body**: `1.7`
- **Headings**: `1.1`

## Layout

### Content Widths
- **Static**: `45rem`
- **Dynamic**: `45rem` ’ `55rem` (1200px) ’ `67rem` (1440px)

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px
- **Desktop**: 960px
- **Large**: 1200px
- **XL**: 1440px
- **XXL**: 1920px

## Backgrounds

### Page Sections
- **Primary BG**: `#fc5a2b` (Orange)
- **Secondary BG**: `#f2f2f2` (Light Gray)
- **Dark BG**: `#010101` (Black)
- **Light BG**: `#fff` (White)

### Hero/Banner
- **Height**: 90vh (mobile) ’ 100vh (desktop) ’ 80vh (XXL)
- **Background**: Black with orange text
- **Image Treatment**: Grayscale + brightness(0.2)

## Effects

### Transitions
- **Duration**: `250ms`
- **Timing**: `cubic-bezier(0, 0.55, 0.45, 1)`
- **Hover Duration**: `700ms`

### Animations
- **GSAP**: Used for scroll animations
- **Locomotive Scroll**: Smooth scrolling
- **Image Filters**: `grayscale(1)` for testimonials/articles

## Components

### Buttons
- **Primary**: Black BG ’ Orange on hover
- **Secondary**: Light gray BG ’ Black on hover
- **Padding**: `10px 40px`
- **Text**: Uppercase, 12px

### Forms
- **Border**: `1px solid #010101`
- **Padding**: `10px 15px`
- **Focus**: No outline, color change

### Navigation
- **Mobile**: Fullscreen overlay, black BG
- **Desktop**: Vertical side menu, rotated -90deg
- **Menu Items**: Gray ’ Black on hover (with orange underline animation)
- **Current Page**: Orange text

## Visual Style

### Borders
- **Dark**: `#000`
- **Light**: `#ccc`
- **Quote**: `4px solid #000`

### Shadows
- Minimal shadows, flat design approach
- Focus states: `2px dotted #ccc`

### Images
- **Thumbnails**: Grayscale filter
- **Hero Images**: Dark overlay (grayscale + brightness 0.2)
- **Aspect Ratio**: Maintained with object-fit: cover

## Grid Systems
- **CSS Grid**: Primary layout method
- **Flexbox**: Component alignment
- **Columns**: 5-column grid for complex layouts