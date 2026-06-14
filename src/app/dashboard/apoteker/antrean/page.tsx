"use client";

import { useState } from "react";
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Input,
} from "@nextui-org/react";
import { Pill, CheckCircle2, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// Asumsi struktur data Obat dari backend
interface MasterObat {
  id: number;
  nama_obat: string;
  satuan: string;
  stok: number;
}

export default function AntreanFarmasiPage() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // State untuk Modal Validasi
  const [selectedPasien, setSelectedPasien] = useState<any>(null);
  const [keranjangObat, setKeranjangObat] = useState<
    { id_obat: string; jumlah: string; dosis: string }[]
  >([]);

  // 1. Fetch Antrean Farmasi
  const { data: listAntrean = [], isLoading } = useQuery({
    queryKey: ["antreanFarmasi"],
    queryFn: async () => {
      const res = await api.get("/farmasi/antrean");
      return res.data?.data || [];
    },
    refetchInterval: 5000,
  });

  // 2. Fetch Master Obat (Untuk Dropdown di Modal)
  const { data: listObat = [] } = useQuery<MasterObat[]>({
    queryKey: ["masterObat"],
    queryFn: async () => {
      // Pastikan kamu punya endpoint ini di backend, jika belum buatkan rute GET /obat
      const res = await api.get("/obat");
      return res.data?.data || [];
    },
  });

  // 3. Mutasi Update Status & Simpan Validasi Obat
  const validasiResepMutation = useMutation({
    mutationFn: async (payload: { nopen: string; dataObat: any[] }) => {
      // Kirim data obat yang divalidasi, dan update status ke OBAT_SIAP
      await api.put(`/farmasi/antrean/${payload.nopen}/validasi-resep`, {
        status_antrean: "OBAT_SIAP",
        detail_obat: payload.dataObat,
      });
    },
    onSuccess: () => {
      toast.success("Resep divalidasi dan Obat siap diserahkan!");
      queryClient.invalidateQueries({ queryKey: ["antreanFarmasi"] });
      onOpenChange(); // Tutup modal
    },
    onError: () => toast.error("Gagal memvalidasi resep."),
  });

  // Mutasi Selesaikan (Serahkan ke Pasien)
  const serahkanObatMutation = useMutation({
    mutationFn: async (nopen: string) => {
      await api.put(`/farmasi/antrean/${nopen}/status`, {
        status_antrean: "SELESAI_FARMASI",
      });
    },
    onSuccess: () => {
      toast.success("Obat berhasil diserahkan ke pasien!");
      queryClient.invalidateQueries({ queryKey: ["antreanFarmasi"] });
    },
  });

  // Handler Buka Modal
  const handleOpenValidasi = (item: any) => {
    setSelectedPasien(item);
    setKeranjangObat([{ id_obat: "", jumlah: "", dosis: "" }]); // Reset keranjang dgn 1 baris kosong
    onOpen();
  };

  // Handler Keranjang Obat
  const tambahBarisObat = () =>
    setKeranjangObat([
      ...keranjangObat,
      { id_obat: "", jumlah: "", dosis: "" },
    ]);
  const hapusBarisObat = (index: number) =>
    setKeranjangObat(keranjangObat.filter((_, i) => i !== index));
  const handleUpdateKeranjang = (
    index: number,
    field: string,
    value: string,
  ) => {
    const newData = [...keranjangObat];
    newData[index] = { ...newData[index], [field]: value };
    setKeranjangObat(newData);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
        <Pill className="text-klinik-blue" /> Validasi Layanan Farmasi
      </h1>

      <Table aria-label="Antrean Farmasi" className="shadow-sm">
        <TableHeader>
          <TableColumn>PASIEN & POLI</TableColumn>
          <TableColumn>RESEP DARI DOKTER</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn align="center">AKSI APOTEKER</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading ? <Spinner /> : "Tidak ada resep baru"}
          items={listAntrean}
        >
          {(item: any) => (
            <TableRow key={item.nopen}>
              <TableCell>
                <p className="font-bold uppercase text-slate-800">
                  {item.pasien?.nama}
                </p>
                <p className="text-xs text-slate-500">
                  {item.nopen} | {item.unit_pelayanan}
                </p>
              </TableCell>

              <TableCell>
                <Card
                  shadow="none"
                  className="bg-slate-50 border border-slate-200"
                >
                  <CardBody className="p-2 text-xs font-mono text-slate-700">
                    {item.resep_obat || "Tidak ada resep tertulis"}
                  </CardBody>
                </Card>
              </TableCell>

              <TableCell>
                <Chip
                  color={
                    item.status_antrean === "TUNGGU_FARMASI"
                      ? "warning"
                      : item.status_antrean === "OBAT_SIAP"
                        ? "success"
                        : "default"
                  }
                  variant="flat"
                  size="sm"
                  className="font-bold"
                >
                  {item.status_antrean.replace("_", " ")}
                </Chip>
              </TableCell>

              <TableCell>
                <div className="flex gap-2">
                  {/* Tombol Validasi Obat */}
                  {item.status_antrean === "TUNGGU_FARMASI" && (
                    <Button
                      size="sm"
                      color="primary"
                      onPress={() => handleOpenValidasi(item)}
                      startContent={<ClipboardCheck size={16} />}
                    >
                      Validasi Obat
                    </Button>
                  )}

                  {/* Tombol Serahkan Obat (Menutup SLA Farmasi) */}
                  {item.status_antrean === "OBAT_SIAP" && (
                    <Button
                      size="sm"
                      color="success"
                      className="text-white font-semibold"
                      onPress={() => serahkanObatMutation.mutate(item.nopen)}
                      startContent={<CheckCircle2 size={16} />}
                    >
                      Serahkan Pasien
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ============================================================== */}
      {/* MODAL VALIDASI RESEP (MENGUBAH TEKS MENJADI DATA OBAT ASLI)    */}
      {/* ============================================================== */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b">
                Validasi Resep: {selectedPasien?.pasien?.nama}
                <span className="text-xs font-normal text-slate-500">
                  Cocokkan resep dokter dengan ketersediaan obat di apotek.
                </span>
              </ModalHeader>
              <ModalBody className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* KIRI: Catatan Dokter */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-sm text-slate-700">
                    Catatan Resep Dokter
                  </h3>
                  <Card className="bg-amber-50/50 border border-amber-200 h-full min-h-[200px]">
                    <CardBody className="font-mono text-sm text-slate-800 whitespace-pre-wrap">
                      {selectedPasien?.resep_obat ||
                        "Dokter tidak menulis resep."}
                    </CardBody>
                  </Card>
                </div>

                {/* KANAN: Input Validasi Apoteker */}
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-slate-700 flex justify-between items-center">
                    Obat yang Diberikan
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={tambahBarisObat}
                      startContent={<Plus size={14} />}
                    >
                      Tambah Obat
                    </Button>
                  </h3>

                  <div className="flex flex-col gap-3">
                    {keranjangObat.map((row, index) => (
                      <div
                        key={index}
                        className="flex gap-2 items-start bg-slate-50 p-2 rounded-lg border border-slate-100"
                      >
                        <Select
                          size="sm"
                          label="Pilih Obat"
                          selectedKeys={row.id_obat ? [row.id_obat] : []}
                          onChange={(e) =>
                            handleUpdateKeranjang(
                              index,
                              "id_obat",
                              e.target.value,
                            )
                          }
                          className="w-[45%]"
                        >
                          {listObat.map((obat) => (
                            <SelectItem
                              key={obat.id}
                              value={obat.id.toString()}
                            >
                              {obat.nama_obat} (Stok: {obat.stok})
                            </SelectItem>
                          ))}
                        </Select>
                        <Input
                          size="sm"
                          type="number"
                          label="Jml"
                          placeholder="0"
                          value={row.jumlah}
                          onChange={(e) =>
                            handleUpdateKeranjang(
                              index,
                              "jumlah",
                              e.target.value,
                            )
                          }
                          className="w-[20%]"
                        />
                        <Input
                          size="sm"
                          label="Aturan Pakai"
                          placeholder="3x1 Sesudah Makan"
                          value={row.dosis}
                          onChange={(e) =>
                            handleUpdateKeranjang(
                              index,
                              "dosis",
                              e.target.value,
                            )
                          }
                          className="flex-1"
                        />
                        <Button
                          isIconOnly
                          color="danger"
                          variant="light"
                          size="sm"
                          className="mt-2"
                          onPress={() => hapusBarisObat(index)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="border-t">
                <Button color="danger" variant="light" onPress={onClose}>
                  Batal
                </Button>
                <Button
                  color="primary"
                  isLoading={validasiResepMutation.isPending}
                  onPress={() =>
                    validasiResepMutation.mutate({
                      nopen: selectedPasien?.nopen,
                      dataObat: keranjangObat,
                    })
                  }
                >
                  Selesai Validasi & Siapkan Obat
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
