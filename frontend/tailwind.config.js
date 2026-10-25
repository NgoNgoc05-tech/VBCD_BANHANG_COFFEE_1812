/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Noto Sans SVN', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: "#6F4E37",
          accent: "#D4A373",
          background: "#FAF7F2",
          text: "#1F1A17",
          border: "#E8E1D9",
        },
        success: "#2D6A4F",
        error: "#E74C3C",
        warning: "#F4A261",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 4px 20px -4px rgba(31, 26, 23, 0.06)",
        medium: "0 8px 30px -6px rgba(31, 26, 23, 0.08)",
        card: "0 2px 8px -2px rgba(31, 26, 23, 0.04)",
      },
      transitionTimingFunction: {
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  darkMode: "class",
  plugins: [],
}