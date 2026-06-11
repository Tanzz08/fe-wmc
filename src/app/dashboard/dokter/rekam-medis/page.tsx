"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Chip,
  Spinner,
} from "@nextui-org/react";
import { Search, Eye } from "lucide-react";
import api from "@/lib/axios";

// =========================================================================
// 1. INTERFACE TYPESCRIPT
// =========================================================================
interface RekamMedis {
  id_pemeriksaan: number;
  nopen: string;
  id_rm: string;
  waktu_periksa: string;
  diagnosis_utama: string | null;
  pasien: { nama: string };
  dokter: { username: string };
  safeKey?: string; // Fallback key anti-error untuk NextUI Table
}

// =========================================================================
// 2. KOMPONEN UTAMA
// =========================================================================
export default function MasterRekamMedisPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Mengambil semua data rekam medis dari backend menggunakan React Query
  const { data: listRM = [], isLoading } = useQuery<RekamMedis[]>({
    queryKey: ["rekamMedisList"],
    queryFn: async () => {
      try {
        const res = await api.get("/rekam-medis");
        const fetchedData = res.data?.data || res.data;
        const safeData = Array.isArray(fetchedData) ? fetchedData : [];

        // Memetakan data dengan safeKey agar tabel NextUI 100% stabil
        return safeData.map((item, index) => ({
          ...item,
          safeKey: item.nopen || `fallback-rm-${index}`,
        }));
      } catch (error) {
        console.error("Gagal menarik data arsip rekam medis", error);
        return [];
      }
    },
  });

  // Fitur Live Search: Filter berdasarkan Nama atau ID RM
  const filteredRM = listRM.filter((rm) => {
    const query = searchQuery.toLowerCase();
    const namaPasien = rm.pasien?.nama?.toLowerCase() || "";
    const idRm = rm.id_rm?.toLowerCase() || "";

    return namaPasien.includes(query) || idRm.includes(query);
  });

  // =========================================================================
  // 3. RENDER UI
  // =========================================================================
  return (
    <div className="flex flex-col gap-6">
      {/* HEADER & PENCARIAN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Arsip Rekam Medis
          </h1>
          <p className="text-sm text-slate-500">
            Lacak riwayat pemeriksaan dan ringkasan pulang pasien sebelumnya.
          </p>
        </div>

        <Input
          isClearable
          className="w-full sm:max-w-[300px]"
          placeholder="Cari Nama Pasien atau ID RM..."
          startContent={<Search size={18} className="text-slate-400" />}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
      </div>

      {/* TABEL DATA REKAM MEDIS */}
      <Table aria-label="Tabel Riwayat Rekam Medis" className="shadow-sm">
        <TableHeader>
          <TableColumn>TANGGAL PERIKSA</TableColumn>
          <TableColumn>ID RM</TableColumn>
          <TableColumn>NAMA PASIEN</TableColumn>
          <TableColumn>DIAGNOSIS UTAMA</TableColumn>
          <TableColumn>DOKTER</TableColumn>
          <TableColumn>AKSI</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            isLoading ? (
              <div className="flex justify-center p-4">
                <Spinner
                  size="md"
                  color="primary"
                  label="Memuat arsip data..."
                />
              </div>
            ) : (
              "Tidak ada data rekam medis yang ditemukan."
            )
          }
          items={filteredRM}
        >
          {(rm) => (
            <TableRow key={rm.safeKey}>
              <TableCell className="font-medium text-slate-600">
                {new Date(rm.waktu_periksa).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell className="font-semibold">{rm.id_rm}</TableCell>
              <TableCell className="font-bold text-slate-800">
                {rm.pasien?.nama}
              </TableCell>
              <TableCell>
                {rm.diagnosis_utama ? (
                  <Chip size="sm" variant="flat" color="secondary">
                    {rm.diagnosis_utama}
                  </Chip>
                ) : (
                  <span className="text-slate-400 italic text-xs">
                    Tidak ada
                  </span>
                )}
              </TableCell>
              <TableCell>{rm.dokter?.username}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<Eye size={16} />}
                  onPress={() =>
                    router.push(`/dashboard/dokter/rekam-medis/${rm.nopen}`)
                  }
                >
                  Lihat Detail
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
