/**
 * Muscat Bay — NativeWind v4 / Tailwind 3 config.
 *
 * Colour values live in `src/global.css` as RGB-channel CSS variables so both
 * themes and the `/opacity` modifier work. See DESIGN_SYSTEM.md for the spec.
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
          6: withAlpha('--chart-6'),
          axis: withAlpha('--chart-axis'),
          loss: withAlpha('--chart-loss'),
          success: withAlpha('--chart-success'),
        },
      },
      borderRadius: {
        // DESIGN_SYSTEM.md §4 — cards 10.5px, inputs 7px, chips/buttons 5px.
        sm: '5px',
        md: '7px',
        lg: '10.5px',
        DEFAULT: '10.5px',
      },
      fontFamily: {
        // Inter ships to React Native as static instances (one file per weight),
        // so each weight is its own family. Named `sans-*` to avoid colliding
        // with Tailwind's `font-medium` / `font-bold` fontWeight utilities,
        // which do nothing useful for a static-instance font on iOS.
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        mono: ['GeistMono_400Regular'],
      },
      fontSize: {
        // DESIGN_SYSTEM.md §3 type scale. The fractional sizes this file used to
        // carry (12.25 / 15.75 / 24.5px) came from scaling the web's old rem
        // steps; they are now the real steps. A full move to the seven named
        // steps on DM Sans is a separate job — it needs the font package — so
        // the Inter families below stay as they are.
        xs: ['12px', { lineHeight: '16px' }], // caption
        sm: ['13px', { lineHeight: '18px' }], // label
        base: ['14px', { lineHeight: '21px' }], // body
        lg: ['16px', { lineHeight: '22px' }], // title
        xl: ['16px', { lineHeight: '22px' }], // title
        '2xl': ['24px', { lineHeight: '28px' }], // kpi
        '3xl': ['28px', { lineHeight: '34px' }], // display
      },
    },
  },
  plugins: [],
};
