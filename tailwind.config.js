/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        ncasa: {
          forest: "#123C36",
          cream: "#F7F1E7",
          coral: "#F26B5B",
          "coral-dark": "#E05543",
          sage: "#9DB9A7",
          "sage-soft": "#E3ECE5",
          charcoal: "#202624",
          surface: "#FFFCF7",
          border: "#DCD8CF",
          muted: "#66706C",
          error: "#B83A32",
        },
      },
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(18, 60, 54, 0.04), 0 4px 16px rgba(18, 60, 54, 0.05)",
        card: "0 1px 3px rgba(18, 60, 54, 0.05), 0 8px 24px rgba(18, 60, 54, 0.06)",
      },
    },
  },
  plugins: [],
};
