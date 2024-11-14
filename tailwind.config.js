/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        plasma: {
          50: '#E6F4FF',
          100: '#BFDEFF',
          200: '#99C8FF',
          300: '#73B2FF',
          400: '#4D9CFF',
          500: '#2686FF',
          600: '#006BE6',
          700: '#0054B3',
          800: '#003D80',
          900: '#00264D',
        },
        dark: {
          50: '#F2F2F2',
          100: '#E6E6E6',
          200: '#CCCCCC',
          300: '#B3B3B3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4D4D4D',
          800: '#333333',
          900: '#1A1A1A',
        }
      },
      animation: {
        'plasma-pulse': 'plasma-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'plasma-pulse': {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 0.8 },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backgroundImage: {
        'plasma-gradient': 'linear-gradient(135deg, rgba(0,107,230,0.15) 0%, rgba(38,134,255,0.15) 100%)',
      }
    },
  },
  plugins: [],
};