import { brandingService } from '../services/brandingService';

export const BRANDING_EVENT = 'itsm-branding-updated';

const allowedShapes = ['square', 'rounded', 'pill'];
const allowedButtonStyles = ['solid', 'outline', 'gradient'];
const allowedFonts = ['sans', 'serif', 'mono'];
const allowedDensity = ['compact', 'normal', 'comfortable'];

export const defaultBrandingConfig = {
  companyName: 'COMUTEL SERVICES',
  slogan: 'Plataforma ITSM',
  logoUrl: '',
  faviconUrl: '',
  backgroundImageUrl: '',
  customCss: '',

  primaryColor: '#2563eb',
  secondaryColor: '#0f172a',
  accentColor: '#14b8a6',
  appBackground: '#f1f5f9',
  textColor: '#0f172a',
  panelColor: '#0f172a',
  panelTextColor: '#e2e8f0',
  panelMutedTextColor: '#94a3b8',
  headerBackground: '#ffffff',
  headerTextColor: '#334155',
  cardBackground: '#ffffff',
  cardBorderColor: '#e2e8f0',
  inputBackground: '#ffffff',
  inputTextColor: '#0f172a',
  inputBorderColor: '#cbd5e1',
  tableHeaderBackground: '#e2e8f0',
  tableHeaderTextColor: '#0f172a',

  buttonShape: 'rounded',
  buttonStyle: 'solid',
  buttonShadow: true,
  buttonTextUppercase: false,
  navCompact: false,

  fontFamily: 'sans',
  baseFontSize: 15,
  globalRadius: 12,
  shadowStrength: 2,
  density: 'normal',
  appOverlayOpacity: 0.92,
  hideTopHeader: false,
  glassHeader: false,
};

let brandingCache = { ...defaultBrandingConfig };
let bootstrapPromise = null;

const shapeToRadius = {
  square: '0.25rem',
  rounded: '0.75rem',
  pill: '999px',
};

const fontMap = {
  sans: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  serif: "'Georgia', 'Times New Roman', serif",
  mono: "'Consolas', 'Courier New', monospace",
};

const densityMap = {
  compact: '0.88',
  normal: '1',
  comfortable: '1.12',
};

const shadowMap = {
  0: 'none',
  1: '0 8px 16px -12px rgba(15, 23, 42, 0.35)',
  2: '0 12px 20px -10px rgba(15, 23, 42, 0.45)',
  3: '0 18px 30px -12px rgba(15, 23, 42, 0.58)',
};

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function sanitizeString(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const parsed = value.trim();
  return parsed || fallback;
}

function sanitizeOptionalString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function pickAllowed(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

export function getButtonRadius(shape) {
  return shapeToRadius[shape] || shapeToRadius.rounded;
}

export function normalizeBrandingConfig(raw = {}) {
  const merged = {
    ...defaultBrandingConfig,
    ...raw,
  };

  return {
    ...merged,
    companyName: sanitizeString(merged.companyName, defaultBrandingConfig.companyName),
    slogan: sanitizeString(merged.slogan, defaultBrandingConfig.slogan),
    logoUrl: sanitizeOptionalString(merged.logoUrl),
    faviconUrl: sanitizeOptionalString(merged.faviconUrl),
    backgroundImageUrl: sanitizeOptionalString(merged.backgroundImageUrl),
    customCss: typeof merged.customCss === 'string' ? merged.customCss : '',

    primaryColor: sanitizeString(merged.primaryColor, defaultBrandingConfig.primaryColor),
    secondaryColor: sanitizeString(merged.secondaryColor, defaultBrandingConfig.secondaryColor),
    accentColor: sanitizeString(merged.accentColor, defaultBrandingConfig.accentColor),
    appBackground: sanitizeString(merged.appBackground, defaultBrandingConfig.appBackground),
    textColor: sanitizeString(merged.textColor, defaultBrandingConfig.textColor),
    panelColor: sanitizeString(merged.panelColor, defaultBrandingConfig.panelColor),
    panelTextColor: sanitizeString(merged.panelTextColor, defaultBrandingConfig.panelTextColor),
    panelMutedTextColor: sanitizeString(merged.panelMutedTextColor, defaultBrandingConfig.panelMutedTextColor),
    headerBackground: sanitizeString(merged.headerBackground, defaultBrandingConfig.headerBackground),
    headerTextColor: sanitizeString(merged.headerTextColor, defaultBrandingConfig.headerTextColor),
    cardBackground: sanitizeString(merged.cardBackground, defaultBrandingConfig.cardBackground),
    cardBorderColor: sanitizeString(merged.cardBorderColor, defaultBrandingConfig.cardBorderColor),
    inputBackground: sanitizeString(merged.inputBackground, defaultBrandingConfig.inputBackground),
    inputTextColor: sanitizeString(merged.inputTextColor, defaultBrandingConfig.inputTextColor),
    inputBorderColor: sanitizeString(merged.inputBorderColor, defaultBrandingConfig.inputBorderColor),
    tableHeaderBackground: sanitizeString(merged.tableHeaderBackground, defaultBrandingConfig.tableHeaderBackground),
    tableHeaderTextColor: sanitizeString(merged.tableHeaderTextColor, defaultBrandingConfig.tableHeaderTextColor),

    buttonShape: pickAllowed(merged.buttonShape, allowedShapes, defaultBrandingConfig.buttonShape),
    buttonStyle: pickAllowed(merged.buttonStyle, allowedButtonStyles, defaultBrandingConfig.buttonStyle),
    buttonShadow: Boolean(merged.buttonShadow),
    buttonTextUppercase: Boolean(merged.buttonTextUppercase),
    navCompact: Boolean(merged.navCompact),

    fontFamily: pickAllowed(merged.fontFamily, allowedFonts, defaultBrandingConfig.fontFamily),
    baseFontSize: clampNumber(merged.baseFontSize, 12, 18, defaultBrandingConfig.baseFontSize),
    globalRadius: clampNumber(merged.globalRadius, 4, 24, defaultBrandingConfig.globalRadius),
    shadowStrength: clampNumber(merged.shadowStrength, 0, 3, defaultBrandingConfig.shadowStrength),
    density: pickAllowed(merged.density, allowedDensity, defaultBrandingConfig.density),
    appOverlayOpacity: clampNumber(merged.appOverlayOpacity, 0, 1, defaultBrandingConfig.appOverlayOpacity),
    hideTopHeader: Boolean(merged.hideTopHeader),
    glassHeader: Boolean(merged.glassHeader),
  };
}

export function loadBrandingConfig() {
  return normalizeBrandingConfig(brandingCache);
}

export function notifyBrandingUpdated() {
  window.dispatchEvent(new Event(BRANDING_EVENT));
}

function upsertCustomCssTag(cssText) {
  const id = 'itsm-custom-css';
  let styleTag = document.getElementById(id);
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = id;
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = cssText || '';
}

export function applyBrandingTheme(config) {
  if (typeof document === 'undefined') return config;
  const root = document.documentElement;
  const normalized = normalizeBrandingConfig(config);

  root.style.setProperty('--itsm-primary', normalized.primaryColor);
  root.style.setProperty('--itsm-secondary', normalized.secondaryColor);
  root.style.setProperty('--itsm-accent', normalized.accentColor);
  root.style.setProperty('--itsm-app-bg', normalized.appBackground);
  root.style.setProperty('--itsm-text', normalized.textColor);
  root.style.setProperty('--itsm-panel', normalized.panelColor);
  root.style.setProperty('--itsm-panel-text', normalized.panelTextColor);
  root.style.setProperty('--itsm-panel-muted-text', normalized.panelMutedTextColor);
  root.style.setProperty('--itsm-header-bg', normalized.headerBackground);
  root.style.setProperty('--itsm-header-text', normalized.headerTextColor);
  root.style.setProperty('--itsm-card-bg', normalized.cardBackground);
  root.style.setProperty('--itsm-card-border', normalized.cardBorderColor);
  root.style.setProperty('--itsm-input-bg', normalized.inputBackground);
  root.style.setProperty('--itsm-input-text', normalized.inputTextColor);
  root.style.setProperty('--itsm-input-border', normalized.inputBorderColor);
  root.style.setProperty('--itsm-table-header-bg', normalized.tableHeaderBackground);
  root.style.setProperty('--itsm-table-header-text', normalized.tableHeaderTextColor);

  root.style.setProperty('--itsm-font-family', fontMap[normalized.fontFamily]);
  root.style.setProperty('--itsm-font-size', `${normalized.baseFontSize}px`);
  root.style.setProperty('--itsm-global-radius', `${normalized.globalRadius}px`);
  root.style.setProperty('--itsm-btn-radius', getButtonRadius(normalized.buttonShape));
  root.style.setProperty('--itsm-density-scale', densityMap[normalized.density]);
  root.style.setProperty('--itsm-app-overlay-opacity', normalized.appOverlayOpacity.toString());

  const dynamicShadow = normalized.buttonShadow ? shadowMap[normalized.shadowStrength] : 'none';
  root.style.setProperty('--itsm-btn-shadow', dynamicShadow);
  root.style.setProperty('--itsm-card-shadow', shadowMap[normalized.shadowStrength]);

  root.style.setProperty('--itsm-btn-uppercase', normalized.buttonTextUppercase ? 'uppercase' : 'none');
  root.style.setProperty('--itsm-header-blur', normalized.glassHeader ? 'saturate(180%) blur(12px)' : 'none');

  if (normalized.backgroundImageUrl) {
    root.style.setProperty('--itsm-app-image', `url('${normalized.backgroundImageUrl}')`);
  } else {
    root.style.setProperty('--itsm-app-image', 'none');
  }

  root.dataset.itsmBtnStyle = normalized.buttonStyle;
  root.dataset.itsmHideHeader = normalized.hideTopHeader ? '1' : '0';

  if (normalized.faviconUrl) {
    const existing = document.querySelector("link[rel='icon']");
    if (existing) existing.href = normalized.faviconUrl;
  }

  upsertCustomCssTag(normalized.customCss);

  return normalized;
}

export async function hydrateBrandingConfig() {
  if (bootstrapPromise) return await bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      const serverConfig = await brandingService.obtenerConfig();
      const normalized = normalizeBrandingConfig(serverConfig || {});
      brandingCache = normalized;
      applyBrandingTheme(normalized);
      notifyBrandingUpdated();
      return normalized;
    } catch {
      const fallback = normalizeBrandingConfig(defaultBrandingConfig);
      brandingCache = fallback;
      applyBrandingTheme(fallback);
      notifyBrandingUpdated();
      return fallback;
    } finally {
      bootstrapPromise = null;
    }
  })();

  return await bootstrapPromise;
}

export async function saveBrandingConfig(config) {
  const normalized = normalizeBrandingConfig(config);
  const saved = await brandingService.guardarConfig(normalized);
  const finalConfig = normalizeBrandingConfig(saved || normalized);
  brandingCache = finalConfig;
  applyBrandingTheme(finalConfig);
  notifyBrandingUpdated();
  return finalConfig;
}

export async function resetBrandingConfig() {
  return await saveBrandingConfig(defaultBrandingConfig);
}
