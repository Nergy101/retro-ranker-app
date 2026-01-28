import {
  createPocketBaseService,
  PocketBaseService,
} from "../pocketbase/pocketbase.service";
import { Device } from "../../types/device.model";
import { TagModel } from "../../types/tag.model";
import AsyncStorage from "@react-native-async-storage/async-storage";

const POCKETBASE_URL =
  process.env.EXPO_PUBLIC_POCKETBASE_URL ||
  "https://pocketbase.retroranker.site";

const personalPicks: string[] = [
  "rg-477m",
  "thor",
  "switch-2",
  "steam-deck-oled",
  "retroid-pocket-flip-2",
  "miyoo-flip",
  "gkd-pixel-2",
  "miyoo-mini-plus",
];

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
 * Gets the best available image URL for a device
 */
export function getDeviceImageUrl(device: Device): string {
  if (device.image?.pocketbaseUrl) {
    return device.image.pocketbaseUrl;
  }
  if (device.image?.webpUrl) {
    return device.image.webpUrl;
  }
  return "https://via.placeholder.com/300x300?text=No+Image";
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

export class DeviceService {
  private pocketBaseService: PocketBaseService;
  private static instance: DeviceService | null = null;
  private devicesCache: { data: Device[]; timestamp: number } | null = null;
  private tagsCache: { data: TagModel[]; timestamp: number } | null = null;
  private readonly cacheDurationMs = 30 * 60 * 1000; // 30 minutes
  private readonly tagsCacheDurationMs = 24 * 60 * 60 * 1000; // 24 hours for tags
  private readonly TAGS_CACHE_KEY = "device_tags_cache";

  private constructor(pocketBaseService: PocketBaseService) {
    this.pocketBaseService = pocketBaseService;
  }

  public static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      const pbService = createPocketBaseService();
      DeviceService.instance = new DeviceService(pbService);
    }
    return DeviceService.instance;
  }

  public async getAllDevices(forceRefresh = false): Promise<Device[]> {
    const now = Date.now();
    if (
      !forceRefresh &&
      this.devicesCache &&
      now - this.devicesCache.timestamp < this.cacheDurationMs
    ) {
      return this.devicesCache.data;
    }

    const rawDevices = await this.pocketBaseService.getAll("devices");
    const data = rawDevices
      .filter((device) => device.archived !== true)
      .map((device) => enhanceDeviceWithImageUrl(device));

    this.devicesCache = { data, timestamp: now };
    return data;
  }

  public async getAllTags(forceRefresh = false): Promise<TagModel[]> {
    const now = Date.now();

    // Check in-memory cache first (fastest)
    if (
      !forceRefresh &&
      this.tagsCache &&
      now - this.tagsCache.timestamp < this.cacheDurationMs
    ) {
      return this.tagsCache.data;
    }

    // Check AsyncStorage cache (persistent across app restarts)
    if (!forceRefresh) {
      try {
        const cachedData = await AsyncStorage.getItem(this.TAGS_CACHE_KEY);
        if (cachedData) {
          const parsed = JSON.parse(cachedData) as {
            data: TagModel[];
            timestamp: number;
          };
          if (now - parsed.timestamp < this.tagsCacheDurationMs) {
            // Update in-memory cache for faster access
            this.tagsCache = parsed;
            return parsed.data;
          }
        }
      } catch (error) {
        console.error("Error reading tags from AsyncStorage cache:", error);
        // Continue to fetch from API if cache read fails
      }
    }

    // Fetch from API
    const data = await this.pocketBaseService.getAll("tags");
    const cacheEntry = { data, timestamp: now };

    // Update in-memory cache
    this.tagsCache = cacheEntry;

    // Save to AsyncStorage for persistence
    try {
      await AsyncStorage.setItem(
        this.TAGS_CACHE_KEY,
        JSON.stringify(cacheEntry),
      );
    } catch (error) {
      console.error("Error saving tags to AsyncStorage cache:", error);
      // Don't fail if cache save fails
    }

    return data;
  }

  public async searchDevices(
    query: string = "",
    category: "all" | "low" | "mid" | "high" = "all",
    sortBy:
      | "all"
      | "highly-ranked"
      | "new-arrivals"
      | "high-low-price"
      | "low-high-price"
      | "alphabetical"
      | "reverse-alphabetical" = "all",
    filter: "all" | "upcoming" | "personal-picks" = "all",
    tags: TagModel[] = [],
    pageNumber: number = 1,
    pageSize: number = 9,
  ): Promise<{ page: Device[]; totalAmountOfResults: number }> {
    const lowerQuery = query.toLowerCase();
    let filterString = "";

    // Build filter string based on category
    if (category !== "all") {
      filterString += `deviceData.pricing.category = "${category}"`;
    }

    // Add search query filter
    if (query) {
      if (filterString) filterString += " && ";
      filterString += `(deviceData.name.sanitized ~ "${lowerQuery}" || deviceData.name.raw ~ "${lowerQuery}" || deviceData.brand.raw ~ "${lowerQuery}" || deviceData.os.raw ~ "${lowerQuery}")`;
    }

    // Add filter for upcoming devices
    if (filter === "upcoming") {
      if (filterString) filterString += " && ";
      filterString += `deviceData.released.raw ~ "upcoming"`;
    }

    // Add filter for personal picks
    if (filter === "personal-picks") {
      if (filterString) filterString += " && ";
      filterString += personalPicks
        .map((pick) => `id = "${pick}"`)
        .join(" || ");
    }

    // Add tag filters
    if (tags.length > 0) {
      if (filterString) filterString += " && ";
      filterString += `(${tags.map((tag) => `tags~"${tag.id}"`).join(" && ")})`;
    }

    // Add archived filter
    if (filterString) filterString += " && ";
    filterString += "archived != true";

    // Build sort string
    let sortString = "";
    switch (sortBy) {
      case "new-arrivals":
        sortString = "-deviceData.released.mentionedDate";
        break;
      case "highly-ranked":
        sortString = "-totalRating";
        break;
      case "alphabetical":
        sortString = "deviceData.name.raw";
        break;
      case "reverse-alphabetical":
        sortString = "-deviceData.name.raw";
        break;
      case "high-low-price":
        sortString = "-deviceData.pricing.average";
        break;
      case "low-high-price":
        sortString = "deviceData.pricing.average";
        break;
      default:
        sortString = "-deviceData.released.mentionedDate";
    }

    const result = await this.pocketBaseService.getList(
      "devices",
      pageNumber,
      pageSize,
      {
        filter: filterString,
        sort: sortString,
        expand: "",
      },
    );

    return {
      page: result.items.map((device) => enhanceDeviceWithImageUrl(device)),
      totalAmountOfResults: result.totalItems,
    };
  }

  public async getDeviceByName(sanitizedName: string): Promise<Device | null> {
    const cached = await this.getAllDevices();
    const found = cached.find((d) => d.name.sanitized === sanitizedName);
    if (found) return found;

    const result = await this.pocketBaseService.getList("devices", 1, 1, {
      filter: `deviceData.name.sanitized = "${sanitizedName}" && archived != true`,
      sort: "",
      expand: "",
    });
    const rawDevice = result.items[0];
    if (!rawDevice) return null;

    const device = enhanceDeviceWithImageUrl(rawDevice);
    const now = Date.now();
    // merge into cache if exists
    const devices = cached
      .concat(device)
      .filter(
        (d, idx, arr) =>
          arr.findIndex((e) => e.name.sanitized === d.name.sanitized) === idx,
      );
    this.devicesCache = { data: devices, timestamp: now };
    return device;
  }

  public async getSimilarDevices(
    sanitizedName: string | null,
    limit: number = 4,
  ): Promise<Device[]> {
    if (!sanitizedName) return [];

    const currentDevice = await this.getDeviceByName(sanitizedName);
    if (!currentDevice) return [];

    const allDevices = await this.getAllDevices();
    // Simple similarity based on same category and brand
    return allDevices
      .filter(
        (device) =>
          device.name.sanitized !== sanitizedName && device.archived !== true,
      )
      .filter((device) => {
        // Same brand or same price category
        return (
          device.brand.sanitized === currentDevice.brand.sanitized ||
          device.pricing.category === currentDevice.pricing.category
        );
      })
      .slice(0, limit);
  }

  public async getPersonalPicks(amount: number = 4): Promise<Device[]> {
    const personalPickTag = await this.getTagBySlug("personal-pick");
    if (!personalPickTag) return [];

    const result = await this.pocketBaseService.getList("devices", 1, amount, {
      filter: `tags~"${personalPickTag.id}" && archived != true`,
      sort: "-deviceData.released.mentionedDate",
      expand: "",
    });
    return result.items.map((device) => enhanceDeviceWithImageUrl(device));
  }

  public async getNewArrivals(amount: number = 4): Promise<Device[]> {
    const result = await this.pocketBaseService.getList("devices", 1, amount, {
      filter: "archived != true",
      sort: "-deviceData.released.mentionedDate",
      expand: "",
    });
    return result.items.map((device) => enhanceDeviceWithImageUrl(device));
  }

  public async getUpcoming(amount: number = 5): Promise<Device[]> {
    // const allUpcomingResult = await this.pocketBaseService.getList(
    //   "devices",
    //   1,
    //   100,
    //   {
    //     filter: `deviceData.released ~ 'upcoming' && archived != true`,
    //     sort: "",
    //     expand: "",
    //   },
    // );

    // const allUpcomingDevices = allUpcomingResult.items.map((device) =>
    //   enhanceDeviceWithImageUrl(device),
    // );

    // const handheldDevices = allUpcomingDevices
    //   .filter((d) => d.deviceType === "handheld")
    //   .sort((a, b) => a.index - b.index);

    // const oemDevices = allUpcomingDevices
    //   .filter((d) => d.deviceType === "oem")
    //   .sort((a, b) => a.index - b.index);

    // const selectedHandhelds = handheldDevices.slice(0, 3);
    // const selectedOEMs = oemDevices.slice(0, 2);

    // let remainingSlots =
    //   amount - selectedHandhelds.length - selectedOEMs.length;
    // let additionalHandhelds: Device[] = [];
    // let additionalOEMs: Device[] = [];

    // if (remainingSlots > 0) {
    //   if (selectedHandhelds.length < handheldDevices.length) {
    //     const handheldsNeeded = Math.min(
    //       remainingSlots,
    //       handheldDevices.length - selectedHandhelds.length,
    //     );
    //     additionalHandhelds = handheldDevices.slice(
    //       selectedHandhelds.length,
    //       selectedHandhelds.length + handheldsNeeded,
    //     );
    //     remainingSlots -= handheldsNeeded;
    //   }

    //   if (remainingSlots > 0 && selectedOEMs.length < oemDevices.length) {
    //     const oemsNeeded = Math.min(
    //       remainingSlots,
    //       oemDevices.length - selectedOEMs.length,
    //     );
    //     additionalOEMs = oemDevices.slice(
    //       selectedOEMs.length,
    //       selectedOEMs.length + oemsNeeded,
    //     );
    //   }
    // }

    // return [
    //   ...selectedHandhelds,
    //   ...additionalHandhelds,
    //   ...selectedOEMs,
    //   ...additionalOEMs,
    // ];

    return [];
  }

  public async getBangForYourBuck(): Promise<Device[]> {
    const baseFilter = `totalRating > 0 && deviceData.released.raw !~ "upcoming" && deviceData.deviceType = "handheld" && archived != true`;

    const [sweetSpotResult, midResult] = await Promise.all([
      this.pocketBaseService.getList("devices", 1, 3, {
        filter: `${baseFilter} && deviceData.pricing.average >= 100 && deviceData.pricing.average <= 200`,
        sort: "-deviceData.released.mentionedDate,-totalRating",
        expand: "",
      }),
      this.pocketBaseService.getList("devices", 1, 5, {
        filter: `${baseFilter} && deviceData.pricing.average > 200 && deviceData.pricing.average <= 500`,
        sort: "-deviceData.released.mentionedDate,-totalRating",
        expand: "",
      }),
    ]);

    return [
      ...sweetSpotResult.items.map((d) => enhanceDeviceWithImageUrl(d)),
      ...midResult.items.map((d) => enhanceDeviceWithImageUrl(d)),
    ];
  }

  public async getTagBySlug(tagSlug: string): Promise<TagModel | null> {
    const tags = await this.getAllTags();
    const found = tags.find((t) => t.slug === tagSlug);
    if (found) return found;

    const result = await this.pocketBaseService.getList("tags", 1, 1, {
      filter: `slug = "${tagSlug}"`,
      sort: "",
      expand: "",
    });
    const tag = result.items[0] || null;
    if (tag) {
      const now = Date.now();
      const tagsMerged = tags
        .concat(tag)
        .filter((t, i, arr) => arr.findIndex((e) => e.id === t.id) === i);
      const cacheEntry = { data: tagsMerged, timestamp: now };

      // Update in-memory cache
      this.tagsCache = cacheEntry;

      // Update AsyncStorage cache
      try {
        await AsyncStorage.setItem(
          this.TAGS_CACHE_KEY,
          JSON.stringify(cacheEntry),
        );
      } catch (error) {
        console.error("Error saving tags to AsyncStorage cache:", error);
      }
    }
    return tag;
  }
}
