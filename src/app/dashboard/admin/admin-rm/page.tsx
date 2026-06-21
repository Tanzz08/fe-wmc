"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardBody,
  Input,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Spinner,
  Accordion,
  AccordionItem,
  Divider,
} from "@nextui-org/react";
import {
  Archive,
  Search,
  Eye,
  User,
  Calendar,
  Activity,
  Pill,
  ShieldCheck,
  Printer,
} from "lucide-react";
import api from "@/lib/axios";

// =========================================================================
// 1. TIPE DATA
// =========================================================================
interface Pasien {
  id_rm: string;
  nama: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  no_telepon: string;
  alamat: string;
}

interface RekamMedis {
  id_pemeriksaan: number;
  nopen: string;
  waktu_periksa: string;
  tensi_darah: string;
  nadi: string;
  suhu: string;
  keadaan_umum: string;
  diagnosis_utama: string;
  terapi_pengobatan: string;
  dokter: {
    username: string;
  };
}

interface DetailPasien extends Pasien {
  rekamMedis: RekamMedis[];
}

export default function ArsipRekamMedisPage() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRm, setSelectedRm] = useState<string | null>(null);

  // =========================================================================
  // 2. FETCH DATA DAFTAR PASIEN
  // =========================================================================
  const { data: listPasien = [], isLoading: loadingDaftar } = useQuery<
    Pasien[]
  >({
    queryKey: ["pasienListArsip"],
    queryFn: async () => {
      try {
        const res = await api.get("/pasien");
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error) {
        console.error("Gagal menarik data pasien", error);
        return [];
      }
    },
  });

  const filteredPasien = listPasien.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.id_rm && p.id_rm.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // =========================================================================
  // 3. FETCH DETAIL & RIWAYAT REKAM MEDIS PASIEN (Saat Modal Dibuka)
  // =========================================================================
  const { data: detailPasien, isLoading: loadingDetail } =
    useQuery<DetailPasien>({
      queryKey: ["pasienDetailRM", selectedRm],
      queryFn: async () => {
        const res = await api.get(`/pasien/${selectedRm}`);
        return res.data?.data;
      },
      // Query ini HANYA berjalan jika ada pasien yang dipilih (selectedRm tidak null)
      enabled: !!selectedRm,
    });

  const handleBukaRiwayat = (id_rm: string) => {
    setSelectedRm(id_rm);
    onOpen();
  };

  // =========================================================================
  // 4. RENDER UI
  // =========================================================================
  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Archive className="text-klinik-blue" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Arsip Rekam Medis
          </h1>
          <p className="text-sm text-slate-500">
            Pusat penelusuran histori rekam medis elektronik pasien
            (Terdekripsi).
          </p>
        </div>
      </div>

      {/* PENCARIAN */}
      <Card className="shadow-sm">
        <CardBody>
          <Input
            isClearable
            className="w-full sm:max-w-md"
            placeholder="Cari Rekam Medis (Nama atau ID RM)..."
            startContent={<Search className="text-default-300" size={18} />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            variant="bordered"
          />
        </CardBody>
      </Card>

      {/* TABEL DAFTAR PASIEN */}
      <div className="overflow-x-auto w-full">
        <Table
          aria-label="Tabel Arsip Rekam Medis"
          className="shadow-sm min-w-max"
        >
          <TableHeader>
            <TableColumn>ID RM</TableColumn>
            <TableColumn>NAMA PASIEN</TableColumn>
            <TableColumn>JENIS KELAMIN</TableColumn>
            <TableColumn>NO. TELEPON</TableColumn>
            <TableColumn align="center">LIHAT BERKAS</TableColumn>
          </TableHeader>
          <TableBody
            items={filteredPasien}
            isLoading={loadingDaftar}
            loadingContent={
              <div className="font-semibold text-klinik-blue">
                Memuat Data...
              </div>
            }
            emptyContent={loadingDaftar ? " " : "Data tidak ditemukan."}
          >
            {(pasien) => (
              <TableRow key={pasien.id_rm}>
                <TableCell>
                  <Chip
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="font-semibold"
                  >
                    {pasien.id_rm}
                  </Chip>
                </TableCell>
                <TableCell className="font-medium text-slate-700 whitespace-nowrap">
                  {pasien.nama}
                </TableCell>
                <TableCell>{pasien.jenis_kelamin}</TableCell>
                <TableCell className="font-mono text-sm">
                  {pasien.no_telepon}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="font-semibold"
                    startContent={<Eye size={16} />}
                    onPress={() => handleBukaRiwayat(pasien.id_rm)}
                  >
                    Buka Riwayat RM
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL RIWAYAT REKAM MEDIS (ACCORDION) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        size="3xl"
        scrollBehavior="inside"
        onClose={() => setSelectedRm(null)} // Reset state saat ditutup
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-klinik-blue" size={24} />
                  <span className="text-lg font-bold">
                    Histori Rekam Medis Pasien
                  </span>
                </div>
                {!loadingDetail && detailPasien && (
                  <p className="text-sm font-normal text-slate-500 mt-1 flex gap-4">
                    <span>
                      Nama:{" "}
                      <strong className="text-slate-700">
                        {detailPasien.nama}
                      </strong>
                    </span>
                    <span>
                      RM:{" "}
                      <strong className="text-slate-700">
                        {detailPasien.id_rm}
                      </strong>
                    </span>
                  </p>
                )}
              </ModalHeader>

              <ModalBody className="py-6 bg-slate-50/50">
                {loadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <Spinner size="lg" color="primary" />
                    <p className="text-sm text-slate-500 font-medium">
                      Mendekripsi Rekam Medis (AES-256)...
                    </p>
                  </div>
                ) : !detailPasien || detailPasien.rekamMedis.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    Pasien ini belum memiliki riwayat rekam medis.
                  </div>
                ) : (
                  <Accordion variant="splitted" className="px-0">
                    {detailPasien.rekamMedis.map((rm, index) => {
                      const tglPeriksa = new Date(
                        rm.waktu_periksa,
                      ).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });

                      return (
                        <AccordionItem
                          key={rm.id_pemeriksaan}
                          aria-label={`Pemeriksaan ${tglPeriksa}`}
                          title={
                            <div className="flex items-center gap-2 font-bold text-slate-700">
                              <Calendar
                                size={18}
                                className="text-klinik-blue"
                              />
                              {tglPeriksa}
                            </div>
                          }
                          subtitle={
                            <div className="flex items-center gap-2 mt-1">
                              <Chip
                                size="sm"
                                variant="flat"
                                color="default"
                                startContent={<User size={12} />}
                              >
                                Dr. {rm.dokter?.username || "Tidak diketahui"}
                              </Chip>
                              <Chip size="sm" variant="flat" color="warning">
                                {rm.nopen}
                              </Chip>
                            </div>
                          }
                          className="bg-white border border-slate-200 mb-2 rounded-xl shadow-sm px-4"
                        >
                          <div className="flex flex-col gap-4 pb-4">
                            <Divider />

                            {/* VITAL SIGN */}
                            <div>
                              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                                <Activity size={16} className="text-primary" />
                                Tanda Vital & Kondisi Umum
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                  <p className="text-slate-400 text-xs">
                                    Tensi
                                  </p>
                                  <p className="font-semibold">
                                    {rm.tensi_darah || "-"}
                                  </p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                  <p className="text-slate-400 text-xs">Suhu</p>
                                  <p className="font-semibold">
                                    {rm.suhu || "-"}
                                  </p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                  <p className="text-slate-400 text-xs">Nadi</p>
                                  <p className="font-semibold">
                                    {rm.nadi || "-"}
                                  </p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                  <p className="text-slate-400 text-xs">
                                    Kondisi
                                  </p>
                                  <p className="font-semibold capitalize">
                                    {rm.keadaan_umum || "-"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* DIAGNOSIS & TERAPI */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-blue-800 mb-1">
                                  <ShieldCheck size={16} /> Diagnosis
                                </h4>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                  {rm.diagnosis_utama || "Belum ada diagnosis."}
                                </p>
                              </div>
                              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-800 mb-1">
                                  <Pill size={16} /> Terapi / Pengobatan
                                </h4>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                  {rm.terapi_pengobatan || "Belum ada terapi."}
                                </p>
                              </div>
                            </div>

                            {/* TAMBAHKAN TOMBOL CETAK DI SINI */}
                            <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
                              <Button
                                size="sm"
                                color="primary"
                                className="bg-klinik-blue font-semibold"
                                startContent={<Printer size={16} />}
                                onPress={() =>
                                  window.open(
                                    `/dashboard/admin/arsip-rm/cetak?id_rm=${detailPasien.id_rm}&nopen=${rm.nopen}`,
                                    "_blank",
                                  )
                                }
                              >
                                Cetak Dokumen (PDF/Print)
                              </Button>
                            </div>
                          </div>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </ModalBody>

              <ModalFooter className="bg-white border-t">
                <Button color="primary" onPress={onClose}>
                  Tutup Arsip
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
