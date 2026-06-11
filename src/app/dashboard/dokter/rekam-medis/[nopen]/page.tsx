"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
  Spinner,
} from "@nextui-org/react";
import {
  ArrowLeft,
  LockKeyhole,
  Activity,
  Stethoscope,
  Pill,
  Printer,
} from "lucide-react";
import api from "@/lib/axios";

export default function DetailRekamMedisPage() {
  const params = useParams();
  const router = useRouter();
  const nopen = params.nopen as string;

  // Mengambil data detail rekam medis menggunakan React Query
  const {
    data: rm,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["rekamMedisDetail", nopen],
    queryFn: async () => {
      const response = await api.get(`/rekam-medis/${nopen}`);
      return response.data?.data;
    },
    enabled: !!nopen, // Hanya menembak API jika nopen sudah ada
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-10">
        <Spinner size="lg" color="primary" label="Mendekripsi Data Medis..." />
      </div>
    );

  if (error || !rm)
    return (
      <div className="p-4 text-red-500 text-center font-medium bg-red-50 rounded-xl max-w-lg mx-auto mt-10 border border-red-200">
        Gagal memuat atau rekam medis belum diisi.
      </div>
    );

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      {/* Header Halaman dengan Tombol Cetak */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button isIconOnly variant="flat" onPress={() => router.back()}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Detail Ringkasan Pulang
            </h1>
            <p className="text-sm text-slate-500">
              Nomor Pendaftaran: {rm.nopen} | ID Pasien: {rm.id_rm}
            </p>
          </div>
        </div>

        <Button
          color="primary"
          className="bg-klinik-blue font-semibold shadow-sm"
          startContent={<Printer size={18} />}
          onPress={() =>
            router.push(`/dashboard/dokter/rekam-medis/${rm.nopen}/cetak`)
          }
        >
          Cetak Resume Medis
        </Button>
      </div>

      {/* Banner Notifikasi Keamanan */}
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <LockKeyhole size={20} className="text-emerald-600" />
        </div>
        <div className="text-sm">
          <span className="font-bold block">Telah Didekripsi Secara Aman</span>
          Data medis pada halaman ini ditarik dari database dalam bentuk
          Ciphertext dan telah berhasil dikembalikan ke Plaintext menggunakan
          algoritma AES-256-CBC.
        </div>
      </div>

      {/* Biodata Pasien Singkat */}
      <Card className="shadow-sm border border-slate-200">
        <CardBody className="flex flex-row justify-between items-center p-4 bg-slate-50">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">
              Nama Pasien
            </p>
            <p className="text-lg font-bold text-slate-800">
              {rm.pasien?.nama}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-semibold uppercase">
              Dokter Pemeriksa
            </p>
            <p className="text-md font-medium text-klinik-blue">
              {rm.dokter?.username}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* 1. SECTION VITAL SIGN */}
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="flex gap-2 bg-slate-50/50 border-b pb-3 pt-4 px-6">
          <Activity size={18} className="text-blue-500" />
          <h3 className="font-bold text-slate-700">
            Administrasi & Kondisi Keluar
          </h3>
        </CardHeader>
        <CardBody className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-slate-400">Ruang Rawat</p>
            <p className="font-medium">{rm.ruang_rawat || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Cara Keluar</p>
            <Chip size="sm" color="primary" variant="flat">
              {rm.cara_keluar || "-"}
            </Chip>
          </div>
          <div>
            <p className="text-xs text-slate-400">Tensi Darah</p>
            <p className="font-medium">{rm.tensi_darah || "-"} mmHg</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Suhu</p>
            <p className="font-medium">{rm.suhu || "-"} °C</p>
          </div>
        </CardBody>
      </Card>

      {/* 2. SECTION ANAMNESIS & FISIK */}
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="flex gap-2 bg-slate-50/50 border-b pb-3 pt-4 px-6">
          <Stethoscope size={18} className="text-emerald-500" />
          <h3 className="font-bold text-slate-700">
            Anamnesis & Pemeriksaan Penunjang
          </h3>
        </CardHeader>
        <CardBody className="p-6 flex flex-col gap-6">
          <div>
            <p className="text-xs text-slate-400 mb-1">
              Ringkasan Penyakit Sekarang
            </p>
            <p className="text-sm whitespace-pre-wrap">
              {rm.riwayat_sekarang || "-"}
            </p>
          </div>
          <Divider />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-400 mb-1">Pemeriksaan Fisis</p>
              <p className="text-sm whitespace-pre-wrap">
                {rm.pemeriksaan_fisis || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Hasil Laboratorium</p>
              <p className="text-sm whitespace-pre-wrap">
                {rm.laboratorium || "-"}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 3. SECTION DIAGNOSIS & TERAPI */}
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="flex gap-2 bg-slate-50/50 border-b pb-3 pt-4 px-6">
          <Pill size={18} className="text-purple-500" />
          <h3 className="font-bold text-slate-700">
            Diagnosis, Terapi & Edukasi
          </h3>
        </CardHeader>
        <CardBody className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
              <p className="text-xs text-purple-400 mb-1 font-semibold">
                Diagnosis Utama
              </p>
              <div className="flex items-start justify-between">
                <p className="font-bold text-purple-900">
                  {rm.diagnosis_utama || "-"}
                </p>
                {rm.icd10_utama && (
                  <Chip size="sm" color="secondary">
                    {rm.icd10_utama}
                  </Chip>
                )}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-400 mb-1 font-semibold">
                Diagnosis Sekunder
              </p>
              <div className="flex items-start justify-between">
                <p className="font-medium text-slate-700">
                  {rm.diagnosis_sekunder || "-"}
                </p>
                {rm.icd10_sekunder && (
                  <Chip size="sm" variant="flat">
                    {rm.icd10_sekunder}
                  </Chip>
                )}
              </div>
            </div>
          </div>

          <Divider />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-400 mb-1">Terapi / Pengobatan</p>
              <p className="text-sm whitespace-pre-wrap">
                {rm.terapi_pengobatan || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">
                Edukasi & Rencana Diet
              </p>
              <p className="text-sm whitespace-pre-wrap">
                Diet: {rm.rencana_diet || "-"}
              </p>
              <p className="text-sm mt-1 whitespace-pre-wrap">
                {rm.edukasi || "-"}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
