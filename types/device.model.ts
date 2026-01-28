import { TagModel } from "./tag.model";

// Supporting model types
export interface DeviceName {
  raw: string;
  sanitized: string;
  normalized: string;
}

export interface DeviceBrand {
  raw: string;
  sanitized: string;
  normalized: string;
}

export interface DeviceImage {
  originalUrl: string | null;
  webpUrl: string | null;
  pngUrl: string | null;
  alt: string | null;
  pocketbaseUrl: string | null;
}

export interface DeviceRelease {
  raw: string | null;
  mentionedDate: Date | null;
}

export interface DeviceOs {
  list: string[];
  icons: string[];
  raw: string;
  customFirmwares: string[];
}

export interface DevicePerformance {
  rating: number | null;
  normalizedRating: number | null;
  tier: string | null;
  maxEmulation: string | null;
  emulationLimit: string | null;
}

export enum EmulationSystem {
  Genesis = "Genesis",
  Dreamcast = "Dreamcast",
  Saturn = "Saturn",
  GameBoy = "Game Boy",
  GameBoyAdvance = "Game Boy Advance",
  NES = "NES",
  SNES = "SNES",
  Nintendo64 = "N64",
  NintendoDS = "DS",
  Nintendo3DS = "3DS",
  GameCube = "GameCube",
  Wii = "Wii",
  WiiU = "Wii U",
  Switch = "Switch",
  PSP = "PlayStation Portable",
  PS1 = "PlayStation 1",
  PS2 = "PlayStation 2",
  PS3 = "PlayStation 3",
  All = "Complete",
}

export interface SystemRating {
  system: EmulationSystem;
  ratingMark: string;
  ratingNumber: number | null;
}

export interface DeviceArchitecture {
  type: "ARM" | "x86-64" | "MIPS" | "other";
}

export interface DeviceCpu {
  name?: string;
  names: string[];
  cores: number | null;
  frequency?: number;
  threads?: number | null;
  raw: string;
  clockSpeed?: {
    max: number;
    min?: number;
    unit: string;
  } | null;
}

export interface DeviceGpu {
  name: string;
  frequency?: number;
  cores?: number | null;
  clockSpeed?: {
    max: number;
    min?: number;
    unit: string;
  } | null;
}

export interface DeviceRam {
  sizes: number[] | null;
  unit: string | null;
  raw: string;
  type: string | null;
}

export interface DeviceBattery {
  capacity: number | null;
  unit: string | null;
  type: string;
  removable: boolean;
  charging: string;
  raw: string | null;
}

export interface DeviceChargePort {
  type: string | null;
  raw: string | null;
  numberOfPorts: number | null;
}

export interface DeviceScreen {
  size?: number | null;
  type?: {
    type: string;
    raw: string;
    isTouchscreen?: boolean;
    isPenCapable?: boolean;
  } | null;
  resolution?:
    | Array<{
      raw: string;
      width: number;
      height: number;
    }>
    | null;
  aspectRatio?: string | null;
  refreshRate?: string;
  ppi?: number[] | null;
  lens?: string | null;
}

export interface Cooling {
  raw: string | null;
  hasHeatsink: boolean | null;
  hasHeatPipe: boolean | null;
  hasFan: boolean | null;
  hasVentilationCutouts: boolean | null;
}

export interface DeviceControls {
  dPad?: {
    type: string;
    raw: string;
  } | null;
  dpad?: string;
  analogs?: {
    dual: boolean;
    single: boolean;
    isHallSensor: boolean;
    isThumbstick: boolean;
    isSlidepad: boolean;
    L3: boolean;
    R3: boolean;
    raw: string;
  } | null;
  analogSticks?: string;
  numberOfFaceButtons?: number | null;
  faceButtons?: string;
  shoulderButtons?: {
    L1: boolean;
    L2: boolean;
    L3: boolean;
    R1: boolean;
    R2: boolean;
    R3: boolean;
    M1: boolean;
    M2: boolean;
    ZL: boolean;
    ZRVertical: boolean;
    ZRHorizontal: boolean;
    L: boolean;
    R: boolean;
    LC: boolean;
    RC: boolean;
    raw: string;
  } | null;
  touchscreen?: string;
  extraButtons?: {
    power: boolean;
    reset: boolean;
    home: boolean;
    volumeUp: boolean;
    volumeDown: boolean;
    function: boolean;
    turbo: boolean;
    touchpad: boolean;
    fingerprint: boolean;
    mute: boolean;
    screenshot: boolean;
    programmableButtons: boolean;
    raw: string;
  } | null;
}

export interface DeviceControlConfig {
  volumeControl: {
    type: string;
  };
  brightnessControl: {
    type: string;
  };
  powerControl: {
    type: string;
  };
}

export interface DeviceConnectivity {
  hasWifi: boolean | null;
  hasBluetooth: boolean | null;
  hasUsbC: boolean | null;
  hasNfc: boolean | null;
  hasUsb: boolean | null;
}

export interface DeviceOutputs {
  videoOutput?: {
    AV?: boolean;
    hasHdmi?: boolean;
    hasDisplayPort?: boolean;
    hasVga?: boolean;
    hasDvi?: boolean;
    hasUsbC?: boolean;
    hasMicroHdmi?: boolean;
    hasMiniHdmi?: boolean;
    OcuLink?: boolean;
    raw: string;
  } | null;
  audioOutput?: {
    has35mmJack?: boolean;
    hasHeadphoneJack?: boolean;
    hasUsbC?: boolean;
    raw: string;
  } | null;
  speaker?: {
    type: string;
  } | null;
}

export interface DeviceSensors {
  hasGyroscope: boolean;
  hasAccelerometer: boolean;
  hasMicrophone: boolean;
  hasCamera: boolean;
  hasFingerprintSensor: boolean;
  hasCompass: boolean;
  hasMagnetometer: boolean;
  hasBarometer: boolean;
  hasProximitySensor: boolean;
  hasAmbientLightSensor: boolean;
  hasGravitySensor: boolean;
  hasPressureSensor: boolean;
  hasTemperatureSensor: boolean;
  hasHumiditySensor: boolean;
  hasHeartRateSensor: boolean;
  hasAntenna: boolean;
  screenClosure: boolean;
  raw: string;
}

export interface DeviceDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
}

export interface ShellMaterial {
  raw: string | null;
  isPlastic: boolean | null;
  isMetal: boolean | null;
  isAluminum: boolean | null;
  isMagnesiumAlloy: boolean | null;
  isOther: boolean | null;
}

export interface DevicePricing {
  category: string | null;
  average: number | null;
  currency: string | null;
  range: {
    min: number | null;
    max: number | null;
  } | null;
  discontinued: boolean | null;
  raw: string | null;
}

export interface Link {
  url: string;
  name: string;
}

export interface DeviceReviews {
  count: number | null;
  average: number | null;
  videoReviews: Array<{
    url: string;
    name: string;
  }>;
  writtenReviews: Array<{
    url: string;
    name: string;
  }>;
}

// Main Device interface
export interface Device {
  id: string; // the id of the device, this is the same as the name.sanitized
  index: number; // the index/order of the device in the source data
  archived?: boolean; // whether the device is archived/hidden
  name: DeviceName;
  brand: DeviceBrand;
  totalRating: number; // the total rating of the device, scale of 0-10
  image: DeviceImage;
  released: DeviceRelease;
  formFactor: string | null;
  os: DeviceOs;
  performance: DevicePerformance;
  systemRatings: SystemRating[];
  deviceType: "handheld" | "oem"; // track the type of device

  systemOnChip: string | null;
  architecture: DeviceArchitecture | null;

  cpus: DeviceCpu[] | null;
  gpus: DeviceGpu[] | null;
  ram: DeviceRam | null;
  battery: DeviceBattery;
  chargePort: DeviceChargePort | null;
  storage: string | null;

  screen: DeviceScreen;
  cooling: Cooling;
  controls: DeviceControls;
  connectivity: DeviceConnectivity;
  outputs: DeviceOutputs;
  rumble: boolean | null;
  sensors: DeviceSensors | null;
  lowBatteryIndicator: string | null;

  volumeControl: DeviceControlConfig["volumeControl"] | null;
  brightnessControl: DeviceControlConfig["brightnessControl"] | null;
  powerControl: DeviceControlConfig["powerControl"] | null;

  dimensions: DeviceDimensions | null;
  weight: number | null;
  shellMaterial: ShellMaterial | null;
  colors: string[];

  reviews: DeviceReviews;
  vendorLinks: Link[];
  hackingGuides: Link[];
  pricing: DevicePricing;

  pros: string[];
  cons: string[];
  notes: string[];
  tags: TagModel[];
}

// Keep the simplified Tag interface for backward compatibility
export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}
