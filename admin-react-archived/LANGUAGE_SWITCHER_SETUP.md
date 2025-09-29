# Language Switcher Setup Guide

## Overview
I've created 6 different language switcher designs that follow the Normand PLLC design system. All are implemented as React components with TypeScript and CSS modules.

## Available Options

### 1. **Minimal Text Switcher** (Default - Currently Active)
- Clean text-based design: `EN / עב`
- Active language highlighted in orange (#fc5a2b)
- Most professional and minimal appearance

### 2. **Button Style Switcher**
- Toggle buttons with background highlighting
- Active state uses black background
- Hover shows orange background

### 3. **Flag Icons Switcher**
- Visual flag representations (🇺🇸 🇮🇱)
- Active flag has orange border and slight scale effect
- Good for international appeal

### 4. **Dropdown Switcher**
- Compact dropdown selector
- Styled with brand colors
- Future-proof for adding more languages

### 5. **Toggle Switch**
- Modern toggle switch design
- Orange background when Hebrew is selected
- Clear binary choice indication

### 6. **Animated Underline**
- Elegant underline animation on hover/active
- Matches navigation menu style
- Professional and refined appearance

## Files Created

### Main Component Files
- `components/LanguageSwitcher.tsx` - Main component with all 6 options
- `components/LanguageSwitcher.module.css` - Styles following design system
- `app/demo/page.tsx` - Demo page to view all options

### Demo Files
- `language-switcher-demo.html` - Standalone HTML demo (optional)

## How to View Options

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **View the demo page:**
   Navigate to: `http://localhost:3000/demo`

3. **See all 6 options in action** with explanations and features

## How to Change the Active Design

1. Open `components/LanguageSwitcher.tsx`

2. Find the bottom of the file (around line 145):
   ```typescript
   // Default export - using Option 1 (Minimal Text) as it's most professional
   const LanguageSwitcher = MinimalTextSwitcher;
   ```

3. Change to your preferred option:
   ```typescript
   // Example: To use Button Style
   const LanguageSwitcher = ButtonStyleSwitcher;

   // Example: To use Flag Icons
   const LanguageSwitcher = FlagIconsSwitcher;

   // Example: To use Dropdown
   const LanguageSwitcher = DropdownSwitcher;

   // Example: To use Toggle Switch
   const LanguageSwitcher = ToggleSwitcher;

   // Example: To use Animated Underline
   const LanguageSwitcher = AnimatedUnderlineSwitcher;
   ```

4. Save the file - the admin panel will automatically update

## Current Integration

The language switcher is currently integrated into:
- Admin panel header (top right)
- Works with the existing Hebrew translation system
- RTL support included
- All UI strings properly translated

## Design System Compliance

All switchers follow the Normand PLLC design system:
- **Colors**: Primary orange (#fc5a2b), black (#010101), grays
- **Typography**: Gotham font family, uppercase styling
- **Transitions**: 250ms cubic-bezier timing
- **Spacing**: Consistent padding and margins
- **Responsive**: Mobile-friendly breakpoints

## Accessibility Features

- Proper ARIA labels for screen readers
- Keyboard navigation support
- High contrast color combinations
- Focus states for accessibility

## Recommendation

I recommend **Option 1 (Minimal Text Switcher)** as it's:
- Most professional and clean
- Matches the site's minimal aesthetic
- Takes up minimal space
- Clearly shows current language state
- Easy to understand internationally

However, feel free to try any option that better matches your preferences!

## Next Steps

1. View the demo at `/demo` to see all options
2. Choose your preferred design
3. Update the default export in `LanguageSwitcher.tsx`
4. The admin panel will immediately use your chosen design