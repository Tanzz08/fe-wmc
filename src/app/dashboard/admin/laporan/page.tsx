"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Spinner,
  Chip,
} from "@nextui-org/react";
import {
  Printer,
  Filter,
  Archive,
  FileText,
  ClipboardList,
} from "lucide-react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function AdminLaporanPage() {
  const router = useRouter();

  // ==========================================
  // STATE & LOGIKA TAB 1: LAPORAN SLA KUNJUNGAN
  // ==========================================
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filterInstalasi, setFilterInstalasi] = useState<string>("Semua");

  const { data: listAntrean = [], isLoading: loadAntrean } = useQuery({
    queryKey: ["adminLaporanAntrean"],
    queryFn: async () => {
      const res = await api.get("/antrean");
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });

  const filteredAntrean = listAntrean.filter((item: any) => {
    const itemDate = new Date(item.tgl_registrasi).toISOString().split("T")[0];
    let matchDate = true;
    if (startDate && !endDate) matchDate = itemDate >= startDate;
    else if (!startDate && endDate) matchDate = itemDate <= endDate;
    else if (startDate && endDate)
      matchDate = itemDate >= startDate && itemDate <= endDate;
    const matchInstalasi =
      filterInstalasi === "Semua" || item.instalasi === filterInstalasi;
    return matchDate && matchInstalasi;
  });

  const formatDateOnly = (dateString?: string | null) =>
    dateString
      ? new Date(dateString).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";
  const formatTimeShort = (dateString?: string | null) =>
    dateString
      ? new Date(dateString).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";
  const calculateAge = (dobString?: string) => {
    if (!dobString) return "-";
    return (
      Math.abs(
        new Date(Date.now() - new Date(dobString).getTime()).getUTCFullYear() -
          1970,
      ) + " Thn"
    );
  };
  const calculateSLAMins = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "-";
    const diffMins = Math.floor(
      (new Date(end).getTime() - new Date(start).getTime()) / 60000,
    );
    return diffMins >= 0 ? diffMins : 0;
  };

  // ==========================================
  // STATE & LOGIKA TAB 2: ARSIP REKAM MEDIS
  // ==========================================
  const [searchRM, setSearchRM] = useState("");
  const { data: listRM = [], isLoading: loadRM } = useQuery({
    queryKey: ["adminArsipRM"],
    queryFn: async () => {
      const res = await api.get("/rekam-medis");
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });

  const filteredRM = listRM.filter(
    (item: any) =>
      item.id_rm.toLowerCase().includes(searchRM.toLowerCase()) ||
      item.nopen.toLowerCase().includes(searchRM.toLowerCase()) ||
      item.pasien?.nama.toLowerCase().includes(searchRM.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* HEADER (Sembunyi saat cetak) */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 mb-1">
          <Archive className="text-klinik-blue" /> Pusat Arsip & Laporan
        </h1>
        <p className="text-sm text-slate-500">
          Akses laporan mutu layanan (SLA) dan histori Rekam Medis (terenkripsi
          AES).
        </p>
      </div>

      {/* TABS CONTAINER */}
      <Tabs
        aria-label="Admin Reports"
        color="primary"
        variant="underlined"
        classNames={{ tabList: "print:hidden" }}
      >
        {/* TAB 1: SLA ANTREAN */}
        <Tab
          key="sla"
          title={
            <div className="flex items-center gap-2">
              <FileText size={16} /> Laporan Kunjungan (SLA)
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-4 print:hidden">
            <Card className="shadow-sm border border-slate-100">
              <CardBody className="p-4 flex flex-row flex-wrap items-end gap-4">
                <Input
                  type="date"
                  label="Tgl Mulai"
                  variant="bordered"
                  labelPlacement="outside"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-36"
                />
                <Input
                  type="date"
                  label="Tgl Akhir"
                  variant="bordered"
                  labelPlacement="outside"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-36"
                />
                <Select
                  label="Instalasi"
                  variant="bordered"
                  labelPlacement="outside"
                  selectedKeys={[filterInstalasi]}
                  onChange={(e) =>
                    setFilterInstalasi(e.target.value || "Semua")
                  }
                  className="w-48"
                >
                  <SelectItem key="Semua" value="Semua">
                    Semua Instalasi
                  </SelectItem>
                  <SelectItem key="Rawat Jalan" value="Rawat Jalan">
                    Rawat Jalan
                  </SelectItem>
                  <SelectItem key="UGD" value="UGD">
                    UGD
                  </SelectItem>
                </Select>
                <Button
                  color="default"
                  variant="flat"
                  onPress={() => {
                    setStartDate("");
                    setEndDate("");
                    setFilterInstalasi("Semua");
                  }}
                  startContent={<Filter size={16} />}
                >
                  Reset
                </Button>
                <Button
                  color="primary"
                  onPress={() => window.print()}
                  className="ml-auto bg-klinik-blue font-bold shadow-md"
                  startContent={<Printer size={18} />}
                >
                  Cetak Register PDF
                </Button>
              </CardBody>
            </Card>

            <Table
              aria-label="Tabel Laporan"
              className="shadow-sm border border-slate-200"
            >
              <TableHeader>
                <TableColumn>TANGGAL</TableColumn>
                <TableColumn>PASIEN / NOPEN</TableColumn>
                <TableColumn>LOKASI</TableColumn>
                <TableColumn>WAKTU TUNGGU</TableColumn>
                <TableColumn>STATUS</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={loadAntrean ? <Spinner /> : "Tidak ada data."}
                items={filteredAntrean}
              >
                {(item: any) => (
                  <TableRow key={item.nopen}>
                    <TableCell className="font-medium">
                      {formatDateOnly(item.tgl_registrasi)}
                    </TableCell>
                    <TableCell>
                      <span className="block font-bold uppercase">
                        {item.pasien?.nama}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {item.nopen}
                      </span>
                    </TableCell>
                    <TableCell>{item.unit_pelayanan}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatTimeShort(item.tgl_registrasi)} ➔{" "}
                      {formatTimeShort(
                        item.tgl_final_poli || item.tgl_selesai_farmasi,
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="success">
                        {item.status_antrean}
                      </Chip>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Tab>

        {/* TAB 2: ARSIP REKAM MEDIS */}
        <Tab
          key="rm"
          title={
            <div className="flex items-center gap-2">
              <ClipboardList size={16} /> Arsip Rekam Medis (RM)
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-4 print:hidden">
            <Card className="shadow-sm border border-slate-100">
              <CardBody className="p-4 flex flex-row items-end gap-4">
                <Input
                  label="Cari Rekam Medis"
                  placeholder="Ketik Nama Pasien, No RM, atau NOPEN..."
                  variant="bordered"
                  labelPlacement="outside"
                  className="max-w-md"
                  value={searchRM}
                  onChange={(e) => setSearchRM(e.target.value)}
                />
              </CardBody>
            </Card>

            <Table
              aria-label="Tabel Arsip RM"
              className="shadow-sm border border-slate-200"
            >
              <TableHeader>
                <TableColumn>TANGGAL PERIKSA</TableColumn>
                <TableColumn>PASIEN</TableColumn>
                <TableColumn>DOKTER PEMERIKSA</TableColumn>
                <TableColumn>DIAGNOSIS (DEKRIPSI)</TableColumn>
                <TableColumn align="center">CETAK ARSIP</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={loadRM ? <Spinner /> : "Tidak ada rekam medis."}
                items={filteredRM}
              >
                {(item: any) => (
                  <TableRow key={item.nopen}>
                    <TableCell className="font-medium">
                      {formatDateOnly(item.waktu_periksa)}
                    </TableCell>
                    <TableCell>
                      <span className="block font-bold uppercase">
                        {item.pasien?.nama}
                      </span>
                      <span className="text-xs text-slate-500">
                        RM: {item.id_rm}
                      </span>
                    </TableCell>
                    <TableCell>dr. {item.dokter?.username}</TableCell>
                    <TableCell>
                      <span className="italic text-slate-700">
                        {item.diagnosis_utama || "Tidak ada diagnosis"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {/* Arahkan ke halaman cetak khusus RM */}
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() =>
                          router.push(
                            `/dashboard/dokter/rekam-medis/${item.nopen}/cetak`,
                          )
                        }
                        startContent={<Printer size={16} />}
                      >
                        Resume Pulang
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Tab>
      </Tabs>

      {/* ======================================================== */}
      {/* AREA RAW HTML UNTUK CETAK PDF (HANYA MUNCUL SAAT DI-PRINT) */}
      {/* Menggunakan struktur Kemenkes dari kode sebelumnya */}
      {/* ======================================================== */}
      <div className="hidden print:block print:w-full print:bg-white print:absolute print:top-0 print:left-0 print:z-[99999]">
        <style type="text/css">
          {`
            @media print {
              @page { size: landscape; margin: 5mm; }
              body { background-color: white !important; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              aside, nav, header { display: none !important; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 2px 4px; font-size: 7.5px; text-align: center; word-wrap: break-word; }
              th { background-color: #f1f5f9 !important; font-weight: bold; }
              .text-left { text-align: left; }
            }
          `}
        </style>

        <div className="text-center mb-4">
          <h2 className="text-sm font-bold uppercase mb-1">
            Laporan Register Antrean Pasien & Indikator Mutu Nasional (INM)
          </h2>
          <p className="text-xs">WIHDATUL UMMAH MEDICAL CENTER</p>
          <p className="text-[10px] mt-1 pb-2">
            Periode: {startDate ? formatDateOnly(startDate) : "Awal"} s.d{" "}
            {endDate ? formatDateOnly(endDate) : "Akhir"}
            {" | "} Instalasi: {filterInstalasi}
          </p>
        </div>

        <table>
          <thead>
            <tr>
              <th rowSpan={2} className="w-6">
                No.
              </th>
              <th rowSpan={2}>No. RM</th>
              <th rowSpan={2}>NOPEN</th>
              <th rowSpan={2}>Nama Pasien</th>
              <th rowSpan={2}>JK</th>
              <th rowSpan={2}>Tgl Lahir/Umur</th>
              <th rowSpan={2}>Status</th>
              <th rowSpan={2}>Instalasi</th>
              <th rowSpan={2}>Unit Pelayanan</th>
              <th rowSpan={2}>Cara Bayar</th>
              <th colSpan={8}>Pencatatan Waktu (Jam:Menit)</th>
              <th colSpan={7}>Waktu Tunggu / Pelayanan (Menit)</th>
              <th rowSpan={2}>User Daftar</th>
            </tr>
            <tr>
              <th>Tgl Registrasi</th>
              <th>Tgl Terima Poli</th>
              <th>Input Tindakan</th>
              <th>Input Asesmen</th>
              <th>Final Poli</th>
              <th>Kirim Order Resep</th>
              <th>Masuk Farmasi</th>
              <th>Selesai Farmasi</th>
              <th>Tunggu Poli</th>
              <th>Tindakan</th>
              <th>Asesmen</th>
              <th>Tunggu Pelayanan</th>
              <th>Tunggu Resep</th>
              <th>Obat Siap</th>
              <th>WPRJ</th>
            </tr>
          </thead>
          <tbody>
            {filteredAntrean.map((item: any, index: number) => (
              <tr key={item.nopen}>
                <td>{index + 1}</td>
                <td>{item.id_rm}</td>
                <td>{item.nopen}</td>
                <td className="text-left font-semibold uppercase">
                  {item.pasien?.nama}
                </td>
                <td>
                  {item.pasien?.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                </td>
                <td>
                  {formatDateOnly(item.pasien?.tanggal_lahir)} /{" "}
                  {calculateAge(item.pasien?.tanggal_lahir)}
                </td>
                <td>{item.status_pasien}</td>
                <td>{item.instalasi}</td>
                <td>{item.unit_pelayanan}</td>
                <td>{item.cara_bayar}</td>
                <td>{formatTimeShort(item.tgl_registrasi)}</td>
                <td>{formatTimeShort(item.tgl_terima_poli)}</td>
                <td>{formatTimeShort(item.tgl_input_tindakan)}</td>
                <td>{formatTimeShort(item.tgl_input_asesmen)}</td>
                <td>{formatTimeShort(item.tgl_final_poli)}</td>
                <td>{formatTimeShort(item.tgl_order_resep)}</td>
                <td>{formatTimeShort(item.tgl_masuk_farmasi)}</td>
                <td>{formatTimeShort(item.tgl_selesai_farmasi)}</td>
                <td>
                  {calculateSLAMins(item.tgl_registrasi, item.tgl_terima_poli)}
                </td>
                <td>
                  {calculateSLAMins(
                    item.tgl_terima_poli,
                    item.tgl_input_tindakan,
                  )}
                </td>
                <td>
                  {calculateSLAMins(
                    item.tgl_terima_poli,
                    item.tgl_input_asesmen,
                  )}
                </td>
                <td>
                  {calculateSLAMins(item.tgl_registrasi, item.tgl_final_poli)}
                </td>
                <td>
                  {calculateSLAMins(
                    item.tgl_order_resep,
                    item.tgl_masuk_farmasi,
                  )}
                </td>
                <td>
                  {calculateSLAMins(
                    item.tgl_masuk_farmasi,
                    item.tgl_selesai_farmasi,
                  )}
                </td>
                <td className="font-bold bg-slate-100">
                  {calculateSLAMins(
                    item.tgl_registrasi,
                    item.tgl_selesai_farmasi || item.tgl_final_poli,
                  )}
                </td>
                <td>{item.user_daftar?.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
