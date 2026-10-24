export function runPipeline(fetchItem, processItem) {
  return fetchItem().then((item) => {
    return processItem(item).then((res) => {
      return { success: true, result: res };
    });
  });
}
