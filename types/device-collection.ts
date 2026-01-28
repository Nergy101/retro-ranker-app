import { Device } from "./device.model";

export interface DeviceCollection {
  id: string;
  name: string;
  description?: string;
  type: string;
  order: number;
  created: string;
  updated: string;
  devices: Device[];
  deviceCount: number;
}
