// lib/ratelimit.ts — Rate limiting léger (Upstash REST si configuré, no-op sinon)
//
// Pas de dépendance npm pour rester portable. Si UPSTASH_REDIS_REST_URL et
// UPSTASH_REDIS_REST_TOKEN sont définies, on appelle directement l'API REST
// pour faire un INCR + EXPIRE atomique. Sinon, on log un warning et on laisse
// passer — préférable à un faux sentiment de protection avec une map mémoire
// qui ne survit pas aux cold starts de Vercel.
//
// À configurer avant la mise en prod publique des endpoints à risque :
//   - /api/kyc/[token] POST  (soumission KYC publique)
//   - /api/upload      POST  (upload de pièce, ouvert via token KYC)
//
// Pour Upstash → docs : https://upstash.com/docs/redis/features/restapi

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Si bloqué, secondes restantes avant reset. */
  retryAfter: number;
}

/** Identifie la source d'une requête. Fallback "anonymous" si rien ne sort. */
export function ipFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anonymous";
}

/**
 * Token bucket atomique sur Upstash. Permet `limit` requêtes par fenêtre
 * `windowSec` (sliding via INCR + EXPIRE seulement sur le premier hit).
 *
 * Si Upstash n'est pas configuré, retourne { ok: true } et log une fois par
 * démarrage de process pour signaler la faille de protection.
 */
let warned = false;
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    if (!warned) {
      console.warn(
        "[ratelimit] UPSTASH_REDIS_REST_URL/_TOKEN absent — rate limiting désactivé. " +
          "Configurer Upstash avant exposition prod des endpoints publics.",
      );
      warned = true;
    }
    return { ok: true, remaining: limit, retryAfter: 0 };
  }

  const k = `rl:${key}`;
  try {
    // pipeline atomique : INCR puis EXPIRE (NX = uniquement si pas déjà setté)
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", k],
        ["EXPIRE", k, String(windowSec), "NX"],
        ["TTL", k],
      ]),
    });
    if (!res.ok) {
      console.error("[ratelimit] upstash HTTP", res.status);
      return { ok: true, remaining: limit, retryAfter: 0 }; // fail-open
    }
    const data = (await res.json()) as Array<{ result: number }>;
    const count = data[0]?.result ?? 0;
    const ttl = data[2]?.result ?? windowSec;

    if (count > limit) {
      return { ok: false, remaining: 0, retryAfter: Math.max(1, ttl) };
    }
    return { ok: true, remaining: Math.max(0, limit - count), retryAfter: 0 };
  } catch (e) {
    console.error("[ratelimit] upstash error:", e);
    return { ok: true, remaining: limit, retryAfter: 0 }; // fail-open
  }
}

/** Helper : applique un rate limit et renvoie une Response 429 si bloqué. */
export async function enforceRateLimit(params: {
  key: string;
  limit: number;
  windowSec: number;
}): Promise<Response | null> {
  const r = await rateLimit(params.key, params.limit, params.windowSec);
  if (r.ok) return null;
  return new Response(
    JSON.stringify({ error: "Trop de requêtes, réessayez plus tard." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(r.retryAfter),
      },
    },
  );
}
