/**
 * Muscat Bay — NativeWind v4 / Tailwind 3 config.
 *
 * Colour values live in `src/global.css` as RGB-channel CSS variables so both
 * themes and the `/opacity` modifier work. See BRAND_DESIGN.md for the spec.
 */
const withAlpha = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: withAlpha('--background'),
        foreground: withAlpha('--foreground'),
        card: {
          DEFAULT: withAlpha('--card'),
          foreground: withAlpha('--card-foreground'),
        },
        component: withAlpha('--component'),
        muted: {
          DEFAULT: withAlpha('--muted'),
          foreground: withAlpha('--muted-foreground'),
        },
        popover: {
          DEFAULT: withAlpha('--popover'),
          foreground: withAlpha('--popover-foreground'),
        },
        primary: {
          DEFAULT: withAlpha('--primary'),
          foreground: withAlpha('--primary-foreground'),
        },
        secondary: {
          DEFAULT: withAlpha('--secondary'),
          foreground: withAlpha('--secondary-foreground'),
        },
        accent: {
          DEFAULT: withAlpha('--accent'),
          foreground: withAlpha('--accent-foreground'),
        },
        destructive: {
          DEFAULT: withAlpha('--destructive'),
          foreground: withAlpha('--destructive-foreground'),
        },
        border: withAlpha('--border'),
        input: withAlpha('--input'),
        ring: withAlpha('--ring'),
        sidebar: {
          DEFAULT: withAlpha('--sidebar'),
          foreground: withAlpha('--sidebar-foreground'),
        },
        status: {
          normal: withAlpha('--status-normal'),
          warning: withAlpha('--status-warning'),
          danger: withAlpha('--status-danger'),
          info: withAlpha('--status-info'),
          stale: withAlpha('--status-stale'),
          missing: withAlpha('--status-missing'),
        },
        module: {
          water: withAlpha('--module-water'),
          electricity: withAlpha('--module-electricity'),
          stp: withAlpha('--module-stp'),
          assets: withAlpha('--module-assets'),
          contractors: withAlpha('--module-contractors'),
          hvac: withAlpha('--module-hvac'),
          pest: withAlpha('--module-pest'),
          fire: withAlpha('--module-fire'),
        },
        chart: {
          1: withAlpha('--chart-1'),
          2: withAlpha('--chart-2'),
          3: withAlpha('--chart-3'),
          4: withAlpha('--chart-4'),
          5: withAlpha('--chart-5'),
          axis: withAlpha('--chart-axis'),
          loss: withAlpha('--chart-loss'),
          success: withAlpha('--chart-success'),
        },
      },
      borderRadius: {
        // BRAND_DESIGN.md §5 — cards 10.5px, inputs 7px, chips/buttons 5px.
        sm: '5px',
        md: '7px',
        lg: '10.5px',
        DEFAULT: '10.5px',
      },
      fontFamily: {
        // Geist ships to React Native as static instances (one file per weight),
        // so each weight is its own family. Named `sans-*` to avoid colliding
        // with Tailwind's `font-medium` / `font-bold` fontWeight utilities,
        // which do nothing useful for a static-instance font on iOS.
        sans: ['Geist_400Regular'],
        'sans-medium': ['Geist_500Medium'],
        'sans-semibold': ['Geist_600SemiBold'],
        'sans-bold': ['Geist_700Bold'],
        mono: ['GeistMono_400Regular'],
      },
      fontSize: {
        // BRAND_DESIGN.md §3 type scale.
        xs: ['12.25px', { lineHeight: '20px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '21px' }],
        lg: ['15px', { lineHeight: '20px' }],
        xl: ['15.75px', { lineHeight: '24.5px' }],
        '2xl': ['24px', { lineHeight: '24px' }],
        '3xl': ['30px', { lineHeight: '32px' }],
      },
    },
  },
  plugins: [],
};
