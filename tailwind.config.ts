import type { Config } from "tailwindcss";

// Palet Seawise Enterprise Apps — Restaurants Edition.
// Diselaraskan dengan Pharmacy Store Edition (apotek): sidebar hijau
// slate gelap, konten cream/off-white, aksen hijau hutan + peach hangat.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: "#1b3426", // background sidebar (hijau hutan apotek)
          hover: "#274536", // hover/active menu item
          foreground: "#e7e9e4",
          muted: "#93a396",
        },
        surface: {
          DEFAULT: "#eef0ea", // background halaman utama (base ambient apotek)
          card: "#ffffff",
          border: "#e2ddd3",
        },
        ink: {
          DEFAULT: "#1c2620", // teks utama
          muted: "#6b6f6a",
        },
        accent: {
          DEFAULT: "#1e3a2c", // tombol primer (hijau hutan)
          hover: "#16281f", // hover tombol primer
          peach: "#c2632f", // aksen hangat (titik logo, highlight)
          peachBg: "#f6e7db",
          success: "#1f8a4c",
          successBg: "#e3f6e9",
          warning: "#b98900",
          warningBg: "#fdf3d6",
          danger: "#c0392b",
          dangerBg: "#fbe4e1",
          link: "#1e3a2c",
        },
      },
      borderRadius: {
        card: "12px",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
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
