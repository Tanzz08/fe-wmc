import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";

// 1. KITA BUAT INTERFACE UNTUK MENGHINDARI 'any'
interface BackendTokenPayload {
  id: number | string;
  username: string;
  role: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

          const res = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials?.username,
              password: credentials?.password,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Username atau password salah");
          }

          if (data.token) {
            // 2. KITA GUNAKAN INTERFACE DI SINI (BUKAN any)
            const decoded = jwtDecode<BackendTokenPayload>(data.token);

            return {
              id: decoded.id.toString(),
              username: decoded.username,
              role: decoded.role.toUpperCase(),
              token: data.token,
            };
          }

          return null;
        } catch (error: unknown) {
          // 3. UBAH 'any' MENJADI 'unknown'
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error("Terjadi kesalahan jaringan.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.token = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.token = token.token;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || "rahasia-klinik-wmc-super-aman-123",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
