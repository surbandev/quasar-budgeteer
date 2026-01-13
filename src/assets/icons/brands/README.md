# Brand Icons

This directory contains custom SVG icons for brand logos.

## Adding a New Brand Icon

1. **Create the SVG file**: Save your SVG icon as `[brand-name].svg` in this directory
   - Example: `spotify.svg`, `hulu.svg`, `netflix.svg`
   - The SVG should be optimized and ideally have a viewBox of `0 0 24 24` or similar

2. **Add to the mapping**: Open `src/stores/constants.js` and add an entry to the `brandIconMap`:

   ```javascript
   const brandIconMap = {
     spotify: 'spotify.svg',
     hulu: 'hulu.svg',
     // Add your new icon here
     'your brand name': 'your-brand.svg',
   }
   ```

3. **Transaction name matching**: The system will match transaction names (case-insensitive) to brand icons. You can add multiple variations:
   ```javascript
   const brandIconMap = {
     spotify: 'spotify.svg',
     'spotify premium': 'spotify.svg', // Same icon for variations
   }
   ```

## SVG Guidelines

- **Size**: Recommended viewBox: `0 0 24 24` or `0 0 100 100`
- **Colors**: SVGs will be displayed in white by default (using CSS filter). If you want brand colors, you can modify the SVG to use `currentColor` or specific colors.
- **Optimization**: Remove unnecessary metadata, comments, and optimize paths for smaller file sizes
- **Format**: Use inline SVG paths, not embedded images

## Example SVG Structure

```svg
<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"/>
</svg>
```
