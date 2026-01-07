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
        // New color scheme - Primary Colors
        primary: {
          dark: 'var(--primary-dark)',
          accent: 'var(--primary-accent)',
          light: 'var(--primary-light)',
        },
        // Secondary Colors
        secondary: {
          warm: 'var(--secondary-warm)',
          cool: 'var(--secondary-cool)',
        },
        // Neutrals
        neutral: {
          darkest: 'var(--neutral-darkest)',
          dark: 'var(--neutral-dark)',
          mid: 'var(--neutral-mid)',
          light: 'var(--neutral-light)',
          white: 'var(--neutral-white)',
        },
        // Status Colors
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        
        // Backward compatibility - map old colors to new scheme
        teal: {
          50: '#e8f5f3',
          100: '#c2e6e0', // Used for bg-teal-100
          200: '#9bd7cd',
          300: '#74c8ba',
          400: 'var(--primary-light)', // #16c79a - Used for text-teal-400
          500: 'var(--primary-accent)', // #0f7b6c
          600: 'var(--primary-accent)', // #0f7b6c - Main accent color
          700: '#0c5f52', // Darker shade for hover states
          800: '#094338',
          900: '#06271e',
        },
        brown: {
          50: '#e8e8f0',
          100: '#d1d1e1',
          200: '#babad2',
          300: '#a3a3c3',
          400: '#8c8cb4',
          500: '#6c6c8e',
          600: 'var(--neutral-dark)', // #2d2d44
          700: 'var(--neutral-dark)', // #2d2d44
          800: 'var(--primary-dark)', // #1a1a2e
          900: 'var(--neutral-darkest)', // #0a0a0f
        },
        orange: {
          50: '#fef3e2',
          100: '#fde7c5',
          200: '#fcdba8',
          300: '#fbcf8b',
          400: '#fac36e',
          500: 'var(--secondary-warm)', // #f39c12
          600: '#c57d0e',
          700: '#975e0b',
          800: '#693f08',
          900: '#3b2005',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;

