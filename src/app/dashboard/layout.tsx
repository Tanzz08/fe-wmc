"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@nextui-org/react";
import {
  LogOut,
  UserCircle,
  Users,
  CalendarDays,
  Activity,
  ClipboardList,
  ShieldCheck,
  FileText,
  PackageSearch,
  UserCog,
  Archive,
  Stethoscope,
} from "lucide-react";

// KITA GUNAKAN NEXT-AUTH, BUKAN LAGI COOKIES/JWT-DECODE MANUAL
import { useSession, signOut } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Mengambil data user yang sedang login dari NextAuth
  const { data: session, status } = useSession();

  // Layar loading saat NextAuth sedang memastikan sesi user
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-klinik-blue font-semibold">
        Memuat Data Sistem...
      </div>
    );
  }

  // Fungsi Keluar (Logout) yang otomatis membersihkan session & cookie
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  // ==========================================================
  // LOGIKA MENU DINAMIS (Berdasarkan Role dari NextAuth)
  // ==========================================================
  const isDokter = session?.user?.role === "DOKTER";
  const isAdmin = session?.user?.role === "SUPER_ADMIN";

  const menuResepsionis = [
    {
      name: "Pendaftaran Antrean",
      path: "/dashboard/resepsionis/antrean",
      icon: <CalendarDays size={20} />,
    },
    {
      name: "Master Pasien",
      path: "/dashboard/resepsionis/pasien",
      icon: <Users size={20} />,
    },
    {
      name: "Laporan Kunjungan",
      path: "/dashboard/resepsionis/laporan-antrean",
      icon: <FileText size={20} />,
    },
  ];

  const menuDokter = [
    {
      name: "Antrean Poli",
      path: "/dashboard/dokter/antrean",
      icon: <Activity size={20} />,
    },
    {
      name: "Rekam Medis",
      path: "/dashboard/dokter/rekam-medis",
      icon: <ClipboardList size={20} />,
    },
  ];

  const menuAdmin = [
    {
      name: "Manajemen Pegawai",
      path: "/dashboard/admin/users",
      icon: <UserCog size={20} />,
    },
    {
      name: "Master Pasien",
      path: "/dashboard/admin/pasien",
      icon: <Users size={20} />,
    },
    {
      name: "Master Perawat",
      path: "/dashboard/admin/perawat",
      icon: <Stethoscope size={20} />,
    },
    {
      name: "Master Obat",
      path: "/dashboard/admin/obat",
      icon: <PackageSearch size={20} />,
    },
    // <-- PERUBAHAN DI SINI: MENU DIPISAH JADI DUA
    {
      name: "Laporan Kunjungan",
      path: "/dashboard/admin/laporan",
      icon: <FileText size={20} />,
    },
    {
      name: "Arsip Rekam Medis",
      path: "/dashboard/admin/arsip-rm",
      icon: <Archive size={20} />,
    },
  ];

  // LOGIKA PENENTUAN MENU AKTIF
  let activeMenu = menuResepsionis; // Default
  if (isDokter) activeMenu = menuDokter;
  if (isAdmin) activeMenu = menuAdmin;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-klinik-blue text-white p-4 flex flex-col md:min-h-screen shrink-0 print:hidden shadow-xl z-10">
        <div className="font-bold text-xl mb-8 text-center md:text-left flex items-center gap-2">
          <ShieldCheck size={28} /> Klinik WMC
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <p className="text-xs text-slate-300 mb-2 font-semibold uppercase tracking-wider">
            Menu {isDokter ? "Dokter" : isAdmin ? "Admin" : "Resepsionis"}
          </p>

          {/* Render Menu Otomatis */}
          {activeMenu.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? "bg-white/20 font-semibold shadow-inner"
                      : "hover:bg-white/10"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <Button
          onPress={handleLogout}
          color="danger"
          variant="flat"
          className="w-full bg-white/10 text-white mt-auto hover:bg-red-500/20 transition-all"
          startContent={<LogOut size={18} />}
        >
          Keluar
        </Button>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 flex flex-col w-full min-w-0">
        {/* NAVBAR ATAS */}
        <header className="h-16 bg-white border-b flex items-center justify-end px-6 shadow-sm print:hidden">
          <div className="flex items-center gap-3 text-slate-600">
            <div className="text-right">
              {/* Mengambil nama dan role langsung dari Session NextAuth */}
              <p className="font-bold text-sm text-slate-800 capitalize">
                {session?.user?.username || "Memuat..."}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {session?.user?.role?.toLowerCase() || ""}
              </p>
            </div>
            <UserCircle
              size={36}
              className="text-klinik-blue bg-blue-100 p-1 rounded-full"
            />
          </div>
        </header>

        {/* AREA RENDER HALAMAN ANAK */}
        <div className="p-4 md:p-6 flex-1 overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
}
