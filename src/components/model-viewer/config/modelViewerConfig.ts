/**
 * Central configuration for 3D model viewer
 * This file contains all the settings for the 3D model viewer components
 */

// Default camera settings
export const DEFAULT_CAMERA_POSITION = [0, 0, 5] as [number, number, number];
export const DEFAULT_CAMERA_FOV = 50;

// Default lighting settings
export const DEFAULT_AMBIENT_LIGHT_INTENSITY = 0.5;
export const DEFAULT_DIRECTIONAL_LIGHT_INTENSITY = 1;
export const DEFAULT_DIRECTIONAL_LIGHT_POSITION = [10, 10, 5] as [number, number, number];

// Default environment settings
export const DEFAULT_ENVIRONMENT_PRESET = "sunset";
export const DEFAULT_BACKGROUND_COLOR = "#1a1a1a";

// Model loading settings
export const MAX_CONCURRENT_LOADS = 1;
export const DEFAULT_LOAD_RETRIES = 2;
export const HIGH_PRIORITY = 2;
export const MEDIUM_PRIORITY = 1;
export const LOW_PRIORITY = 0;

// Canvas settings
export const DEFAULT_CANVAS_CONFIG = {
  powerPreference: "low-power" as const,
  antialias: false,
  depth: true,
  stencil: false,
  alpha: true
};

// Default DPR (Device Pixel Ratio) settings
export const DEFAULT_DPR = [0.8, 1] as [number, number];

// OrbitControls settings
export const DEFAULT_ORBIT_CONTROLS = {
  autoRotateSpeed: 2,
  enablePan: true,
  enableZoom: true,
  enableRotate: true,
  minDistance: 2,
  maxDistance: 10
};

// Gallery preview settings
export const GALLERY_PREVIEW_ORBIT_CONTROLS = {
  autoRotateSpeed: 1.5,
  enablePan: false,
  enableZoom: false,
  enableRotate: false
};

// Model scale settings
export const DEFAULT_MODEL_SCALE = 1.5;

// Resource cleanup settings
export const CLEANUP_DELAY = 300; // ms

// CORS proxy settings
export const CORS_PROXIES = [
  "https://cors-proxy.fringe.zone/",
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url="
];

// Cache busting parameters to clean from URLs
export const CACHE_PARAMS = ['t', 'cb', 'cache'];