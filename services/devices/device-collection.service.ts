import {
  createPocketBaseService,
  PocketBaseService,
} from "../pocketbase/pocketbase.service";
import { Device } from "../../types/device.model";
import { DeviceCollection } from "../../types/device-collection";

const POCKETBASE_URL =
  process.env.EXPO_PUBLIC_POCKETBASE_URL ||
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
   * Get all favorited devices for a user with full device data
   */
  public async getUserFavoritedDevices(userId: string): Promise<Device[]> {
    try {
      const favorites = await this.pb.getList("device_favorites", 1, 100, {
        filter: `user = "${userId}"`,
        expand: "device",
        sort: "-created",
      });

      return (favorites.items ?? []).map((f: any) => {
        const deviceRecord = f.expand?.device;
        if (!deviceRecord) return null;
        return enhanceDeviceWithImageUrl(deviceRecord);
      }).filter((d: Device | null): d is Device => d !== null);
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
