"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@nextui-org/react";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Activity,
  ShieldCheck,
  Eye,
} from "lucide-react";
import api from "@/lib/axios";

export default function DetailPasienPage() {
  const params = useParams();
  const router = useRouter();
  const id_rm = params.id_rm as string;

  // 1. Tarik data menggunakan React Query (Pengganti SWR)
  const { data: p, error, isLoading } = useQuery({
    queryKey: ["pasienDetail", id_rm],
    queryFn: async () => {
      const response = await api.get(`/pasien/${id_rm}`);
      // Backend mengembalikan { message, data }, jadi kita ambil .data
      return response.data.data;
    },
    enabled: !!id_rm, // Hanya menembak API jika id_rm sudah terbaca
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-10">
        <Spinner size="lg" color="primary" label="Mendekripsi Data Pasien..." />
      </div>
    );

  if (error || !p)
    return (
      <div className="p-4 text-red-500 text-center font-medium">
        Gagal memuat data pasien.
      </div>
    );

  // 2. Memastikan riwayatRM adalah array dan kebal dari error "No key found"
  const riwayatRM = Array.isArray(p.rekamMedis)
    ? p.rekamMedis.map((rm: any, index: number) => ({
        ...rm,
        safeKey: rm.nopen || `fallback-rm-${index}`,
      }))
    : [];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="flat" onPress={() => router.back()}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Master Data & Riwayat Pasien
          </h1>
          <p className="text-sm text-slate-500">Nomor Rekam Medis: {p.id_rm}</p>
        </div>
      </div>

      {/* BANNER KEAMANAN AES */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 p-4 rounded-xl text-blue-800 shadow-sm">
        <div className="p-2 bg-blue-100 rounded-lg">
          <ShieldCheck size={20} className="text-blue-600" />
        </div>
        <div className="text-sm">
          <span className="font-bold block">Protected by AES-256-CBC</span>
          Identitas Pribadi (PII) dan Riwayat Medis pasien ini ditarik dari
          bentuk Ciphertext dan telah didekripsi secara aman.
        </div>
      </div>

      {/* CARD BIODATA PASIEN */}
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="flex gap-2 bg-slate-50/50 border-b pb-3 pt-4 px-6">
          <User size={18} className="text-klinik-blue" />
          <h3 className="font-bold text-slate-700">Biodata Lengkap Pasien</h3>
        </CardHeader>
        <CardBody className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">
                Nama Lengkap
              </p>
              <p className="text-lg font-bold text-slate-800">{p.nama}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">
                Nomor Induk Kependudukan (NIK)
              </p>
              <p className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block mt-1 font-medium">
                {p.nik}
              </p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">
                  Jenis Kelamin
                </p>
                <Chip
                  size="sm"
                  color={
                    p.jenis_kelamin === "Laki-laki" || p.jenis_kelamin === "Laki-Laki" ? "primary" : "secondary"
                  }
                  variant="flat"
                >
                  {p.jenis_kelamin}
                </Chip>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">
                  Tgl Lahir
                </p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar size={14} className="text-slate-400" />
                  {new Date(p.tanggal_lahir).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1">
                Nomor Telepon
              </p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Phone size={14} className="text-slate-400" /> {p.no_telepon}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1">
                Alamat Domisili
              </p>
              <div className="flex items-start gap-2 text-sm font-medium">
                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <span>{p.alamat}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1">
                Terdaftar Pada
              </p>
              <p className="text-sm font-medium text-slate-600">
                {new Date(p.waktu_daftar).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* TABEL RIWAYAT KUNJUNGAN & MEDIS */}
      <div className="mt-2">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-emerald-500" /> Histori Kunjungan
          Medis
        </h3>

        <Table
          aria-label="Tabel Riwayat Rekam Medis Pasien"
          className="shadow-sm border border-slate-200"
        >
          <TableHeader>
            <TableColumn>TANGGAL PERIKSA</TableColumn>
            <TableColumn>NO. PENDAFTARAN</TableColumn>
            <TableColumn>DIAGNOSIS UTAMA</TableColumn>
            <TableColumn>DOKTER</TableColumn>
            <TableColumn>AKSI</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              "Pasien ini belum memiliki riwayat pemeriksaan medis."
            }
            items={riwayatRM}
          >
            {/* Kita memanggil rm.safeKey yang sudah kita jamin ada di atas */}
            {(rm: any) => (
              <TableRow key={rm.safeKey}>
                <TableCell className="font-medium text-slate-700">
                  {new Date(rm.waktu_periksa).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-500">
                  {rm.nopen}
                </TableCell>
                <TableCell>
                  {rm.diagnosis_utama ? (
                    <Chip size="sm" color="secondary" variant="flat">
                      {rm.diagnosis_utama}
                    </Chip>
                  ) : (
                    <span className="text-xs italic text-slate-400">
                      Belum dicatat
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {rm.dokter?.username || "-"}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    color="primary"
                    variant="light"
                    startContent={<Eye size={16} />}
                    onPress={() =>
                      router.push(
                        `/dashboard/resepsionis/rekam-medis/${rm.nopen}`
                      )
                    }
                  >
                    Detail
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}