/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#7C3AED', // Violet
                    hover: '#6D28D9',
                    muted: '#2E1065',
                },
                surface: {
                    primary: '#0E0F13',
                    secondary: '#111318',
                    card: '#171A21',
                    hover: '#1B1F28',
                },
                stroke: {
                    DEFAULT: '#232733',
                    muted: '#1D212B',
                },
                trading: {
                    profit: '#10B981',
                    loss: '#EF4444',
                    warning: '#F59E0B',
                    neutral: '#94A3B8',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['IBM Plex Mono', 'monospace'],
            },
            borderRadius: {
                'xl': '0.75rem',
                '2xl': '1rem',
            }
        },
    },
    plugins: [],
}
