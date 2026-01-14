import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Muscat Bay Brand Colors
                brand: {
                    primary: '#4E4456', // Deep Purple - Sidebar background and Headings
                    accent: '#81D8D0',  // Tiffany Blue - Active links, Highlights, and Buttons
                },
                // Semantic Colors
                semantic: {
                    info: '#3B82F6',    // Water
                    warning: '#F59E0B', // Electricity
                    success: '#10B981', // STP
                },
                primary: {
                    DEFAULT: '#4E4456', // Brand Purple-Gray
                    foreground: '#FFFFFF',
                },
                secondary: {
                    DEFAULT: '#81D8D0', // Tiffany Blue (Brand Accent)
                    foreground: '#FFFFFF',
                },
                success: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444',
                background: '#F9FAFB', // Main content area
                card: '#FFFFFF',
                'card-gray': '#F3F4F6',
                sidebar: '#4E4456',
                text: {
                    primary: '#0A0A0A',
                    secondary: '#454545',
                    light: '#F8FAFC',
                    header: '#F4F4F5',
                },
                border: {
                    DEFAULT: '#E5E7EB',
                    light: '#E5E5E5',
                },
                chart: {
                    blue: '#3B7ED2',
                    bg: {
                        blue: '#EFF6FF',
                        green: '#F0FDF4',
                        yellow: '#FEFCE8',
                        red: '#FEF2F2',
                        purple: '#FAF5FF',
                        cyan: '#F0FDFA',
                        orange: '#FFF7ED',
                        pink: '#FDF2F8',
                    }
                }
            },
            boxShadow: {
                'card-primary': '0px 12px 18px -3px rgba(0, 0, 0, 0.15), 0px 6px 8px -4px rgba(0, 0, 0, 0.12)',
                'card-standard': '0px 6px 10px -1px rgba(0, 0, 0, 0.12), 0px 3px 6px -2px rgba(0, 0, 0, 0.1)',
            },
            fontFamily: {
                sans: [
                    'ui-sans-serif',
                    'system-ui',
                    'sans-serif',
                    '"Apple Color Emoji"',
                    '"Segoe UI Emoji"',
                    '"Segoe UI Symbol"',
                    '"Noto Color Emoji"',
                ],
            },
            fontSize: {
                'xs': ['12.25px', { lineHeight: '20px' }],
                'sm': ['14px', { lineHeight: '21px' }],
                'base': ['14px', { lineHeight: '21px' }],
                'lg': ['15px', { lineHeight: '20px' }],
                'xl': ['15.75px', { lineHeight: '24.5px' }],
            },
            lineHeight: {
                'tight': '20px',
                'normal': '21px',
                'relaxed': '24.5px',
            },
            borderRadius: {
                'DEFAULT': '10.5px',
                'button': '5px',
            },
            transitionTimingFunction: {
                'design': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            transitionDuration: {
                'design': '150ms',
            },
            screens: {
                'sm': '640px',
                'md': '768px',
                'lg': '1024px',
                'xl': '1280px',
                '2xl': '1536px',
            },
        },
    },
    plugins: [],
};
export default config;
