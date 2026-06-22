/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — air/sky theme
        primary: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a4bbfc',
          400: '#7b97f8',
          500: '#5a72f2',
          600: '#3d4ee6',
          700: '#2f3bcb',
          800: '#2a33a4',
          900: '#283082',
          950: '#0f172a',  // deep blue-grey — sidebar/header
        },
        // CPCB AQI color scale
        aqi: {
          good:         '#00b050',
          satisfactory: '#92d050',
          moderate:     '#ffff00',
          poor:         '#ff9900',
          verypoor:     '#ff0000',
          severe:       '#800000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
