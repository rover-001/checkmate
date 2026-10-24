export async function runPipeline(fetchItem, processItem) {
  const item = await fetchItem();
  const result = await processItem(item);
  return { success: true, result };
}
