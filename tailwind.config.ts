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
        agri: {
          evergreen: {
            DEFAULT: "#1B4332",
            dark: "#081C15",
            light: "#2D6A4F",
          },
          sprout: {
            DEFAULT: "#40916C",
            light: "#52B788",
            bright: "#74C69D",
            soft: "#D8F3DC",
          },
          harvest: {
            DEFAULT: "#E9C46A",
            terracotta: "#E76F51",
            sand: "#F4A261",
            warm: "#D4A373",
            soft: "#FEFAE0",
          },
          earth: {
            50: "#F8F9FA",
            100: "#F0F3F1",
            200: "#E5E9E6",
            300: "#CBD5D0",
            700: "#344E41",
            800: "#1D2421",
            900: "#121715",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
