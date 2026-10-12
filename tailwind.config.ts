import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#FFFFFF",
          50: "#FAFAFB",
          100: "#F3F4F6",
          200: "#E9EAED",
          300: "#DCDEE3"
        },
        ink: {
          900: "#15161A",
          700: "#4B4D55",
          500: "#7C7E88",
          300: "#AEB0B8",
          100: "#E3E4E8"
        },
        accent: {
          DEFAULT: "#3D6DFF",
          soft: "#E8EDFF",
          strong: "#2650D6"
        },
        signal: {
          ok: "#1FA869",
          warn: "#C98A1E",
          risk: "#D4473E"
        }
      },
      borderRadius: {
        token: "16px",
        "token-lg": "22px",
        "token-sm": "11px"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        token: "0 1px 2px 0 rgba(21,22,26,0.04), 0 10px 24px -14px rgba(21,22,26,0.14)",
        "token-sm": "0 1px 2px 0 rgba(21,22,26,0.06)"
      }
    }
  },
  plugins: []
};

export default config;
