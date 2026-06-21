"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Spinner } from "@nextui-org/react";
import { Printer, ArrowLeft } from "lucide-react";
import api from "@/lib/axios";

function CetakDokumen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id_rm = searchParams.get("id_rm");
  const nopen = searchParams.get("nopen");

  // Ambil data pasien (beserta array rekam medisnya)
  const { data: detailPasien, isLoading } = useQuery({
    queryKey: ["pasienDetailCetak", id_rm],
    queryFn: async () => {
      const res = await api.get(`/pasien/${id_rm}`);
      return res.data?.data;
    },
    enabled: !!id_rm,
  });

  // Cari rekam medis yang spesifik sesuai nopen yang di-klik
  const rekamMedis = detailPasien?.rekamMedis?.find(
    (rm: any) => rm.nopen === nopen,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner
          size="lg"
          label="Menyiapkan Dokumen Cetak..."
          color="primary"
        />
      </div>
    );
  }

  if (!detailPasien || !rekamMedis) {
    return (
      <div className="p-10 text-center text-red-500">
        Data Rekam Medis tidak ditemukan.
      </div>
    );
  }

  // Format Tanggal
  const tglLahir = new Date(detailPasien.tanggal_lahir).toLocaleDateString(
    "id-ID",
  );
  const tglPeriksa = new Date(rekamMedis.waktu_periksa).toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <div className="min-h-screen bg-slate-200 py-10 print:py-0 print:bg-white flex flex-col items-center">
      {/* TOMBOL AKSI (Hanya muncul di layar, hilang saat diprint) */}
      <div className="w-full max-w-4xl flex justify-between mb-4 print:hidden px-4">
        <Button
          variant="flat"
          color="default"
          className="bg-white"
          startContent={<ArrowLeft size={18} />}
          onPress={() => router.back()}
        >
          Kembali
        </Button>
        <Button
          color="primary"
          className="bg-klinik-blue font-bold shadow-md"
          startContent={<Printer size={18} />}
          onPress={() => window.print()}
        >
          Cetak Sekarang
        </Button>
      </div>

      {/* KERTAS A4 */}
      <div className="bg-white w-full max-w-4xl p-10 md:p-16 shadow-2xl print:shadow-none print:p-0 text-slate-800 text-sm leading-relaxed">
        {/* KOP SURAT */}
        <div className="flex items-center border-b-4 border-slate-800 pb-6 mb-6">
          {/* Kamu bisa ganti div di bawah ini dengan tag <img src="/logo.png" /> */}
          <div className="w-20 h-20 bg-blue-100 text-klinik-blue flex items-center justify-center font-bold text-2xl rounded-full mr-6">
            WMC
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide">
              Klinik WMC (Wira Medika Center)
            </h1>
            <p className="text-slate-600">
              Jl. Perintis Kemerdekaan No. 123, Makassar, Sulawesi Selatan
            </p>
            <p className="text-slate-600">
              Telp: (0411) 123456 | Email: info@klinikwmc.com
            </p>
          </div>
        </div>

        <h2 className="text-center text-xl font-bold uppercase underline mb-8">
          Ringkasan Rekam Medis Pasien
        </h2>

        {/* BIODATA PASIEN */}
        <table className="w-full mb-8">
          <tbody>
            <tr>
              <td className="py-1 w-40 font-semibold">No. Rekam Medis</td>
              <td className="py-1 w-4">:</td>
              <td className="py-1 font-bold">{detailPasien.id_rm}</td>
              <td className="py-1 w-32 font-semibold">No. Pendaftaran</td>
              <td className="py-1 w-4">:</td>
              <td className="py-1">{rekamMedis.nopen}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold">Nama Pasien</td>
              <td className="py-1">:</td>
              <td className="py-1 uppercase font-bold">{detailPasien.nama}</td>
              <td className="py-1 font-semibold">Tanggal Periksa</td>
              <td className="py-1">:</td>
              <td className="py-1">{tglPeriksa}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold">Tanggal Lahir</td>
              <td className="py-1">:</td>
              <td className="py-1">{tglLahir}</td>
              <td className="py-1 font-semibold">Jenis Kelamin</td>
              <td className="py-1">:</td>
              <td className="py-1">{detailPasien.jenis_kelamin}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold align-top">Alamat</td>
              <td className="py-1 align-top">:</td>
              <td className="py-1 align-top pr-4">{detailPasien.alamat}</td>
              <td className="py-1 font-semibold">No. Telepon</td>
              <td className="py-1">:</td>
              <td className="py-1">{detailPasien.no_telepon}</td>
            </tr>
          </tbody>
        </table>

        {/* DATA KLINIS */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-8">
          <div className="bg-slate-100 font-bold px-4 py-2 border-b border-slate-300">
            A. Tanda Vital & Kondisi Fisik
          </div>
          <div className="p-4 grid grid-cols-4 gap-4">
            <div>
              <span className="text-slate-500 block text-xs">Tensi Darah</span>
              <span className="font-bold">
                {rekamMedis.tensi_darah || "-"} mmHg
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Suhu Tubuh</span>
              <span className="font-bold">{rekamMedis.suhu || "-"} °C</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Nadi</span>
              <span className="font-bold">{rekamMedis.nadi || "-"} x/mnt</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Pernapasan</span>
              <span className="font-bold">{rekamMedis.napas || "-"} x/mnt</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block text-xs">Keadaan Umum</span>
              <span className="font-bold capitalize">
                {rekamMedis.keadaan_umum || "-"}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block text-xs">Kesadaran</span>
              <span className="font-bold capitalize">
                {rekamMedis.kesadaran || "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="border border-slate-300 rounded-lg overflow-hidden mb-8">
          <div className="bg-slate-100 font-bold px-4 py-2 border-b border-slate-300">
            B. Anamnesis & Diagnosis
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div>
              <p className="font-semibold text-slate-600">
                Riwayat Penyakit Sekarang (Keluhan):
              </p>
              <p className="whitespace-pre-wrap mt-1">
                {rekamMedis.riwayat_sekarang || "-"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-600">Pemeriksaan Fisis:</p>
              <p className="whitespace-pre-wrap mt-1">
                {rekamMedis.pemeriksaan_fisis || "-"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-600">Diagnosis Utama:</p>
              <p className="whitespace-pre-wrap mt-1 font-bold text-base uppercase">
                {rekamMedis.diagnosis_utama || "-"}
                {rekamMedis.icd10_utama &&
                  ` (ICD-10: ${rekamMedis.icd10_utama})`}
              </p>
            </div>
          </div>
        </div>

        <div className="border border-slate-300 rounded-lg overflow-hidden mb-8">
          <div className="bg-slate-100 font-bold px-4 py-2 border-b border-slate-300">
            C. Terapi & Tindak Lanjut
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div>
              <p className="font-semibold text-slate-600">
                Terapi / Pengobatan:
              </p>
              <p className="whitespace-pre-wrap mt-1">
                {rekamMedis.terapi_pengobatan || "-"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-slate-600">Edukasi / Diet:</p>
                <p className="whitespace-pre-wrap mt-1">
                  {rekamMedis.edukasi || rekamMedis.rencana_diet || "-"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-600">
                  Tindak Lanjut (Cara Keluar):
                </p>
                <p className="whitespace-pre-wrap mt-1 font-bold uppercase">
                  {rekamMedis.cara_keluar?.replace(/_/g, " ") || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TANDA TANGAN */}
        <div className="flex justify-end mt-16 pt-8">
          <div className="text-center w-64">
            <p className="mb-16">Makassar, {tglPeriksa}</p>
            <p className="font-bold underline uppercase">
              Dr. {rekamMedis.dokter?.username}
            </p>
            <p className="text-sm text-slate-500">Dokter Pemeriksa</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// BUNGKUS DENGAN SUSPENSE KARENA MENGGUNAKAN useSearchParams
export default function CetakRekamMedisPage() {
  return (
    <Suspense
      fallback={<div className="p-10 text-center">Memuat Dokumen...</div>}
    >
      <CetakDokumen />
    </Suspense>
  );
}
