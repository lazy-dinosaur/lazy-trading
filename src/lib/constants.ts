/**
 * Breakpoint constants for responsive design
 */
export const BREAKPOINTS = {
  // Width breakpoints
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
  
  // Height breakpoints
  HEIGHT_LARGE: 800,
  HEIGHT_XLARGE: 1000
};

/**
 * Standard spacing values for consistent UI
 */
export const SPACING = {
  XS: "0.5",   // 2px
  SM: "1",     // 4px
  MD: "2",     // 8px
  LG: "4",     // 16px
  XL: "6",     // 24px
  XXL: "8"     // 32px
};

/**
 * Typography sizing constants
 */
export const TEXT_SIZE = {
  XS: "xs",
  SM: "sm",
  BASE: "base",
  LG: "lg",
  XL: "xl",
  XXL: "2xl"
};

/**
 * Semantic color constants for traders
 */
export const TRADING_COLORS = {
  // Position colors
  LONG: "text-green-500", 
  SHORT: "text-red-500",
  NEUTRAL: "text-blue-500",
  
  // PNL status colors
  POSITIVE: "text-green-500",
  NEGATIVE: "text-red-500",
  ZERO: "text-muted-foreground",
  
  // Indicator colors
  WARNING: "text-yellow-500",
  ERROR: "text-red-500",
  SUCCESS: "text-green-500",
  INFO: "text-blue-500"
};

/**
 * Common layout constants
 */
export const LAYOUT = {
  HEADER_HEIGHT: "4rem",
  SIDEBAR_WIDTH: "16rem",
  SIDEBAR_COLLAPSED_WIDTH: "4rem",
  MAIN_CONTENT_MAX_WIDTH: "1280px"
};