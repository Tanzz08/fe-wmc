import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  // Memperluas tipe Session agar memiliki token dan role
  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      token: string;
    } & DefaultSession["user"];
  }

  // Memperluas tipe User bawaan
  interface User {
    id: string;
    username: string;
    role: string;
    token: string;
  }
}

declare module "next-auth/jwt" {
  // Memperluas tipe JWT agar bisa menyimpan token dari backend Express
  interface JWT {
    id: string;
    username: string;
    role: string;
    token: string;
  }
}
