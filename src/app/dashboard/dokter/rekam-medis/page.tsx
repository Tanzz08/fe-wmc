"use client";

import { useState, useEffect } from "react";
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
  Card,
  CardBody,
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
  id_rm: string;
  waktu_periksa: string;
  tensi_darah: string;
  nadi: string;
  suhu: string;
  keadaan_umum: string;
  diagnosis_utama: string;
  icd10_utama?: string;
  diagnosis_sekunder?: string;
  icd10_sekunder?: string;
  terapi_pengobatan: string;
  rencana_diet?: string;
  edukasi?: string;
  dokter: {
    username: string;
  };
  pasien: Pasien;
  safeKey?: string;
}

export default function ArsipRekamMedisDokterPage() {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRm, setSelectedRm] = useState<string | null>(null);

  // State untuk menyimpan data dokter yang sedang login
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(
    null,
  );
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // =========================================================================
  // 2. CEK SESI LOGIN DOKTER
  // =========================================================================
  useEffect(() => {
    // 💡 CEK LOCALSTORAGE: Sesuaikan "user" dengan key yang kamu pakai saat proses Login
    const storedUser =
      localStorage.getItem("user") || localStorage.getItem("userData");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error("Gagal membaca sesi login:", error);
      }
    } else {
      // 🚨 FALLBACK TESTING: Jika localStorage kosong/berbeda, paksa gunakan username ini agar data tetap muncul
      console.warn(
        "Session tidak ditemukan di localStorage. Menggunakan fallback mode.",
      );

      // GANTI "dokter1" di bawah ini dengan username dokter yang ada di database kamu (misal: "nurul" atau "jaya")
      setCurrentUser({ username: "dokter1" });
    }

    setIsAuthLoading(false);
  }, []);

  // =========================================================================
  // 3. FETCH DATA & FILTER KHUSUS DOKTER INI
  // =========================================================================
  const { data: listRM = [], isLoading } = useQuery<RekamMedis[]>({
    queryKey: ["rekamMedisSemua"],
    enabled: !isAuthLoading, // Tunggu pengecekan login selesai
    queryFn: async () => {
      try {
        const res = await api.get("/rekam-medis");
        const fetchedData = res.data?.data || res.data;
        const safeData = Array.isArray(fetchedData) ? fetchedData : [];

        // Tambahkan safeKey untuk menstabilkan tabel NextUI
        return safeData.map((item: any, index: number) => ({
          ...item,
          safeKey: item.nopen || `fallback-rm-${index}`,
        }));
      } catch (error) {
        console.error("Gagal menarik data arsip rekam medis", error);
        return [];
      }
    },
  });

  // 🔥 PROSES FILTERING: Hanya ambil rekam medis dengan username dokter yang cocok
  const filteredByDoctor = listRM.filter((rm) => {
    if (!currentUser?.username) return false;
    return (
      rm.dokter?.username?.toLowerCase() === currentUser.username.toLowerCase()
    );
  });

  // Ekstrak data Pasien unik dari riwayat Rekam Medis milik dokter ini
  const uniquePatientsMap = new Map<string, Pasien>();
  filteredByDoctor.forEach((rm) => {
    if (rm.pasien && !uniquePatientsMap.has(rm.id_rm)) {
      uniquePatientsMap.set(rm.id_rm, rm.pasien);
    }
  });

  const listPasien = Array.from(uniquePatientsMap.values());

  // Fitur Live Search untuk tabel daftar pasien
  const filteredPasien = listPasien.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.id_rm && p.id_rm.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Filter histori spesifik untuk pasien yang diklik (di dalam Modal)
  const patientRmHistory = filteredByDoctor.filter(
    (rm) => rm.id_rm === selectedRm,
  );
  const detailPasien = listPasien.find((p) => p.id_rm === selectedRm);

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
            Arsip Rekam Medis Pasien Saya
          </h1>
          <p className="text-sm text-slate-500">
            Daftar histori rekam medis pasien yang pernah Anda tangani (Dokter:{" "}
            <span className="font-semibold text-klinik-blue">
              {currentUser?.username || "..."}
            </span>
            )
          </p>
        </div>
      </div>

      {/* PENCARIAN */}
      <Card className="shadow-sm border border-slate-100">
        <CardBody>
          <Input
            isClearable
            className="w-full sm:max-w-md"
            placeholder="Cari Pasien (Nama atau ID RM)..."
            startContent={<Search className="text-default-300" size={18} />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            variant="bordered"
          />
        </CardBody>
      </Card>

      {/* TABEL DAFTAR PASIEN KHUSUS DOKTER INI */}
      <div className="overflow-x-auto w-full">
        <Table
          aria-label="Tabel Arsip Rekam Medis Dokter"
          className="shadow-sm border border-slate-200 min-w-max"
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
            isLoading={isLoading || isAuthLoading}
            loadingContent={
              <div className="flex flex-col items-center gap-2 p-4">
                <Spinner size="md" color="primary" />
                <span className="font-semibold text-klinik-blue">
                  Memuat Data Pasien Anda...
                </span>
              </div>
            }
            emptyContent={
              isLoading || isAuthLoading
                ? " "
                : `Belum ada riwayat rekam medis atas nama dokter ${currentUser?.username}.`
            }
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
                <TableCell className="font-medium text-slate-700 uppercase">
                  {pasien.nama}
                </TableCell>
                <TableCell>{pasien.jenis_kelamin || "-"}</TableCell>
                <TableCell className="font-mono text-sm">
                  {pasien.no_telepon || "-"}
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
      {/* MODAL RIWAYAT REKAM MEDIS (ACCORDION PER PASIEN) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        size="3xl"
        scrollBehavior="inside"
        onClose={() => setSelectedRm(null)}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-klinik-blue" size={24} />
                  <span className="text-lg font-bold">
                    Histori Pemeriksaan Pasien
                  </span>
                </div>
                {detailPasien && (
                  <p className="text-sm font-normal text-slate-500 mt-1 flex gap-4">
                    <span>
                      Nama:{" "}
                      <strong className="text-slate-700 uppercase">
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
                {patientRmHistory.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    Tidak ada riwayat rekam medis yang ditemukan.
                  </div>
                ) : (
                  <Accordion variant="splitted" className="px-0">
                    {patientRmHistory.map((rm) => {
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
                          key={rm.safeKey || rm.id_pemeriksaan}
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
                                Dr. {rm.dokter?.username || "-"}
                              </Chip>
                              <Chip
                                size="sm"
                                variant="flat"
                                color="warning"
                                className="font-mono"
                              >
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
                                <Activity size={16} className="text-blue-500" />
                                Tanda Vital & Kondisi Umum
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                  <p className="text-slate-400 text-xs">
                                    Tensi
                                  </p>
                                  <p className="font-semibold">
                                    {rm.tensi_darah || "-"} mmHg
                                  </p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                  <p className="text-slate-400 text-xs">Suhu</p>
                                  <p className="font-semibold">
                                    {rm.suhu || "-"} °C
                                  </p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                  <p className="text-slate-400 text-xs">Nadi</p>
                                  <p className="font-semibold">
                                    {rm.nadi || "-"} x/mnt
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
                              <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100 flex flex-col gap-2">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-purple-800 mb-1">
                                  <ShieldCheck size={16} /> Diagnosis
                                </h4>
                                <div>
                                  <p className="text-xs text-purple-600 font-semibold">
                                    Utama:
                                  </p>
                                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                    {rm.diagnosis_utama || "-"}
                                  </p>
                                </div>
                                {rm.diagnosis_sekunder && (
                                  <div>
                                    <p className="text-xs text-purple-600 font-semibold mt-1">
                                      Sekunder:
                                    </p>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                      {rm.diagnosis_sekunder}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-800 mb-1">
                                  <Pill size={16} /> Terapi / Pengobatan
                                </h4>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                  {rm.terapi_pengobatan || "Belum ada terapi."}
                                </p>
                                {(rm.edukasi || rm.rencana_diet) && (
                                  <div className="mt-3 pt-3 border-t border-emerald-200/50">
                                    <p className="text-xs text-emerald-600 font-semibold">
                                      Edukasi / Diet:
                                    </p>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                      {rm.edukasi}{" "}
                                      {rm.rencana_diet
                                        ? `(Diet: ${rm.rencana_diet})`
                                        : ""}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* TOMBOL CETAK RESUME MEDIS */}
                            <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
                              <Button
                                size="sm"
                                color="primary"
                                className="bg-klinik-blue font-semibold"
                                startContent={<Printer size={16} />}
                                onPress={() =>
                                  window.open(
                                    `/dashboard/dokter/rekam-medis/${rm.nopen}/cetak`,
                                    "_blank",
                                  )
                                }
                              >
                                Cetak Resume (PDF)
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
                <Button color="primary" variant="flat" onPress={onClose}>
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
