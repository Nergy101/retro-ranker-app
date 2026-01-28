import { Device, EmulationSystem, SystemRating } from "../types/device.model";

// Emulation system difficulty order (higher number = more difficult)
const EmulationSystemOrder: Record<EmulationSystem, number> = {
  [EmulationSystem.Genesis]: 1,
  [EmulationSystem.Dreamcast]: 2,
  [EmulationSystem.Saturn]: 3,
  [EmulationSystem.GameBoy]: 4,
  [EmulationSystem.GameBoyAdvance]: 5,
  [EmulationSystem.NES]: 6,
  [EmulationSystem.SNES]: 7,
  [EmulationSystem.Nintendo64]: 8,
  [EmulationSystem.NintendoDS]: 9,
  [EmulationSystem.Nintendo3DS]: 10,
  [EmulationSystem.GameCube]: 11,
  [EmulationSystem.Wii]: 12,
  [EmulationSystem.WiiU]: 13,
  [EmulationSystem.PSP]: 14,
  [EmulationSystem.PS1]: 15,
  [EmulationSystem.PS2]: 16,
  [EmulationSystem.PS3]: 17,
  [EmulationSystem.Switch]: 18,
  [EmulationSystem.All]: 19,
};

export function getUptoSystemA(device: Device): SystemRating | null {
  const systemRatings = device.systemRatings || [];
  if (systemRatings.length === 0) {
    return null;
  }

  // If all ratings are A, return null (handled separately as "All")
  if (
    systemRatings.every((rating) => rating.ratingMark.toUpperCase() === "A")
  ) {
    return {
      system: EmulationSystem.All,
      ratingMark: "ALL",
      ratingNumber: null,
    };
  }

  const aRatings = systemRatings.filter(
    (rating) => rating.ratingMark.toUpperCase() === "A",
  );
  if (aRatings.length === 0) {
    return null;
  }

  // Find the most difficult system with A rating
  const mostDifficultSystem = aRatings.reduce((prev, current) =>
    EmulationSystemOrder[prev.system] > EmulationSystemOrder[current.system]
      ? prev
      : current
  );

  return mostDifficultSystem;
}

export function getUptoSystemCOrLower(device: Device): SystemRating | null {
  const systemRatings = device.systemRatings || [];
  if (systemRatings.length === 0) {
    return null;
  }

  // Define rating priority (highest to lowest)
  const ratingPriority = ["C", "D", "E", "F"];

  // Try each rating in priority order
  for (const targetRating of ratingPriority) {
    const matchingRatings = systemRatings.filter(
      (rating) => rating.ratingMark.toUpperCase() === targetRating,
    );

    if (matchingRatings.length > 0) {
      // If we found systems with this rating, return the easiest one
      return matchingRatings.reduce((prev, current) =>
        EmulationSystemOrder[prev.system] > EmulationSystemOrder[current.system]
          ? prev
          : current
      );
    }
  }

  return null;
}

// Short names for systems
const EmulationSystemShort: Record<EmulationSystem, string> = {
  [EmulationSystem.GameBoy]: "GB",
  [EmulationSystem.NES]: "NES",
  [EmulationSystem.Genesis]: "Genesis",
  [EmulationSystem.GameBoyAdvance]: "GBA",
  [EmulationSystem.SNES]: "SNES",
  [EmulationSystem.PS1]: "PS1",
  [EmulationSystem.NintendoDS]: "DS",
  [EmulationSystem.Nintendo3DS]: "3DS",
  [EmulationSystem.Nintendo64]: "N64",
  [EmulationSystem.Dreamcast]: "DC",
  [EmulationSystem.PSP]: "PSP",
  [EmulationSystem.Saturn]: "Saturn",
  [EmulationSystem.GameCube]: "GC",
  [EmulationSystem.Wii]: "Wii",
  [EmulationSystem.PS2]: "PS2",
  [EmulationSystem.WiiU]: "Wii U",
  [EmulationSystem.Switch]: "Switch",
  [EmulationSystem.PS3]: "PS3",
  [EmulationSystem.All]: "All",
};

export function getSystemShortName(system: EmulationSystem): string {
  return EmulationSystemShort[system] || system;
}
