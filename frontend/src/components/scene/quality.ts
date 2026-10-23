"use client";

import { useSyncExternalStore } from "react";
export type Quality = "low" | "medium" | "high";
export const quality = {
  low: { webgl: false, maxDpr: 1, particles: 0, pointer: false },
  medium: { webgl: true, maxDpr: 1.25, particles: 0, pointer: true },
  high: { webgl: true, maxDpr: 1.75, particles: 18, pointer: true },
} as const;
export const performanceBudget = { targetFps: 60, sceneDelayMs: 1600 };
type Device = Navigator & { deviceMemory?: number; connection?: EventTarget & { saveData?: boolean } };
let level: Quality = "low";
const listeners = new Set<() => void>();
export function setQuality(value: Quality) {
  if (level === value) return;
  level = value;
  document.documentElement.dataset.quality = value;
  listeners.forEach((listener) => listener());
}
export function detectQuality(): Quality {
  const device = navigator as Device;
  if (window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 1023px), (pointer: coarse)").matches || device.connection?.saveData ||
      (device.deviceMemory !== undefined && device.deviceMemory <= 4) || (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2)) return "low";
  return window.innerWidth < 1100 || (device.hardwareConcurrency > 0 && device.hardwareConcurrency < 8) ? "medium" : "high";
}
export const getQuality = () => level;
const getServer = (): Quality => "low";
export function subscribeQuality(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export const useQuality = () => useSyncExternalStore(subscribeQuality, getQuality, getServer);
