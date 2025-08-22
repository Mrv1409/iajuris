// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";//eslint-disable-next-line
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      slug: string;
      cidade: string;
      especialidades: string[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    slug: string;
    cidade: string;
    especialidades: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    slug: string;
    cidade: string;
    especialidades: string[];
  }
}