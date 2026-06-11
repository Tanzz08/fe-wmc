"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Spinner,
  Card,
  CardBody,
} from "@nextui-org/react";
import { Pill, Play, CheckCircle2, CheckCheck } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

export default function AntreanFarmasiPage() {
  const queryClient = useQueryClient();

  // Ambil Data Antrean Farmasi dari Backend
  const { data: antreanFarmasi = [], isLoading } = useQuery({
    queryKey: ["antreanFarmasi"],
    queryFn: async () => {
      const res = await api.get("/farmasi/antrean");
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    refetchInterval: 5000, // Auto-refresh tiap 5 detik agar resep baru langsung muncul
  });

  // Mutasi untuk mengubah status antrean
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      nopen,
      status,
    }: {
      nopen: string;
      status: string;
    }) => {
      const res = await api.put(`/farmasi/antrean/${nopen}/status`, {
        status_antrean: status,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Status apotek berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["antreanFarmasi"] });
    },
    onError: () => {
      toast.error("Gagal memperbarui status.");
    },
  });

  // Helper untuk Warna Status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "TUNGGU_FARMASI":
        return "warning";
      case "FARMASI":
        return "primary"; // Sedang diracik
      case "OBAT_SIAP":
        return "success";
      case "SELESAI_FARMASI":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Pill className="text-klinik-blue" /> Antrean Layanan Farmasi
        </h1>
        <p className="text-sm text-slate-500">
          Daftar resep pasien dari poliklinik yang perlu diproses.
        </p>
      </div>

      <Table aria-label="Tabel Resep Farmasi" className="shadow-sm">
        <TableHeader>
          <TableColumn>PASIEN & POLI</TableColumn>
          <TableColumn>RESEP OBAT (DARI DOKTER)</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn align="center">AKSI APOTEKER</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            isLoading ? <Spinner /> : "Tidak ada antrean resep saat ini."
          }
          items={antreanFarmasi}
        >
          {(item: any) => (
            <TableRow key={item.nopen}>
              <TableCell>
                <p className="font-bold uppercase text-slate-800">
                  {item.pasien?.nama}
                </p>
                <p className="text-xs text-slate-500">
                  {item.nopen} | {item.unit_pelayanan} ({item.dokter?.username})
                </p>
              </TableCell>

              <TableCell>
                <Card
                  shadow="none"
                  className="bg-slate-50 border border-slate-200 w-full max-w-md"
                >
                  <CardBody className="p-3">
                    <p className="whitespace-pre-wrap text-sm font-mono text-slate-700">
                      {item.resep_obat || "Tidak ada resep tertulis."}
                    </p>
                  </CardBody>
                </Card>
              </TableCell>

              <TableCell>
                <Chip
                  color={getStatusColor(item.status_antrean)}
                  variant="flat"
                  size="sm"
                  className="font-bold"
                >
                  {item.status_antrean.replace("_", " ")}
                </Chip>
              </TableCell>

              <TableCell>
                <div className="flex justify-center gap-2">
                  {/* Tombol Proses (Memicu tgl_masuk_farmasi di SLA) */}
                  {item.status_antrean === "TUNGGU_FARMASI" && (
                    <Button
                      size="sm"
                      color="primary"
                      startContent={<Play size={16} />}
                      isLoading={updateStatusMutation.isPending}
                      onPress={() =>
                        updateStatusMutation.mutate({
                          nopen: item.nopen,
                          status: "FARMASI",
                        })
                      }
                    >
                      Proses Resep
                    </Button>
                  )}

                  {/* Tombol Obat Siap (Memicu tgl_selesai_farmasi di SLA) */}
                  {item.status_antrean === "FARMASI" && (
                    <Button
                      size="sm"
                      color="success"
                      className="text-white font-semibold"
                      startContent={<CheckCircle2 size={16} />}
                      isLoading={updateStatusMutation.isPending}
                      onPress={() =>
                        updateStatusMutation.mutate({
                          nopen: item.nopen,
                          status: "OBAT_SIAP",
                        })
                      }
                    >
                      Obat Siap
                    </Button>
                  )}

                  {/* Tombol Serahkan (Selesai Sepenuhnya) */}
                  {item.status_antrean === "OBAT_SIAP" && (
                    <Button
                      size="sm"
                      color="default"
                      variant="flat"
                      startContent={<CheckCheck size={16} />}
                      isLoading={updateStatusMutation.isPending}
                      onPress={() =>
                        updateStatusMutation.mutate({
                          nopen: item.nopen,
                          status: "SELESAI_FARMASI",
                        })
                      }
                    >
                      Serahkan
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
