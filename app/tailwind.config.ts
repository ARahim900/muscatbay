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
                primary: {
                    DEFAULT: '#4E4456', // Brand Purple-Gray
                    foreground: '#FFFFFF',
                },
                secondary: {
                    DEFAULT: '#00D2B3', // Teal/Cyan
                    foreground: '#FFFFFF',
                },
                success: '#10B981',
                warning: '#E8A838',
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
                'card-primary': '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)',
                'card-standard': '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)',
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
