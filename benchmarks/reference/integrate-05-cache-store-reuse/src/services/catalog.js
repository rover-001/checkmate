import { getOrSet } from "../cache/store.js";

export async function getCatalogItem(id, loaderFn) {
  return getOrSet("item:" + id, 30000, loaderFn);
}
