import type { Screen } from "@google/stitch-sdk";
import { logger } from "./logger.js";

export async function resolveHtml(screen: Screen): Promise<string> {
  const raw = await screen.getHtml();
  if (!raw) {
    logger.warn({ screenId: screen.screenId }, "Stitch screen returned empty HTML");
    return "<div></div>";
  }
  if (raw.startsWith("http")) {
    try {
      const resp = await fetch(raw, { signal: AbortSignal.timeout(15000) });
      if (!resp.ok) {
        logger.warn(
          { screenId: screen.screenId, url: raw, status: resp.status },
          "Stitch screen HTML fetch returned non-OK status"
        );
        return "<div></div>";
      }
      return await resp.text();
    } catch (err) {
      logger.warn(
        { screenId: screen.screenId, url: raw, error: err instanceof Error ? err.message : String(err) },
        "Stitch screen HTML fetch failed"
      );
      return "<div></div>";
    }
  }
  return raw;
}
