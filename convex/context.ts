import { jwtVerify, createRemoteJWKSet } from "jose";

const AUTH_URL = process.env.VITE_BETTER_AUTH_URL;

async function validateToken(token: string) {
  try {
    const JWKS = createRemoteJWKSet(new URL(`${AUTH_URL}/api/auth/jwks`));
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: AUTH_URL, // Should match your JWT issuer, which is the BASE_URL
      audience: AUTH_URL, // Should match your JWT audience, which is the BASE_URL by default
    });
    return payload;
  } catch (error) {
    console.error("Token validation failed:");
    return null;
  }
}

export const getAuthUser = async (token: string) => {
  const payload = await validateToken(token);
  return payload;
};

export const verifyAuthAdminUser = async (token: string) => {
  const payload = await validateToken(token);
  if (!payload || payload.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return payload;
};
