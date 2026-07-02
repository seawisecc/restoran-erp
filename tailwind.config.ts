import type { Config } from "tailwindcss";

// Palet diturunkan dari referensi desain (screenshot ApotekERP):
// sidebar slate-green gelap, konten cream/off-white, badge status hijau pastel.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: "#1c2b27", // background sidebar
          hover: "#28382f",   // hover/active menu item
          foreground: "#e7e9e4",
          muted: "#8f9c95",
        },
        surface: {
          DEFAULT: "#f3f1ea", // background halaman utama
          card: "#ffffff",
          border: "#e6e2d8",
        },
        ink: {
          DEFAULT: "#1a1a1a", // teks utama
          muted: "#6b6f6a",
        },
        accent: {
          DEFAULT: "#1a2420", // tombol primer (dark)
          success: "#1f8a4c",
          successBg: "#e3f6e9",
          warning: "#b98900",
          warningBg: "#fdf3d6",
          danger: "#c0392b",
          dangerBg: "#fbe4e1",
          link: "#2563eb",
        },
      },
      borderRadius: {
        card: "12px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
