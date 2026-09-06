/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#F7F8FA",
        foreground: "#172033",
        primary: {
          DEFAULT: '#1769E0',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: "#667085",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#98A2B3",
          foreground: "#172033",
        },
        success: {
          DEFAULT: "#16A34A",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#ffffff",
        },
        info: {
          DEFAULT: "#8B5CF6",
          foreground: "#ffffff",
        },
        teal: {
          DEFAULT: "#14B8A6",
          foreground: "#ffffff",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

