import { withAuth } from "next-auth/middleware";

// Satpam ini akan memastikan hanya user yang memiliki token NextAuth yang bisa masuk
export default withAuth({
  pages: {
    signIn: "/login", // Jika belum login, tendang ke sini
  },
});

// Daftarkan folder/rute mana saja yang mau dijaga ketat oleh satpam
export const config = {
  matcher: [
    "/dashboard/:path*", // Melindungi semua isi di dalam folder dashboard
  ],
};
