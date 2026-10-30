interface DatabaseEnvironment { [key: string]: string | undefined; DATABASE_URL?: string; DIRECT_URL?: string }

/** Keep secrets out of diagnostics; this helper only returns server-side URLs. */
export function databaseUrls(env: DatabaseEnvironment) {
  const runtime = env.DATABASE_URL?.trim() || env.DIRECT_URL?.trim();
  if (!runtime) return null;
  let direct = env.DIRECT_URL?.trim() || runtime;
  try {
    const url = new URL(direct);
    if (url.hostname.endsWith(".neon.tech")) {
      url.hostname = url.hostname.replace("-pooler.", ".");
      direct = url.toString();
    }
  } catch {
    // Prisma provides connection validation; never include the URL in our errors.
  }
  return { runtime, direct };
}
