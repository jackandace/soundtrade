import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 公開サイト（moheim 風ミニマル）
        ivory: "#FAFAF7",
        beige: "#F4F0E8",
        sumi: {
          DEFAULT: "#1A1A1A",
          light: "#555555",
        },
        muted: "#888888",
        line: {
          DEFAULT: "#E5E5E5",
          mid: "#D5D5D5",
        },
        accent: "#B8956A",
        err: "#C84B3D",
        stock: {
          in: "#2E7D32",
          order: "#9C7C5C",
        },
        // 管理画面（CUD 準拠）
        admin: {
          bg: "#F0F1F3",
          surface: "#FFFFFF",
          surfaceAlt: "#F7F8FA",
          ink: "#1A1A1A",
          inkSub: "#555555",
          inkMute: "#777777",
          line: "#D5D8DC",
          lineLight: "#E8EAED",
          navy: "#1B2A41",
          navyHover: "#2A3F5F",
          success: "#2E7D32",
          successBg: "#E8F3E9",
          warning: "#F4A300",
          warningBg: "#FCF2DC",
          danger: "#D52941",
          dangerBg: "#FBE4E7",
          info: "#1976D2",
          infoBg: "#E4EFFB",
          neutral: "#6C757D",
          neutralBg: "#EBECEE",
        },
      },
      fontFamily: {
        sans: ["var(--font-noto-sans-jp)", "ui-sans-serif", "system-ui", "sans-serif"],
        dm: ["var(--font-dm-sans)", "ui-sans-serif", "sans-serif"],
      },
      fontSize: {
        "admin-base": "var(--font-base)",
        "admin-h1": "var(--font-h1)",
        "admin-h2": "var(--font-h2)",
        "admin-h3": "var(--font-h3)",
        "admin-sm": "var(--font-sm)",
        "admin-xs": "var(--font-xs)",
      },
      maxWidth: {
        container: "1280px",
      },
      animation: {
        "logo-scroll": "logoScroll 30s linear infinite",
      },
      keyframes: {
        logoScroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
