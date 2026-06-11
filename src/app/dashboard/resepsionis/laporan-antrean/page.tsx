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
  pasien: { nama: string; jenis_kelamin: string };
  status_pasien: string;
  cara_bayar: string;
  instalasi: string;
  unit_pelayanan: string;
  sub_unit?: string | null;
  tgl_registrasi: string;
  tgl_terima_poli?: string | null;
  tgl_final_poli?: string | null;
  dokter?: { username: string };
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
  });

  // Filter Logic Bertingkat (Dengan Rentang Tanggal)
  const filteredData = listAntrean.filter((item) => {
    // 1. Filter Tanggal (Bisa salah satu kosong, atau keduanya diisi)
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

  // Helper: Format Waktu (Jam:Menit:Detik)
  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
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

  // Helper: Hitung Durasi SLA dalam Menit
  const calculateSLA = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "-";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return `${diffMins} Menit`;
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

      {/* 2. TABEL VERSI UI WEB (NEXTUI) */}
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
                  {formatTime(item.tgl_registrasi)} ➔{" "}
                  {formatTime(item.tgl_terima_poli)}
                </TableCell>

                {/* WAKTU TUNGGU: Daftar -> Terima Poli */}
                <TableCell className="bg-amber-50 font-bold text-amber-700">
                  {calculateSLA(item.tgl_registrasi, item.tgl_terima_poli)}
                </TableCell>

                {/* LAMA LAYANAN: Terima Poli -> Selesai Poli */}
                <TableCell className="bg-emerald-50 font-bold text-emerald-700">
                  {calculateSLA(item.tgl_terima_poli, item.tgl_final_poli)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. TABEL VERSI CETAK PDF (RAW HTML - LEDGER STYLE) */}
      <div className="hidden print:block print:w-full print:bg-white print:absolute print:top-0 print:left-0 print:z-[99999]">
        <style type="text/css">
          {`
            @media print {
              @page { size: landscape; margin: 10mm; }
              body { background-color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              aside, nav, header { display: none !important; }
              .ledger-table th, .ledger-table td { border: 1px solid #000; padding: 4px; font-size: 9px; text-align: center; }
              .ledger-table th { background-color: #f1f5f9 !important; font-weight: bold; }
            }
          `}
        </style>

        <div className="text-center mb-4">
          <h2 className="text-lg font-bold uppercase">
            Laporan Register Antrean Pasien
          </h2>
          <p className="text-sm">WIHDATUL UMMAH MEDICAL CENTER</p>
          <p className="text-xs mt-1 pb-2">
            Periode: {startDate ? formatDateOnly(startDate) : "Awal"} s.d{" "}
            {endDate ? formatDateOnly(endDate) : "Akhir"}
            {" | "} Instalasi: {filterInstalasi} | Unit: {filterUnit}
            {filterSubUnit !== "Semua" ? ` | Sub Unit: ${filterSubUnit}` : ""}
          </p>
        </div>

        <table className="ledger-table w-full border-collapse">
          <thead>
            <tr>
              <th rowSpan={2} className="w-8">
                NO
              </th>
              <th rowSpan={2}>TANGGAL</th>
              <th rowSpan={2}>NO PENDAFTARAN</th>
              <th rowSpan={2}>NO RM</th>
              <th rowSpan={2}>NAMA PASIEN</th>
              <th rowSpan={2}>L/P</th>
              <th rowSpan={2}>CARA BAYAR</th>
              <th colSpan={3}>LOKASI PELAYANAN</th>
              <th colSpan={3}>PENCATATAN WAKTU</th>
              <th colSpan={2}>MUTU WAKTU (SLA)</th>
            </tr>
            <tr>
              <th>INSTALASI</th>
              <th>UNIT</th>
              <th>SUB UNIT</th>
              <th>DAFTAR</th>
              <th>DIPANGGIL</th>
              <th>SELESAI</th>
              <th>WAKTU TUNGGU</th>
              <th>WAKTU LAYANAN</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-4">
                  Tidak ada data pasien pada filter ini.
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr key={item.nopen}>
                  <td>{index + 1}</td>
                  <td>{formatDateOnly(item.tgl_registrasi)}</td>
                  <td className="font-mono">{item.nopen}</td>
                  <td>{item.id_rm}</td>
                  <td className="text-left px-2 uppercase">
                    {item.pasien?.nama}
                  </td>
                  <td>
                    {item.pasien?.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                  </td>
                  <td>{item.cara_bayar}</td>
                  <td>{item.instalasi}</td>
                  <td>{item.unit_pelayanan}</td>
                  <td>{item.sub_unit || "-"}</td>
                  <td>{formatTime(item.tgl_registrasi)}</td>
                  <td>{formatTime(item.tgl_terima_poli)}</td>
                  <td>{formatTime(item.tgl_final_poli)}</td>
                  <td className="font-bold">
                    {calculateSLA(item.tgl_registrasi, item.tgl_terima_poli)}
                  </td>
                  <td className="font-bold">
                    {calculateSLA(item.tgl_terima_poli, item.tgl_final_poli)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
