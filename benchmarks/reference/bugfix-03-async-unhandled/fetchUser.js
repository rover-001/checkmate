export async function fetchUserData(fetcher) {
  try {
    const data = await fetcher();
    return { status: "ok", data };
  } catch (err) {
    return { error: err.message };
  }
}
