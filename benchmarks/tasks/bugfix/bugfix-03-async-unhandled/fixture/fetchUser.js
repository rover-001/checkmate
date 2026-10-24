export async function fetchUserData(fetcher) {
  fetcher();
  return { status: "ok" };
}
