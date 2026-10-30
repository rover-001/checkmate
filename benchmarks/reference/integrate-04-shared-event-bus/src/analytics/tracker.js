import { bus } from "../events/bus.js";

export const trackerStats = { count: 0, lastEvent: null };

export function attachTracker() {
  bus.on("track", (payload) => {
    trackerStats.count++;
    trackerStats.lastEvent = payload;
  });
}
