import { Device } from "../../types/device.model";

export interface Ranking {
  emuPerformance: string[];
  monitor: string[];
  dimensions: string[];
  connectivity: string[];
  audio: string[];
  controls: string[];
  misc: string[];
  all: string[];
}

export class RankingService {
  private static instance: RankingService;

  private constructor() {}

  public static getInstance(): RankingService {
    if (!RankingService.instance) {
      RankingService.instance = new RankingService();
    }
    return RankingService.instance;
  }

  public createRanking(devices: Device[]): Ranking {
    const ranking: Ranking = {
      emuPerformance: this.rankDevicesByEmuPerformance(devices),
      monitor: this.rankDevicesByMonitor(devices),
      dimensions: this.rankDevicesByDimensions(devices),
      connectivity: this.rankDevicesByConnectivity(devices),
      audio: this.rankDevicesByAudio(devices),
      controls: this.rankDevicesByControls(devices),
      misc: this.rankDevicesByMisc(devices),
      all: [],
    };

    ranking.all = this.rankDevicesByAll(devices, ranking);
    return ranking;
  }

  private rankDevicesByEmuPerformance(devices: Device[]): string[] {
    if (devices.length === 1) {
      return [devices[0].name.sanitized];
    }

    const ranked = devices
      .map((device) => ({
        name: device.name.sanitized,
        score: device.totalRating || 0,
      }))
      .sort((a, b) => b.score - a.score);

    if (ranked.length > 1 && ranked[0].score === ranked[1].score) {
      return ["equal"];
    }

    return ranked.map((d) => d.name);
  }

  private rankDevicesByMonitor(devices: Device[]): string[] {
    if (devices.length === 1) {
      return [devices[0].name.sanitized];
    }

    const ranked = devices
      .map((device) => ({
        name: device.name.sanitized,
        score: this.calculateMonitorScore(device),
      }))
      .sort((a, b) => b.score - a.score);

    if (ranked.length > 1 && ranked[0].score === ranked[1].score) {
      return ["equal"];
    }

    return ranked.map((d) => d.name);
  }

  private calculateMonitorScore(device: Device): number {
    let score = 0;
    if (device.screen?.size) score += device.screen.size * 10;
    if (
      device.screen?.type?.type === "OLED" ||
      device.screen?.type?.type === "AMOLED"
    ) {
      score += 50;
    } else if (device.screen?.type?.type === "IPS") {
      score += 30;
    }
    if (device.screen?.ppi?.[0]) score += device.screen.ppi[0] * 0.1;
    return score;
  }

  private rankDevicesByDimensions(devices: Device[]): string[] {
    if (devices.length === 1) {
      return [devices[0].name.sanitized];
    }

    const ranked = devices
      .map((device) => ({
        name: device.name.sanitized,
        score: this.calculateDimensionScore(device),
      }))
      .sort((a, b) => b.score - a.score);

    if (ranked.length > 1 && ranked[0].score === ranked[1].score) {
      return ["equal"];
    }

    return ranked.map((d) => d.name);
  }

  private calculateDimensionScore(device: Device): number {
    if (!device.dimensions) return 0;
    const { length, width, height } = device.dimensions;
    if (!length || !width || !height) return 0;
    return (length * width * height) / 1000;
  }

  private rankDevicesByConnectivity(devices: Device[]): string[] {
    if (devices.length === 1) {
      return [devices[0].name.sanitized];
    }

    const ranked = devices
      .map((device) => ({
        name: device.name.sanitized,
        score: this.calculateConnectivityScore(device),
      }))
      .sort((a, b) => b.score - a.score);

    if (ranked.length > 1 && ranked[0].score === ranked[1].score) {
      return ["equal"];
    }

    return ranked.map((d) => d.name);
  }

  private calculateConnectivityScore(device: Device): number {
    let score = 0;
    if (device.connectivity?.hasWifi) score += 10;
    if (device.connectivity?.hasBluetooth) score += 10;
    if (device.connectivity?.hasUsbC) score += 10;
    if (device.connectivity?.hasUsb) score += 5;
    if (device.connectivity?.hasNfc) score += 5;
    return score;
  }

  private rankDevicesByAudio(devices: Device[]): string[] {
    if (devices.length === 1) {
      return [devices[0].name.sanitized];
    }

    const ranked = devices
      .map((device) => ({
        name: device.name.sanitized,
        score: this.calculateAudioScore(device),
      }))
      .sort((a, b) => b.score - a.score);

    if (ranked.length > 1 && ranked[0].score === ranked[1].score) {
      return ["equal"];
    }

    return ranked.map((d) => d.name);
  }

  private calculateAudioScore(device: Device): number {
    let score = 0;
    if (
      device.outputs?.audioOutput?.has35mmJack ||
      device.outputs?.audioOutput?.hasHeadphoneJack
    ) {
      score += 10;
    }
    if (device.outputs?.speaker) score += 5;
    return score;
  }

  private rankDevicesByControls(devices: Device[]): string[] {
    if (devices.length === 1) {
      return [devices[0].name.sanitized];
    }

    const ranked = devices
      .map((device) => ({
        name: device.name.sanitized,
        score: this.calculateControlsScore(device),
      }))
      .sort((a, b) => b.score - a.score);

    if (ranked.length > 1 && ranked[0].score === ranked[1].score) {
      return ["equal"];
    }

    return ranked.map((d) => d.name);
  }

  private calculateControlsScore(device: Device): number {
    let score = 0;
    if (device.controls?.analogs?.dual) score += 20;
    else if (device.controls?.analogs?.single) score += 10;
    if (device.controls?.dPad) score += 5;
    if (device.controls?.shoulderButtons) {
      const buttons = device.controls.shoulderButtons;
      if (buttons.L1 && buttons.R1) score += 10;
      if (buttons.L2 && buttons.R2) score += 10;
    }
    if (device.controls?.numberOfFaceButtons) {
      score += device.controls.numberOfFaceButtons * 2;
    }
    return score;
  }

  private rankDevicesByMisc(devices: Device[]): string[] {
    if (devices.length === 1) {
      return [devices[0].name.sanitized];
    }

    const ranked = devices
      .map((device) => ({
        name: device.name.sanitized,
        score: this.calculateMiscScore(device),
      }))
      .sort((a, b) => b.score - a.score);

    if (ranked.length > 1 && ranked[0].score === ranked[1].score) {
      return ["equal"];
    }

    return ranked.map((d) => d.name);
  }

  private calculateMiscScore(device: Device): number {
    let score = 0;
    if (device.battery?.capacity) score += device.battery.capacity / 100;
    if (device.storage) score += 5;
    if (device.rumble) score += 5;
    return score;
  }

  private rankDevicesByAll(devices: Device[], ranking: Ranking): string[] {
    if (devices.length === 1) {
      return [devices[0].name.sanitized];
    }

    // Weighted scoring: Performance 30%, Connectivity 20%, Monitor 10%, Dimensions 10%, Audio 10%, Controls 10%, Misc 10%
    const weights = {
      emuPerformance: 0.3,
      connectivity: 0.2,
      monitor: 0.1,
      dimensions: 0.1,
      audio: 0.1,
      controls: 0.1,
      misc: 0.1,
    };

    const deviceScores = devices.map((device) => {
      let totalScore = 0;
      const name = device.name.sanitized;

      if (ranking.emuPerformance[0] === name) {
        totalScore += weights.emuPerformance * 10;
      } else if (ranking.emuPerformance[0] !== "equal") {
        totalScore += weights.emuPerformance * 5;
      }

      if (ranking.connectivity[0] === name) {
        totalScore += weights.connectivity * 10;
      } else if (ranking.connectivity[0] !== "equal") {
        totalScore += weights.connectivity * 5;
      }

      if (ranking.monitor[0] === name) totalScore += weights.monitor * 10;
      else if (ranking.monitor[0] !== "equal") {
        totalScore += weights.monitor * 5;
      }

      if (ranking.dimensions[0] === name) totalScore += weights.dimensions * 10;
      else if (ranking.dimensions[0] !== "equal") {
        totalScore += weights.dimensions * 5;
      }

      if (ranking.audio[0] === name) totalScore += weights.audio * 10;
      else if (ranking.audio[0] !== "equal") totalScore += weights.audio * 5;

      if (ranking.controls[0] === name) totalScore += weights.controls * 10;
      else if (ranking.controls[0] !== "equal") {
        totalScore += weights.controls * 5;
      }

      if (ranking.misc[0] === name) totalScore += weights.misc * 10;
      else if (ranking.misc[0] !== "equal") totalScore += weights.misc * 5;

      return { name, score: totalScore };
    });

    const ranked = deviceScores.sort((a, b) => b.score - a.score);

    if (
      ranked.length > 1 &&
      Math.abs(ranked[0].score - ranked[1].score) < 0.1
    ) {
      return ["equal"];
    }

    return ranked.map((d) => d.name);
  }
}
