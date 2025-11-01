# Print Scorecard Feature

## Overview
The admin print system now supports two layout options for printing scorecards:

1. **Single Layout** - One full-size scorecard per A4 page
2. **4-Up Layout** - Four compact scorecards per A4 page for efficient printing

## Features

### Single Layout (`/admin/print/scorecard`)
- Full-size scorecard optimized for A4 paper
- 15 participant rows
- Large, easy-to-read text
- Professional layout for official judging

### 4-Up Layout (`/admin/print/scorecard-4up`)
- Four scorecards per A4 page with no gaps
- Compact design with 9 participant rows per card
- Shows programme section instead of code
- No scroll bars during print
- Efficient paper usage
- Perfect for bulk printing and distribution

## Usage

1. Navigate to **Admin → Print & Judgment Center**
2. Select the evaluator name (optional)
3. Choose the programme from the dropdown
4. Click either:
   - **Print Single** - Opens single scorecard layout
   - **Print 4 Per Sheet** - Opens 4-up layout

## Technical Details

### Layout Specifications
- **Paper Size**: A4 (210mm × 297mm)
- **4-Up Grid**: 2×2 layout with no gaps
- **Individual Card Size**: 105mm × 148.5mm
- **Print Margins**: None (full bleed)
- **Section Display**: Shows programme section instead of code

### Styling Features
- Exact color matching with print-color-adjust
- Responsive design for screen preview
- Optimized font sizes for readability
- Professional header with logo section
- Structured table layout with proper column widths

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Auto-print functionality on page load

## File Structure
```
src/app/admin/print/
├── page.tsx                    # Main print configuration page
├── scorecard/
│   └── page.tsx               # Single scorecard layout
└── scorecard-4up/
    └── page.tsx               # 4-up scorecard layout
```

## Print Settings Recommendation
- **Paper Size**: A4
- **Orientation**: Portrait
- **Margins**: Minimum (or None)
- **Scale**: 100%
- **Background Graphics**: Enabled