import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "var(--margin-mobile)",
        md: "var(--margin-desktop)",
      },
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        headline: ["var(--font-sora)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-lg": [
          "var(--text-display-lg)",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" },
        ],
        "display-md": [
          "var(--text-display-md)",
          { lineHeight: "1.2", fontWeight: "700" },
        ],
        "headline-lg": [
          "var(--text-headline-lg)",
          { lineHeight: "1.3", fontWeight: "700" },
        ],
        "headline-lg-mobile": [
          "var(--text-headline-lg-mobile)",
          { lineHeight: "1.3", fontWeight: "700" },
        ],
        "body-lg": ["var(--text-body-lg)", { lineHeight: "1.6" }],
        "body-md": ["var(--text-body-md)", { lineHeight: "1.5" }],
        "body-sm": ["var(--text-body-sm)", { lineHeight: "1.5" }],
        "label-caps": ["var(--text-label-caps)", { lineHeight: "1.2", fontWeight: "700", letterSpacing: "0.1em" }],
        "stats-number": [
          "var(--text-stats-number)",
          { lineHeight: "1", fontWeight: "600" },
        ],
      },
      spacing: {
        unit: "var(--space-unit)",
        "2unit": "calc(var(--space-unit) * 2)",
        "3unit": "calc(var(--space-unit) * 3)",
        "4unit": "calc(var(--space-unit) * 4)",
        "5unit": "calc(var(--space-unit) * 5)",
        "6unit": "calc(var(--space-unit) * 6)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          container: "hsl(var(--primary-container))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          container: "hsl(var(--secondary-container))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          dim: "hsl(var(--surface-dim))",
          bright: "hsl(var(--surface-bright))",
          "container-lowest": "hsl(var(--surface-container-lowest))",
          "container-low": "hsl(var(--surface-container-low))",
          container: "hsl(var(--surface-container))",
          "container-high": "hsl(var(--surface-container-high))",
          "container-highest": "hsl(var(--surface-container-highest))",
          variant: "hsl(var(--surface-variant))",
          deep: "hsl(var(--surface-deep))",
          elevated: "hsl(var(--surface-elevated))",
        },
        outline: {
          DEFAULT: "hsl(var(--outline))",
          variant: "hsl(var(--outline-variant))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
          container: "hsl(var(--tertiary-container))",
        },
        void: {
          black: "hsl(var(--void-black))",
        },
        status: {
          online: "hsl(var(--status-online))",
        },
        rank: {
          gold: "hsl(var(--rank-gold))",
        },
        twitch: "hsl(var(--twitch))",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        "glow-purple": "var(--shadow-glow-purple)",
        "glow-purple-lg": "var(--shadow-glow-purple-lg)",
        "glow-cyan": "var(--shadow-glow-cyan)",
        "glow-cyan-lg": "var(--shadow-glow-cyan-lg)",
        "glow-cyan-focus": "var(--shadow-glow-cyan-focus)",
        glass: "var(--glass-inner-highlight)",
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-card": "var(--gradient-card)",
        "gradient-glass-highlight": "var(--gradient-glass-highlight)",
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
        overlay: "var(--glass-blur-strong)",
      },
      transitionDuration: {
        fast: "var(--transition-fast)",
        smooth: "var(--transition-smooth)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "status-pulse": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 0 0 hsl(var(--status-online) / 0.7)",
          },
          "50%": {
            opacity: "0.85",
            boxShadow: "0 0 0 6px hsl(var(--status-online) / 0)",
          },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "status-pulse": "status-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fade-in-up 0.3s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
