import type { OrgTheme, OrgThemeCssVariables } from "@/branding/types";

const defaultInternalFont = "Arial, sans-serif";

function getFallbackFontStack(fontStack: string): string {
  const parts = fontStack
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return fontStack;
  }

  return parts.slice(1).join(", ");
}

function buildLoadedFontStack(loadedFontVar: `--${string}`, fontStack: string): string {
  const fallbackStack = getFallbackFontStack(fontStack);
  return `var(${loadedFontVar}), ${fallbackStack}`;
}

export function getOrgThemeCssVariables(theme: OrgTheme): OrgThemeCssVariables {
  const internalFont = theme.fonts.internal ?? defaultInternalFont;

  return {
    "--font-heading": buildLoadedFontStack("--font-heading-loaded", theme.fonts.heading),
    "--font-body": buildLoadedFontStack("--font-body-loaded", theme.fonts.body),
    "--font-internal": internalFont,
    "--color-brand-primary": theme.colors.brandPrimary,
    "--color-brand-accent": theme.colors.brandAccent,
    "--color-text-primary": theme.colors.textPrimary,
    "--color-text-muted": theme.colors.textMuted,
    "--color-surface-default": theme.colors.surface,
    "--color-surface-subtle": theme.colors.surfaceSubtle,
    "--color-border-default": theme.colors.border,
    "--color-neutral-700": theme.colors.neutral700,
    "--color-neutral-500": theme.colors.neutral500,
    "--color-neutral-200": theme.colors.neutral200,
    "--color-white": theme.colors.white,
    "--background": "color-mix(in srgb, var(--color-neutral-200) 28%, var(--color-white))",
    "--background-tint": "color-mix(in srgb, var(--color-neutral-200) 52%, var(--color-white))",
    "--foreground": "var(--color-text-primary)",
    "--surface": "var(--color-surface-default)",
    "--surface-muted": "color-mix(in srgb, var(--color-surface-subtle) 72%, var(--color-white))",
    "--brand-primary": "var(--color-brand-primary)",
    "--brand-primary-strong": "color-mix(in srgb, var(--color-brand-primary) 86%, black)",
    "--brand-secondary": "var(--color-brand-accent)",
    "--brand-secondary-soft": "color-mix(in srgb, var(--color-brand-primary) 10%, var(--color-white))",
    "--color-link": "var(--color-brand-primary)",
    "--color-link-hover": "color-mix(in srgb, var(--color-brand-primary) 82%, black)",
    "--color-shell-panel": "var(--color-surface-default)",
    "--color-shell-border": "color-mix(in srgb, var(--color-border-default) 42%, white)",
    "--color-shell-divider": "color-mix(in srgb, var(--color-neutral-200) 85%, white)",
    "--color-shell-hover": "color-mix(in srgb, var(--color-neutral-200) 55%, var(--color-white))",
    "--color-shell-active-bg": "var(--color-brand-accent)",
    "--color-shell-active-fg": "var(--color-white)",
    "--color-shell-active-chip": "var(--color-brand-primary)",
    "--color-shell-tooltip-bg": "var(--color-brand-accent)",
    "--color-shell-tooltip-fg": "var(--color-white)",
    "--color-card-header": "color-mix(in srgb, var(--color-surface-subtle) 42%, var(--color-white))",
    "--color-card-footer": "color-mix(in srgb, var(--color-surface-subtle) 30%, var(--color-white))",
    "--color-shell-surface-muted": "color-mix(in srgb, var(--color-surface-subtle) 34%, var(--color-white))",
    "--color-shell-soft-accent": "color-mix(in srgb, var(--color-brand-primary) 6%, var(--color-white))",
    "--color-focus-ring": "color-mix(in srgb, var(--color-brand-primary) 18%, var(--color-white))",
    "--color-focus-border": "color-mix(in srgb, var(--color-brand-primary) 45%, var(--color-border-default))",
    "--color-empty-state-border": "color-mix(in srgb, var(--color-border-default) 70%, var(--color-white))",
    "--color-empty-state-icon-bg": "color-mix(in srgb, var(--color-brand-primary) 7%, var(--color-white))",
    "--color-empty-state-icon-fg": "var(--brand-primary)",
    "--color-table-header-bg": "color-mix(in srgb, var(--color-surface-subtle) 46%, var(--color-white))",
    "--color-table-row-border": "color-mix(in srgb, var(--color-surface-subtle) 70%, var(--color-white))",
    "--color-table-row-hover": "color-mix(in srgb, var(--color-neutral-200) 34%, var(--color-white))",
    "--color-help-hint-icon-bg": "color-mix(in srgb, var(--color-brand-primary) 8%, var(--color-white))",
    "--color-help-hint-icon-fg": "var(--brand-primary)",
    "--color-overlay-scrim": "rgba(0, 0, 0, 0.42)",
    "--color-skeleton": "color-mix(in srgb, var(--color-surface-subtle) 72%, var(--color-white))",
    "--color-badge-neutral-bg": "color-mix(in srgb, var(--color-neutral-200) 70%, var(--color-white))",
    "--color-badge-neutral-border": "color-mix(in srgb, var(--color-border-default) 58%, var(--color-white))",
    "--color-badge-neutral-text": "var(--color-neutral-700)",
    "--color-status-success": "#246B45",
    "--color-status-success-surface": "color-mix(in srgb, var(--color-status-success) 12%, var(--color-white))",
    "--color-status-success-border": "color-mix(in srgb, var(--color-status-success) 26%, var(--color-white))",
    "--color-status-warning": "#A65A12",
    "--color-status-warning-surface": "color-mix(in srgb, var(--color-status-warning) 12%, var(--color-white))",
    "--color-status-warning-border": "color-mix(in srgb, var(--color-status-warning) 26%, var(--color-white))",
    "--color-status-danger": "#B22222",
    "--color-status-danger-surface": "color-mix(in srgb, var(--color-status-danger) 11%, var(--color-white))",
    "--color-status-danger-border": "color-mix(in srgb, var(--color-status-danger) 24%, var(--color-white))",
    "--color-status-info": "#275D8C",
    "--color-status-info-surface": "color-mix(in srgb, var(--color-status-info) 10%, var(--color-white))",
    "--color-status-info-border": "color-mix(in srgb, var(--color-status-info) 24%, var(--color-white))",
  };
}
