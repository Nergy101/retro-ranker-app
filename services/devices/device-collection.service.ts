import {
  createPocketBaseService,
  PocketBaseService,
} from "../pocketbase/pocketbase.service";
import { Device } from "../../types/device.model";
import { DeviceCollection } from "../../types/device-collection";

const POCKETBASE_URL = process.env.EXPO_PUBLIC_POCKETBASE_URL ||
  "https://pocketbase.retroranker.site";

/**
 * Constructs the full PocketBase file URL for a device image
 */
function getPocketBaseImageUrl(
  recordId: string,
  filename: string | null | undefined,
): string | null {
  if (!filename) return null;
  return `${POCKETBASE_URL}/api/files/devices/${recordId}/${filename}`;
}

/**
 * Enhances a raw PocketBase device record with the PocketBase image URL
 */
function enhanceDeviceWithImageUrl(rawDevice: any): Device {
  const deviceData = rawDevice.deviceData as Device;
  if (rawDevice.deviceMainImage && deviceData.image) {
    deviceData.image.pocketbaseUrl = getPocketBaseImageUrl(
      rawDevice.id,
      rawDevice.deviceMainImage,
    );
  }
  return deviceData;
}

export class DeviceCollectionService {
  private pb: PocketBaseService;
  private static instance: DeviceCollectionService | null = null;

  private constructor() {
    this.pb = createPocketBaseService();
  }

  public static getInstance(): DeviceCollectionService {
    if (!DeviceCollectionService.instance) {
      DeviceCollectionService.instance = new DeviceCollectionService();
    }
    return DeviceCollectionService.instance;
  }

  /**
   * Get favorited device IDs for a user (lightweight, for UI state)
   */
  public async getUserFavoritedDeviceIds(userId: string): Promise<string[]> {
    try {
      const favorites = await this.pb.getList("device_favorites", 1, 500, {
        filter: `user = "${userId}"`,
        expand: "device",
        sort: "-created",
      });

      return (favorites.items ?? [])
        .map((f: any) => f.expand?.device?.deviceData?.id as string | undefined)
        .filter((id): id is string => id != null);
    } catch (error) {
      console.error("Failed to fetch user favorited device IDs:", error);
      return [];
    }
  }

  /**
   * Add a device to the user's favorites. deviceId is the app device id (name.sanitized).
   */
  public async addFavorite(userId: string, deviceId: string): Promise<void> {
    const deviceRecord = await this.getDevicesRecordIdByAppId(deviceId);
    if (!deviceRecord) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    await this.pb.create("device_favorites", {
      user: userId,
      device: deviceRecord,
    });
  }

  /**
   * Remove a device from the user's favorites. deviceId is the app device id (name.sanitized).
   */
  public async removeFavorite(userId: string, deviceId: string): Promise<void> {
    const favorites = await this.pb.getList("device_favorites", 1, 500, {
      filter: `user = "${userId}"`,
      expand: "device",
    });
    const favorite = (favorites.items ?? []).find(
      (f: any) => f.expand?.device?.deviceData?.id === deviceId,
    );
    if (favorite) {
      await this.pb.delete("device_favorites", favorite.id);
    }
  }

  /**
   * Get PocketBase "devices" collection record id for an app device id (name.sanitized).
   */
  private async getDevicesRecordIdByAppId(
    deviceId: string,
  ): Promise<string | null> {
    const result = await this.pb.getList("devices", 1, 1, {
      filter: `deviceData.name.sanitized = "${deviceId}" && archived != true`,
    });
    const item = result.items?.[0];
    return item?.id ?? null;
  }

  /**
   * Get all favorited devices for a user with full device data
   */
  public async getUserFavoritedDevices(userId: string): Promise<Device[]> {
    try {
      const favorites = await this.pb.getList("device_favorites", 1, 100, {
        filter: `user = "${userId}"`,
        expand: "device",
        sort: "-created",
      });

      return (favorites.items ?? [])
        .map((f: any) => {
          const deviceRecord = f.expand?.device;
          if (!deviceRecord) return null;
          return enhanceDeviceWithImageUrl(deviceRecord);
        })
        .filter((d: Device | null): d is Device => d !== null);
    } catch (error) {
      console.error("Failed to fetch user favorited devices:", error);
      return [];
    }
  }

  /**
   * Get all device collections for a user with full device data
   */
  public async getUserDeviceCollections(
    userId: string,
  ): Promise<DeviceCollection[]> {
    try {
      const collections = await this.pb.getList("device_collections", 1, 100, {
        filter: `owner = "${userId}"`,
        expand: "devices,owner",
        sort: "-created",
      });

      return (collections.items ?? []).map((c: any) => {
        const devices = (c.expand?.devices ?? []).map((de: any) => {
          return enhanceDeviceWithImageUrl(de);
        });

        return {
          id: c.id,
          name: c.name,
          description: c.description,
          type: c.type,
          order: c.order,
          created: c.created,
          updated: c.updated,
          devices,
          deviceCount: devices.length,
        };
      });
    } catch (error) {
      console.error("Failed to fetch user device collections:", error);
      return [];
    }
  }
}
