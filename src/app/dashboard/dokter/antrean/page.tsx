"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Card,
  CardBody,
} from "@nextui-org/react";
import { Play, CheckCircle2, Clock, UserCheck } from "lucide-react";
import api from "@/lib/axios";

// =========================================================================
// 1. TIPE DATA (INTERFACES)
// =========================================================================
interface Pasien {
  id_rm: string;
  nama: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
}

interface Antrean {
  nopen: string;
  id_rm: string;
  status_pasien: string;
  unit_pelayanan: string;
  cara_bayar: string;
  status_antrean: string;
  tgl_registrasi: string;
  pasien: Pasien;
  safeKey?: string; // Kunci cadangan untuk mencegah error tabel
}

// =========================================================================
// 2. KOMPONEN UTAMA
// =========================================================================
export default function AntreanDokterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // =========================================================================
  // 3. REACT QUERY (FETCH DATA DENGAN AUTO-REFRESH 5 DETIK)
  // =========================================================================
  const { data: listAntrean = [] } = useQuery<Antrean[]>({
    queryKey: ["antreanDokter"],
    queryFn: async () => {
      try {
        const res = await api.get("/antrean");
        const fetchedData = res.data?.data || res.data;
        const safeData = Array.isArray(fetchedData) ? fetchedData : [];

        // Memetakan data dengan safeKey agar tabel NextUI stabil
        return safeData.map((item, index) => ({
          ...item,
          safeKey: item.nopen || `fallback-antrean-${index}`,
        }));
      } catch (error) {
        console.error("Gagal menarik data antrean dokter", error);
        return [];
      }
    },
    refetchInterval: 5000, // Menembak API setiap 5 detik secara background
  });

  // Filter antrean khusus untuk yang belum diperiksa atau sedang diperiksa saja
  const antreanPoli = listAntrean.filter(
    (a) =>
      a.status_antrean === "TUNGGU_POLI" || a.status_antrean === "PEMERIKSAAN",
  );

  // =========================================================================
  // 4. REACT QUERY (MUTATION UNTUK UPDATE STATUS)
  // =========================================================================
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      nopen,
      status,
    }: {
      nopen: string;
      status: string;
    }) => {
      return await api.put(`/antrean/${nopen}/status`, {
        status_antrean: status,
      });
    },
    onSuccess: () => {
      // Perbarui data antrean di layar secara instan
      queryClient.invalidateQueries({ queryKey: ["antreanDokter"] });
    },
  });

  const handleMulaiPeriksa = async (nopen: string, id_rm: string) => {
    setIsProcessing(nopen); // Aktifkan efek loading di tombol yang ditekan

    try {
      // 1. Update status antrean di backend menjadi PEMERIKSAAN menggunakan mutateAsync
      await updateStatusMutation.mutateAsync({ nopen, status: "PEMERIKSAAN" });

      // 2. Alihkan dokter ke halaman pengisian Rekam Medis (SOAP) dengan membawa parameter URL
      router.push(
        `/dashboard/dokter/rekam-medis/input?nopen=${nopen}&id_rm=${id_rm}`,
      );
    } catch (error) {
      console.error("Gagal memulai pemeriksaan:", error);
      alert("Terjadi kesalahan saat memproses antrean.");
      setIsProcessing(null); // Matikan loading jika gagal
    }
  };

  // =========================================================================
  // 5. RENDER UI
  // =========================================================================
  const renderStatusChip = (status: string) => {
    if (status === "PEMERIKSAAN") {
      return (
        <Chip
          color="primary"
          variant="shadow"
          size="sm"
          startContent={<UserCheck size={14} />}
        >
          Sedang Diperiksa
        </Chip>
      );
    }
    return (
      <Chip
        color="warning"
        variant="flat"
        size="sm"
        startContent={<Clock size={14} />}
      >
        Menunggu Kunjungan
      </Chip>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Daftar Kunjungan Pasien (Poli)
        </h1>
        <p className="text-sm text-slate-500">
          Daftar antrean pasien hari ini yang memerlukan tindakan pemeriksaan
          medis.
        </p>
      </div>

      {/* RINGKASAN JUMLAH ANTREAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-amber-50 border border-amber-100 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-amber-700 font-medium">
                Pasien Menunggu
              </p>
              <h3 className="text-2xl font-bold text-amber-900">
                {
                  antreanPoli.filter((a) => a.status_antrean === "TUNGGU_POLI")
                    .length
                }{" "}
                Orang
              </h3>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-blue-50 border border-blue-100 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-xl">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">
                Sedang Diperiksa
              </p>
              <h3 className="text-2xl font-bold text-blue-900">
                {
                  antreanPoli.filter((a) => a.status_antrean === "PEMERIKSAAN")
                    .length
                }{" "}
                Orang
              </h3>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* TABEL ANTREAN POLI */}
      <Table aria-label="Tabel Antrean Poli Dokter" className="shadow-sm">
        <TableHeader>
          <TableColumn>NOPEN</TableColumn>
          <TableColumn>ID RM</TableColumn>
          <TableColumn>NAMA PASIEN</TableColumn>
          <TableColumn>CARA BAYAR</TableColumn>
          <TableColumn>STATUS ANTREAN</TableColumn>
          <TableColumn>AKSI TINDAKAN</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={"Tidak ada antrean pasien saat ini."}
          items={antreanPoli}
        >
          {(antrean) => (
            <TableRow
              key={antrean.safeKey} // Menggunakan kunci cadangan yang aman
              className={
                antrean.status_antrean === "PEMERIKSAAN" ? "bg-blue-50/50" : ""
              }
            >
              <TableCell className="font-mono text-xs text-slate-500">
                {antrean.nopen}
              </TableCell>
              <TableCell className="font-semibold text-slate-700">
                {antrean.id_rm}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">
                    {antrean.pasien?.nama || "Tidak ada nama"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {antrean.pasien?.jenis_kelamin || "-"} •{" "}
                    {antrean.status_pasien}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={antrean.cara_bayar === "BPJS" ? "success" : "default"}
                >
                  {antrean.cara_bayar}
                </Chip>
              </TableCell>
              <TableCell>{renderStatusChip(antrean.status_antrean)}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  color={
                    antrean.status_antrean === "PEMERIKSAAN"
                      ? "success"
                      : "primary"
                  }
                  className="font-semibold shadow-sm"
                  startContent={<Play size={14} />}
                  isLoading={
                    isProcessing === antrean.nopen ||
                    (updateStatusMutation.isPending &&
                      updateStatusMutation.variables.nopen === antrean.nopen)
                  }
                  onPress={() =>
                    handleMulaiPeriksa(antrean.nopen, antrean.id_rm)
                  }
                >
                  {antrean.status_antrean === "PEMERIKSAAN"
                    ? "Lanjutkan Periksa"
                    : "Panggil & Periksa"}
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
