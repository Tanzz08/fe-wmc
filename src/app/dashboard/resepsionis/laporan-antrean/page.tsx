"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
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
} from "@nextui-org/react";
import { Printer, Filter } from "lucide-react";
import api from "@/lib/axios";

// Interface disesuaikan dengan Skema Prisma
interface Antrean {
  nopen: string;
  id_rm: string;
  pasien: { nama: string; jenis_kelamin: string; tanggal_lahir: string };
  status_pasien: string;
  cara_bayar: string;
  instalasi: string;
  unit_pelayanan: string;
  sub_unit?: string | null;
  status_antrean: string;
  // Kolom Waktu
  tgl_registrasi: string;
  tgl_terima_poli?: string | null;
  tgl_input_asesmen?: string | null;
  tgl_input_tindakan?: string | null;
  tgl_final_poli?: string | null;
  tgl_order_resep?: string | null;
  tgl_masuk_farmasi?: string | null;
  tgl_selesai_farmasi?: string | null;
  user_daftar?: { username: string };
}

export default function LaporanAntreanPage() {
  // State Filter Rentang Tanggal
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // State Filter Lokasi
  const [filterInstalasi, setFilterInstalasi] = useState<string>("Semua");
  const [filterUnit, setFilterUnit] = useState<string>("Semua");
  const [filterSubUnit, setFilterSubUnit] = useState<string>("Semua");

  const { data: listAntrean = [], isLoading } = useQuery<Antrean[]>({
    queryKey: ["laporanAntreanList"],
    queryFn: async () => {
      const res = await api.get("/antrean");
      const fetchedData = res.data?.data || res.data;
      return Array.isArray(fetchedData) ? fetchedData : [];
    },
    // TAMBAHKAN 2 BARIS INI:
    refetchInterval: 3000, // Refresh data otomatis setiap 3 detik
    refetchOnWindowFocus: true, // Refresh saat ganti tab browser
  });

  // Filter Logic Bertingkat (Dengan Rentang Tanggal)
  const filteredData = listAntrean.filter((item) => {
    // 1. Filter Tanggal
    const itemDate = new Date(item.tgl_registrasi).toISOString().split("T")[0];
    let matchDate = true;
    if (startDate && !endDate) matchDate = itemDate >= startDate;
    else if (!startDate && endDate) matchDate = itemDate <= endDate;
    else if (startDate && endDate)
      matchDate = itemDate >= startDate && itemDate <= endDate;

    // 2. Filter Lokasi
    const matchInstalasi =
      filterInstalasi === "Semua" || item.instalasi === filterInstalasi;
    const matchUnit =
      filterUnit === "Semua" || item.unit_pelayanan === filterUnit;
    const matchSubUnit =
      filterSubUnit === "Semua" ||
      (item.sub_unit && item.sub_unit === filterSubUnit);

    return matchDate && matchInstalasi && matchUnit && matchSubUnit;
  });

  // Helper: Format Waktu (Jam:Menit:Detik) - Untuk Web
  const formatTimeFull = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Helper: Format Jam Saja (Jam:Menit) - Untuk Cetak biar lebih ringkas
  const formatTimeShort = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper: Format Tanggal Saja (Untuk Tabel)
  const formatDateOnly = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Helper: Hitung Umur
  const calculateAge = (dobString?: string) => {
    if (!dobString) return "-";
    const diffMs = Date.now() - new Date(dobString).getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970) + " Thn";
  };

  // Helper: Hitung Durasi SLA dalam Menit (Teks)
  const calculateSLAText = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "-";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins >= 0 ? `${diffMins} Menit` : "0 Menit";
  };

  // Helper: Hitung Durasi SLA dalam Menit (Angka saja untuk Cetak)
  const calculateSLAMins = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "-";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins >= 0 ? diffMins : 0;
  };

  const handlePrint = () => {
    window.print();
  };

  const resetFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilterInstalasi("Semua");
    setFilterUnit("Semua");
    setFilterSubUnit("Semua");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. BAGIAN HEADER & FILTER (DISEMBUNYIKAN SAAT CETAK PDF) */}
      <div className="print:hidden flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Laporan Mutu Pelayanan (SLA)
            </h1>
            <p className="text-sm text-slate-500">
              Filter dan cetak rekapitulasi waktu tunggu pasien berdasarkan
              periode.
            </p>
          </div>
          <Button
            color="primary"
            onPress={handlePrint}
            startContent={<Printer size={18} />}
            className="shadow-md font-bold"
          >
            Cetak Register (PDF)
          </Button>
        </div>

        <Card className="shadow-sm border border-slate-100">
          <CardBody className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
            <Input
              type="date"
              label="Tgl Mulai"
              variant="bordered"
              labelPlacement="outside"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="Tgl Akhir"
              variant="bordered"
              labelPlacement="outside"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Select
              label="Instalasi"
              variant="bordered"
              labelPlacement="outside"
              selectedKeys={[filterInstalasi]}
              onChange={(e) => setFilterInstalasi(e.target.value || "Semua")}
            >
              <SelectItem key="Semua" value="Semua">
                Semua
              </SelectItem>
              <SelectItem key="Rawat Jalan" value="Rawat Jalan">
                Rawat Jalan
              </SelectItem>
              <SelectItem key="UGD" value="UGD">
                UGD
              </SelectItem>
            </Select>
            <Select
              label="Unit Pelayanan"
              variant="bordered"
              labelPlacement="outside"
              selectedKeys={[filterUnit]}
              onChange={(e) => setFilterUnit(e.target.value || "Semua")}
            >
              <SelectItem key="Semua" value="Semua">
                Semua
              </SelectItem>
              <SelectItem key="Poli Umum" value="Poli Umum">
                Poli Umum
              </SelectItem>
              <SelectItem key="Poli Gigi" value="Poli Gigi">
                Poli Gigi
              </SelectItem>
              <SelectItem key="Poli KIA" value="Poli KIA">
                Poli KIA
              </SelectItem>
            </Select>
            <Input
              label="Sub Unit (Ops)"
              placeholder="Ketik..."
              variant="bordered"
              labelPlacement="outside"
              value={filterSubUnit === "Semua" ? "" : filterSubUnit}
              onChange={(e) => setFilterSubUnit(e.target.value || "Semua")}
            />
            <Button
              color="default"
              variant="flat"
              className="h-10"
              startContent={<Filter size={16} />}
              onPress={resetFilter}
            >
              Reset
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* 2. TABEL VERSI UI WEB (NEXTUI) - TETAP RINGKAS */}
      <div className="print:hidden">
        <Table
          aria-label="Tabel Laporan"
          className="shadow-sm border border-slate-200"
        >
          <TableHeader>
            <TableColumn>TANGGAL</TableColumn>
            <TableColumn>NOPEN / PASIEN</TableColumn>
            <TableColumn>LOKASI PELAYANAN</TableColumn>
            <TableColumn>DAFTAR ➔ DILAYANI</TableColumn>
            <TableColumn className="bg-amber-50 text-amber-800">
              WAKTU TUNGGU
            </TableColumn>
            <TableColumn className="bg-emerald-50 text-emerald-800">
              LAMA LAYANAN
            </TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              isLoading ? <Spinner /> : "Tidak ada data sesuai filter."
            }
            items={filteredData}
          >
            {(item) => (
              <TableRow key={item.nopen}>
                <TableCell className="font-medium whitespace-nowrap">
                  {formatDateOnly(item.tgl_registrasi)}
                </TableCell>
                <TableCell>
                  <span className="block font-bold">{item.nopen}</span>
                  <span className="text-xs text-slate-500 uppercase">
                    {item.pasien?.nama} ({item.id_rm})
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block text-xs text-slate-500">
                    {item.instalasi}
                  </span>
                  <span className="font-semibold">{item.unit_pelayanan}</span>
                  {item.sub_unit && (
                    <span className="block text-xs italic">
                      - {item.sub_unit}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatTimeFull(item.tgl_registrasi)} ➔{" "}
                  {formatTimeFull(item.tgl_terima_poli)}
                </TableCell>

                {/* WAKTU TUNGGU: Daftar -> Terima Poli */}
                <TableCell className="bg-amber-50 font-bold text-amber-700">
                  {calculateSLAText(item.tgl_registrasi, item.tgl_terima_poli)}
                </TableCell>

                {/* LAMA LAYANAN: Terima Poli -> Selesai Poli */}
                <TableCell className="bg-emerald-50 font-bold text-emerald-700">
                  {calculateSLAText(item.tgl_terima_poli, item.tgl_final_poli)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. TABEL VERSI CETAK PDF (RAW HTML - LEDGER STYLE KEMENKES LENGKAP) */}
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
            {" | "} Instalasi: {filterInstalasi} | Unit: {filterUnit}
            {filterSubUnit !== "Semua" ? ` | Sub Unit: ${filterSubUnit}` : ""}
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
              {/* Kolom Pencatatan Waktu */}
              <th>Tgl Registrasi</th>
              <th>Tgl Terima Poli</th>
              <th>Input Tindakan</th>
              <th>Input Asesmen</th>
              <th>Final Poli</th>
              <th>Kirim Order Resep</th>
              <th>Masuk Farmasi</th>
              <th>Selesai Farmasi</th>

              {/* Kolom Waktu Tunggu */}
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
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={26} className="py-4">
                  Tidak ada data pasien pada filter ini.
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
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
                    {item.pasien?.tanggal_lahir
                      ? formatDateOnly(item.pasien.tanggal_lahir)
                      : "-"}{" "}
                    / {calculateAge(item.pasien?.tanggal_lahir)}
                  </td>
                  <td>{item.status_pasien}</td>
                  <td>{item.instalasi}</td>
                  <td>{item.unit_pelayanan}</td>
                  <td>{item.cara_bayar}</td>

                  {/* Pencatatan Waktu */}
                  <td>{formatTimeShort(item.tgl_registrasi)}</td>
                  <td>{formatTimeShort(item.tgl_terima_poli)}</td>
                  <td>{formatTimeShort(item.tgl_input_tindakan)}</td>
                  <td>{formatTimeShort(item.tgl_input_asesmen)}</td>
                  <td>{formatTimeShort(item.tgl_final_poli)}</td>
                  <td>{formatTimeShort(item.tgl_order_resep)}</td>
                  <td>{formatTimeShort(item.tgl_masuk_farmasi)}</td>
                  <td>{formatTimeShort(item.tgl_selesai_farmasi)}</td>

                  {/* Waktu Tunggu / Pelayanan */}
                  <td>
                    {calculateSLAMins(
                      item.tgl_registrasi,
                      item.tgl_terima_poli,
                    )}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
