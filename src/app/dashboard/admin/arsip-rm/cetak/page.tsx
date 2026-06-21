"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Spinner } from "@nextui-org/react";
import { Printer, ArrowLeft, AlertTriangle } from "lucide-react";
import api from "@/lib/axios";

function CetakDokumen() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mengambil parameter dari URL
  const id_rm = searchParams.get("id_rm");
  const nopen = searchParams.get("nopen");

  // Ambil data pasien (beserta array rekam medisnya)
  const {
    data: detailPasien,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["pasienDetailCetak", id_rm],
    queryFn: async () => {
      const res = await api.get(`/pasien/${id_rm}`);
      return res.data?.data;
    },
    // Query baru berjalan jika id_rm sudah didapatkan dari URL
    enabled: !!id_rm,
  });

  // Jika sedang loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-slate-500 font-medium">
          Menarik data dari brankas enkripsi...
        </p>
      </div>
    );
  }

  // 1. ERROR: Jika parameter URL tidak lengkap
  if (!id_rm || !nopen) {
    return (
      <div className="p-10 flex flex-col items-center text-center mt-10">
        <AlertTriangle size={48} className="text-warning mb-4" />
        <h2 className="text-xl font-bold text-slate-800">URL Tidak Valid</h2>
        <p className="text-slate-500 mb-4">
          Parameter ID_RM atau NOPEN hilang dari link.
        </p>
        <Button onPress={() => router.back()} color="primary">
          Kembali
        </Button>
      </div>
    );
  }

  // 2. ERROR: Jika API gagal atau pasien tidak ditemukan di Database
  if (isError || !detailPasien) {
    return (
      <div className="p-10 flex flex-col items-center text-center mt-10">
        <AlertTriangle size={48} className="text-danger mb-4" />
        <h2 className="text-xl font-bold text-slate-800">
          Gagal Memuat Data Pasien
        </h2>
        <p className="text-slate-500 mb-4">
          Pasien dengan ID <b>{id_rm}</b> tidak ditemukan atau terjadi masalah
          server.
        </p>
        <Button onPress={() => router.back()} color="default">
          Kembali
        </Button>
      </div>
    );
  }

  // Cari rekam medis yang spesifik sesuai nopen yang di-klik
  const rekamMedis = detailPasien.rekamMedis?.find(
    (rm: any) => rm.nopen === nopen,
  );

  // 3. ERROR: Jika Nopen tidak cocok dengan histori pasien ini
  if (!rekamMedis) {
    return (
      <div className="p-10 flex flex-col items-center text-center mt-10">
        <AlertTriangle size={48} className="text-danger mb-4" />
        <h2 className="text-xl font-bold text-slate-800">
          Riwayat Tidak Ditemukan
        </h2>
        <p className="text-slate-500 mb-4">
          Data pasien <b>{detailPasien.nama}</b> berhasil dimuat, tetapi
          kunjungan dengan Nomor: <br />
          <b className="text-klinik-blue">{nopen}</b> tidak ada di dalam
          riwayatnya.
        </p>
        <Button onPress={() => router.back()} color="default">
          Kembali
        </Button>
      </div>
    );
  }

  // Jika semua data aman, Format Tanggal
  const tglLahir = detailPasien.tanggal_lahir
    ? new Date(detailPasien.tanggal_lahir).toLocaleDateString("id-ID")
    : "-";
  const tglPeriksa = rekamMedis.waktu_periksa
    ? new Date(rekamMedis.waktu_periksa).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

  return (
    <div className="min-h-screen bg-slate-200 py-10 print:py-0 print:bg-white flex flex-col items-center">
      {/* TOMBOL AKSI (Hanya muncul di layar, otomatis hilang di kertas PDF) */}
      <div className="w-full max-w-4xl flex justify-between mb-4 print:hidden px-4">
        <Button
          variant="flat"
          color="default"
          className="bg-white font-semibold"
          startContent={<ArrowLeft size={18} />}
          onPress={() => router.back()}
        >
          Kembali ke Arsip
        </Button>
        <Button
          color="primary"
          className="bg-klinik-blue font-bold shadow-md"
          startContent={<Printer size={18} />}
          onPress={() => window.print()}
        >
          Cetak PDF / Print
        </Button>
      </div>

      {/* KERTAS A4 */}
      <div className="bg-white w-full max-w-4xl p-10 md:p-16 shadow-2xl print:shadow-none print:p-0 text-slate-800 text-sm leading-relaxed">
        {/* KOP SURAT */}
        <div className="flex items-center border-b-4 border-slate-800 pb-6 mb-6">
          <div className="w-20 h-20 bg-blue-100 text-klinik-blue flex items-center justify-center font-black text-2xl rounded-full mr-6">
            WMC
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide">
              Klinik Wira Medika Center
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
              <td className="py-1 w-40 font-semibold text-slate-600">
                No. Rekam Medis
              </td>
              <td className="py-1 w-4">:</td>
              <td className="py-1 font-bold">{detailPasien.id_rm}</td>
              <td className="py-1 w-32 font-semibold text-slate-600">
                No. Pendaftaran
              </td>
              <td className="py-1 w-4">:</td>
              <td className="py-1 font-mono text-xs">{rekamMedis.nopen}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-slate-600">Nama Pasien</td>
              <td className="py-1">:</td>
              <td className="py-1 uppercase font-bold">{detailPasien.nama}</td>
              <td className="py-1 font-semibold text-slate-600">
                Tanggal Periksa
              </td>
              <td className="py-1">:</td>
              <td className="py-1">{tglPeriksa}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-slate-600">
                Tanggal Lahir
              </td>
              <td className="py-1">:</td>
              <td className="py-1">{tglLahir}</td>
              <td className="py-1 font-semibold text-slate-600">
                Jenis Kelamin
              </td>
              <td className="py-1">:</td>
              <td className="py-1">{detailPasien.jenis_kelamin}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold align-top text-slate-600">
                Alamat
              </td>
              <td className="py-1 align-top">:</td>
              <td className="py-1 align-top pr-4">{detailPasien.alamat}</td>
              <td className="py-1 font-semibold align-top text-slate-600">
                No. Telepon
              </td>
              <td className="py-1 align-top">:</td>
              <td className="py-1 align-top">{detailPasien.no_telepon}</td>
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
              {rekamMedis.dokter?.username || "Pemeriksa"}
            </p>
            <p className="text-sm text-slate-500">SIP: _________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// BUNGKUS DENGAN SUSPENSE
export default function CetakRekamMedisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" label="Memuat Format Cetak..." color="primary" />
        </div>
      }
    >
      <CetakDokumen />
    </Suspense>
  );
}
