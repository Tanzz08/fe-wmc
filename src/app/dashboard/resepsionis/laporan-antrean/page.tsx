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
  Chip,
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
  tgl_registrasi: string;
  tgl_terima_poli?: string | null;
  tgl_final_poli?: string | null;
  user_daftar?: { username: string };
}

export default function LaporanAntreanPage() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filterInstalasi, setFilterInstalasi] = useState<string>("Semua");
  const [filterUnit, setFilterUnit] = useState<string>("Semua");
  const [filterSubUnit, setFilterSubUnit] = useState<string>("Semua");

  const { data: listAntrean = [], isLoading } = useQuery<Antrean[]>({
    queryKey: ["laporanKunjunganList"],
    queryFn: async () => {
      const res = await api.get("/antrean");
      const fetchedData = res.data?.data || res.data;
      return Array.isArray(fetchedData) ? fetchedData : [];
    },
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  // Filter Logic
  const filteredData = listAntrean.filter((item) => {
    const itemDate = new Date(item.tgl_registrasi).toISOString().split("T")[0];
    let matchDate = true;
    if (startDate && !endDate) matchDate = itemDate >= startDate;
    else if (!startDate && endDate) matchDate = itemDate <= endDate;
    else if (startDate && endDate)
      matchDate = itemDate >= startDate && itemDate <= endDate;

    const matchInstalasi =
      filterInstalasi === "Semua" || item.instalasi === filterInstalasi;
    const matchUnit =
      filterUnit === "Semua" || item.unit_pelayanan === filterUnit;
    const matchSubUnit =
      filterSubUnit === "Semua" ||
      (item.sub_unit && item.sub_unit === filterSubUnit);

    return matchDate && matchInstalasi && matchUnit && matchSubUnit;
  });

  // Helper Functions
  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " " +
      date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatDateOnly = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const calculateAge = (dobString?: string) => {
    if (!dobString) return "-";
    const now = new Date();
    const dob = new Date(dobString);
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate()))
      age--;
    return age + " Thn";
  };

  const calculateSLAText = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "-";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins >= 0 ? `${diffMins} Menit` : "0 Menit";
  };

  const calculateSLAMins = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "-";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins >= 0 ? diffMins : 0;
  };

  const handlePrint = () => window.print();

  const resetFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilterInstalasi("Semua");
    setFilterUnit("Semua");
    setFilterSubUnit("Semua");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Laporan Riwayat Kunjungan
            </h1>
            <p className="text-sm text-slate-500">
              Filter dan cetak arsip kunjungan pasien.
            </p>
          </div>
          <Button
            color="primary"
            onPress={handlePrint}
            startContent={<Printer size={18} />}
            className="shadow-md font-bold"
          >
            Cetak Laporan (PDF)
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
              <SelectItem key="Poli Anak" value="Poli Anak">
                Poli Anak
              </SelectItem>
              <SelectItem key="Poli Obgyn" value="Poli Obgyn">
                Poli Obgyn
              </SelectItem>
              <SelectItem key="Poli Jiwa" value="Poli Jiwa">
                Poli Jiwa
              </SelectItem>
            </Select>
            <Input
              label="Sub Unit"
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

      <div className="print:hidden">
        <Table
          aria-label="Tabel Laporan Kunjungan"
          className="shadow-sm border border-slate-200"
        >
          <TableHeader>
            <TableColumn>WAKTU KUNJUNGAN</TableColumn>
            <TableColumn>NOPEN / PASIEN</TableColumn>
            <TableColumn>UNIT PELAYANAN</TableColumn>
            <TableColumn>WAKTU TUNGGU</TableColumn>
            <TableColumn>LAMA LAYANAN</TableColumn>
            <TableColumn>CARA BAYAR</TableColumn>
          </TableHeader>
          <TableBody
            items={filteredData}
            emptyContent={isLoading ? <Spinner /> : "Tidak ada data."}
          >
            {(item) => (
              <TableRow key={item.nopen}>
                <TableCell>{formatDateTime(item.tgl_registrasi)}</TableCell>
                <TableCell>
                  <span className="block font-bold">{item.nopen}</span>
                  <span className="text-xs text-slate-500 uppercase">
                    {item.pasien?.nama}
                  </span>
                  <span className="text-xs block text-slate-400">
                    Umur: {calculateAge(item.pasien?.tanggal_lahir)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold">{item.unit_pelayanan}</span>
                </TableCell>
                <TableCell className="text-amber-700 font-medium">
                  {calculateSLAText(item.tgl_registrasi, item.tgl_terima_poli)}
                </TableCell>
                <TableCell className="text-emerald-700 font-medium">
                  {calculateSLAText(item.tgl_terima_poli, item.tgl_final_poli)}
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat">
                    {item.cara_bayar}
                  </Chip>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="hidden print:block print:w-full print:bg-white print:absolute print:top-0 print:left-0 print:z-[99999]">
        <style type="text/css">{`
          @media print {
            @page { size: portrait; margin: 10mm; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #000; padding: 6px 8px; font-size: 11px; text-align: center; }
            th { background-color: #f1f5f9 !important; font-weight: bold; }
            .text-left { text-align: left; }
          }
        `}</style>
        <div className="text-center mb-6 border-b-2 border-slate-800 pb-4">
          <h2 className="text-lg font-bold uppercase">
            Laporan Riwayat Kunjungan Pasien
          </h2>
          <p className="text-sm font-semibold">
            KLINIK WIHDATUL UMMAH MEDICAL CENTER
          </p>
          <p className="text-xs">
            Periode: {startDate ? formatDateOnly(startDate) : "Semua"} s.d{" "}
            {endDate ? formatDateOnly(endDate) : "Sekarang"}
          </p>
        </div>
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Waktu</th>
              <th>No. RM</th>
              <th>NOPEN</th>
              <th>Nama Pasien</th>
              <th>Unit</th>
              <th>Tunggu (Mnt)</th>
              <th>Layanan (Mnt)</th>
              <th>Bayar</th>
              <th>Petugas</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item.nopen}>
                <td>{index + 1}</td>
                <td>{formatDateTime(item.tgl_registrasi)}</td>
                <td>{item.id_rm}</td>
                <td>{item.nopen}</td>
                <td className="text-left uppercase">{item.pasien?.nama}</td>
                <td>{item.unit_pelayanan}</td>
                <td>
                  {calculateSLAMins(item.tgl_registrasi, item.tgl_terima_poli)}
                </td>
                <td>
                  {calculateSLAMins(item.tgl_terima_poli, item.tgl_final_poli)}
                </td>
                <td>{item.cara_bayar}</td>
                <td>{item.user_daftar?.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
