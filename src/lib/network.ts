const STITCH_HOST = process.env.STITCH_HOST || "https://stitch.googleapis.com";

export async function isOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${STITCH_HOST}/mcp`, {
      method: "HEAD",
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export async function waitForOnline(maxWaitMs = 30000): Promise<boolean> {
  const start = Date.now();
  
  while (Date.now() - start < maxWaitMs) {
    if (await isOnline()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  
  return false;
}
