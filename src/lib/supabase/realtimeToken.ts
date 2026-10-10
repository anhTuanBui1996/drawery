import { createPrivateKey, createSign } from "crypto";

export const REALTIME_TOKEN_TTL_SECONDS = 60 * 60;

const base64url = (input: string | Buffer) =>
  Buffer.from(input).toString("base64url");

// SUPABASE_JWT_PRIVATE_KEY: an ES256 private key in JWK form (JSON, with "kid"),
// imported into Supabase as a JWT signing key so Realtime accepts our tokens.
function loadSigningKey() {
  const raw = process.env.SUPABASE_JWT_PRIVATE_KEY;
  if (!raw) {
    throw new Error(
      'Invalid/Missing environment variable: "SUPABASE_JWT_PRIVATE_KEY"',
    );
  }
  const jwk = JSON.parse(raw);
  return { kid: jwk.kid as string, key: createPrivateKey({ key: jwk, format: "jwk" }) };
}

// Signs a Supabase-compatible ES256 JWT for the given (Mongo) user id.
// Realtime policies read the user from the "sub" claim.
export function signRealtimeToken(userId: string) {
  const { kid, key } = loadSigningKey();

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "ES256", typ: "JWT", kid }));
  const payload = base64url(
    JSON.stringify({
      aud: "authenticated",
      role: "authenticated",
      sub: userId,
      iat: now,
      exp: now + REALTIME_TOKEN_TTL_SECONDS,
    }),
  );
  const signature = createSign("SHA256")
    .update(`${header}.${payload}`)
    .sign({ key, dsaEncoding: "ieee-p1363" })
    .toString("base64url");

  return `${header}.${payload}.${signature}`;
}
