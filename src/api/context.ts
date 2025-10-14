import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";

const AUTH_URL = import.meta.env.VITE_BETTER_AUTH_URL;
export const createContext = async ({ req }: { req: Request }) => {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token)
      return {
        user: null,
      };
    const JWKS = createRemoteJWKSet(new URL(`${AUTH_URL}/api/auth/jwks`));
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: AUTH_URL, // Should match your JWT issuer, which is the BASE_URL
      audience: AUTH_URL, // Should match your JWT audience, which is the BASE_URL by default
    });

    return {
      user: z
        .object({
          id: z.string(),
          role: z.enum(["admin", "user"]),
        })
        .parse(payload),
    };
  } catch (error) {
    console.error("Token validation failed:");
    return {
      user: null,
    };
  }
};

export type Context = Awaited<ReturnType<typeof createContext>>;
