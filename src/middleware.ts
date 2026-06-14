import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const role = req.nextauth.token?.role;

    // 1. Aturan untuk Admin
    if (path.startsWith("/dashboard/admin") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // 2. Aturan untuk Resepsionis
    if (
      path.startsWith("/dashboard/resepsionis") &&
      role !== "RESEPSIONIS" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // 3. Aturan untuk Dokter
    if (
      path.startsWith("/dashboard/dokter") &&
      role !== "DOKTER" &&
      role !== "SUPER_ADMIN"
    ) {
      // BERIKAN IZIN KHUSUS:
      // Jika dia Resepsionis DAN URL-nya untuk mencetak (mengandung kata "/cetak"), biarkan lewat.
      if (role === "RESEPSIONIS" && path.includes("/cetak")) {
        // Do nothing (biarkan lolos)
      } else {
        // Selain itu, tendang ke login
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
    // 4. Aturan untuk Apoteker
    if (
      path.startsWith("/dashboard/apoteker") &&
      role !== "APOTEKER" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

// ==========================================================
// TAMBAHKAN BARIS INI UNTUK MENCEGAH INFINITE REDIRECT
// ==========================================================
export const config = {
  // Hanya jalankan middleware ini pada rute yang ada di dalam /dashboard
  // Jangan jalankan di /login, /api/auth, atau file statis
  matcher: ["/dashboard/:path*"],
};
