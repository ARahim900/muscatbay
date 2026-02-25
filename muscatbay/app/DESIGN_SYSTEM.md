# Muscat Bay Design System

> Comprehensive design specifications based on [muscatbay.live](https://muscatbay.live/)

---

## 🎨 Color Palette

### Primary Palette

| Color Name | Hex | RGB | Usage |
|------------|-----|-----|-------|
| **Primary (Purple-Gray)** | `#4E4456` | `rgb(78, 68, 86)` | Header, sidebar, branding, main theme |
| **Secondary (Teal)** | `#00D2B3` | `rgb(0, 210, 179)` | CTAs, active states, highlights |

### Backgrounds

| Name | Hex | Usage |
|------|-----|-------|
| Body/Card Background | `#FFFFFF` | Cards, components |
| Main Content Area | `#F9FAFB` | Page background |
| Card Gray | `#F3F4F6` | Subtle backgrounds |
| Header/Sidebar | `#4E4456` | Navigation areas |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary Text | `#0A0A0A` | Main body text |
| Secondary Text | `#454545` | Descriptions, muted text |
| Light Text | `#F8FAFC` | Text on dark backgrounds |
| Header Text | `#F4F4F5` | Header/sidebar text |

### Functional Colors

| Role | Hex | Description |
|------|-----|-------------|
| Success | `#10B981` | Positive actions, trends up |
| Warning | `#E8A838` | Cautionary, pending states |
| Danger/Destructive | `#EF4444` | Errors, destructive actions |
| Chart Blue | `#3B7ED2` | Data visualization primary |

### Border Colors

| Name | Hex |
|------|-----|
| Default Border | `#E5E7EB` |
| Light Border | `#E5E5E5` |

### Chart Background Colors

| Color | Hex |
|-------|-----|
| Blue | `#EFF6FF` |
| Green | `#F0FDF4` |
| Yellow | `#FEFCE8` |
| Red | `#FEF2F2` |
| Purple | `#FAF5FF` |
| Cyan | `#F0FDFA` |
| Orange | `#FFF7ED` |
| Pink | `#FDF2F8` |

---

## 📐 Layout Structure

### Dimensions

| Element | Value |
|---------|-------|
| Sidebar Width (expanded) | `240px` |
| Sidebar Width (collapsed) | `80px` |
| Header Height | `60.5px` |
| Header Padding | `10.5px 14px` |
| Main Content Padding | `21px` |
| Main Content Max Width | `1180px` |

### Grid System

- **Grid Template**: 4-column layout (`274px` each)
- **Grid Gap**: `14px`

### Responsive Breakpoints

| Name | Value |
|------|-------|
| Mobile | `max-width: 640px` |
| Tablet (sm) | `min-width: 640px` |
| Desktop Small (md) | `min-width: 768px` |
| Desktop (lg) | `min-width: 1024px` |
| Desktop Large (xl) | `min-width: 1280px` |

---

## ✨ Animations & Transitions

### Standard Transition

```css
transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
```

### Properties Animated

- `color`, `background-color`, `border-color`
- `fill`, `stroke` (for SVG icons)
- `transform` (for hover effects)

---

## 🌑 Shadows

### Card Shadows

**Primary Card Shadow (larger cards):**
```css
box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1), 
            0px 4px 6px -4px rgba(0, 0, 0, 0.1);
```

**Standard Card Shadow (metric cards):**
```css
box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1), 
            0px 2px 4px -2px rgba(0, 0, 0, 0.1);
```

---

## 📝 Typography

### Font Family

```css
font-family: ui-sans-serif, system-ui, sans-serif, 
             "Apple Color Emoji", "Segoe UI Emoji", 
             "Segoe UI Symbol", "Noto Color Emoji";
```

### Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Body Text | `14px` | 400 | `21px` |
| H1 (Page Title) | `15.75px` | 700 | `24.5px` |
| H2 | `15px` | 400 | `20px` |
| H3 (Section Headers) | `15.75px` | 600 | `24.5px` |
| Button Text | `12.25px` - `14px` | 500 | - |
| Small/XS | `12.25px` | - | `20px` |

---

## 🎯 Component Styles

### Buttons

- **Border Radius**: `5px`
- **Padding**: `7px` (icon) or variable (text)
- **Font Weight**: 500
- **Transition**: All properties at `0.15s cubic-bezier(0.4, 0, 0.2, 1)`

| Variant | Background | Text |
|---------|------------|------|
| Primary | `#4E4456` | White |
| Secondary | `#00D2B3` | White |
| Destructive | `#EF4444` | White |
| Ghost | Transparent | Inherit |

### Cards

- **Background**: `#FFFFFF`
- **Border**: `1px solid #E5E7EB`
- **Border Radius**: `10.5px`
- **Shadow**: Multi-layer shadow (see above)

### Sidebar

- **Background**: `#4E4456`
- **Text**: White (`#FFFFFF`)
- **Border**: `rgba(255, 255, 255, 0.1)`
- **Active Item**: Secondary teal (`#00D2B3`)

### Icons

- **Size**: `14px` - `17.5px` (typically `w-5 h-5`)
- **Library**: Lucide React
- **Color**: Inherit from parent

---

## 🔧 CSS Variables Reference

```css
:root {
  --primary: #4E4456;
  --secondary: #00D2B3;
  --background: #F9FAFB;
  --card: #FFFFFF;
  --border: #E5E7EB;
  --radius: 10.5px;
  --transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
  --transition-duration: 0.15s;
}
```

---

## ✅ Accessibility (WCAG AA)

- **Primary on White**: Contrast 6.3:1 ✓
- **Secondary on White**: Use with dark text
- **Body Text**: Uses dark grays on white for high readability
