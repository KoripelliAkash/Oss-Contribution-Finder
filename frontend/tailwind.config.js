/**
 * Tailwind config wired to GitHub's Primer design tokens (dark theme).
 * Values sourced from @primer/primitives `dark` theme — change there first.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces — Primer dark canvas family
        canvas: {
          DEFAULT: "#0d1117", // bgColor-canvas-default (page + inputs)
          subtle: "#161b22", // bgColor-canvas-subtle (cards)
          inset: "#010409", // bgColor-canvas-inset (header, footer)
        },
        muted: "#161b22",
        subtle: "#21262d",
        border: {
          DEFAULT: "#30363d", // borderColor-default
          muted: "#21262d", // borderColor-muted
        },
        neutral: "#6e7681",
        fg: {
          DEFAULT: "#e6edf3",
          muted: "#7d8590",
          subtle: "#6e7681",
          onemphasis: "#ffffff",
        },
        // Primer semantic colors (dark theme)
        accent: {
          DEFAULT: "#58a6ff", // accent-fg — links on dark
          subtle: "rgba(56, 139, 253, 0.15)",
          muted: "rgba(56, 139, 253, 0.4)",
          emphasis: "#1f6feb",
        },
        success: {
          DEFAULT: "#3fb950",
          fg: "#3fb950",
          subtle: "rgba(46, 160, 67, 0.15)",
          emphasis: "#238636",
        },
        danger: {
          DEFAULT: "#f85149",
          fg: "#f85149",
          subtle: "rgba(248, 81, 73, 0.1)",
          emphasis: "#da3633",
        },
        attention: {
          DEFAULT: "#d29922",
          fg: "#d29922",
          subtle: "rgba(187, 128, 9, 0.15)",
          emphasis: "#9e6a03",
        },
        severe: {
          DEFAULT: "#db6d28",
          fg: "#db6d28",
          subtle: "rgba(212, 118, 71, 0.15)",
          emphasis: "#da3633",
        },
        done: {
          DEFAULT: "#a371f7",
          fg: "#a371f7",
          subtle: "rgba(163, 113, 247, 0.15)",
          emphasis: "#8957e5",
        },
        // Active underline-nav indicator (`primer.border.active`)
        active: "#f78166",
        // Legacy "brand" scale remapped onto Primer dark accent blues
        brand: {
          50: "rgba(56, 139, 253, 0.15)",
          100: "rgba(56, 139, 253, 0.4)",
          500: "#1f6feb",
          600: "#58a6ff",
          700: "#58a6ff",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Noto Sans",
          "Helvetica",
          "Arial",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "6px",
        lg: "6px",
        xl: "6px",
        "2xl": "6px",
        "3xl": "6px",
        full: "9999px",
      },
      boxShadow: {
        small: "0 1px 0 rgba(1, 4, 9, 0.3)",
        medium: "0 8px 24px rgba(1, 4, 9, 0.5)",
        large: "0 16px 32px rgba(1, 4, 9, 0.5)",
        inset: "inset 0 -1px 0 rgba(1, 4, 9, 0.3)",
        focus: "0 0 0 3px rgba(56, 139, 253, 0.45)",
      },
    },
  },
  plugins: [],
};