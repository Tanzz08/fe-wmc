"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Spinner } from "@nextui-org/react";
import { Printer, ArrowLeft } from "lucide-react";
import api from "@/lib/axios";

export default function CetakRekamMedisPage() {
  const params = useParams();
  const nopen = params.nopen as string;

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
    enabled: !!nopen,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-10">
        <Spinner size="lg" />
      </div>
    );

  if (error || !rm)
    return <div className="p-4 text-center">Data tidak ditemukan.</div>;

  let lamaDirawat = "-";
  if (rm.tgl_masuk && rm.tgl_keluar) {
    const msDiff =
      new Date(rm.tgl_keluar).getTime() - new Date(rm.tgl_masuk).getTime();
    const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    lamaDirawat = `${daysDiff} Hari`;
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr)
      .toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(/\./g, ":");
  };

  return (
    <>
      {/* JURUS CSS KHUSUS PRINT: Mencegah Header/Footer Browser dan Memaksa Warna Tampil */}
      <style type="text/css">
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 0; /* Menghapus teks URL dan Tanggal otomatis dari browser */
            }
            body {
              margin: 0;
              -webkit-print-color-adjust: exact !important; /* Memaksa background hitam tercetak */
              print-color-adjust: exact !important;
            }
            /* Menyembunyikan sidebar dan header utama aplikasi agar tidak mengganggu layout cetak */
            aside, header, nav {
              display: none !important;
            }
          }
        `}
      </style>

      {/* 
        Tambahan Tailwind print:absolute print:inset-0 print:z-[99999] 
        Ini akan "mencabut" halaman ini dari layout dashboard saat di-print
      */}
      <div className="min-h-screen bg-slate-200 py-8 font-serif print:bg-white print:py-0 print:absolute print:left-0 print:top-0 print:w-full print:z-[99999] print:block">
        {/* Tombol Kontrol */}
        <div className="max-w-[210mm] mx-auto mb-4 flex justify-between print:hidden px-4 sm:px-0">
          <Button
            variant="flat"
            className="bg-white shadow-sm"
            onPress={() => window.history.back()}
            startContent={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
          <Button
            color="primary"
            className="shadow-sm font-semibold"
            onPress={handlePrint}
            startContent={<Printer size={16} />}
          >
            Cetak PDF / Print
          </Button>
        </div>

        {/* KERTAS A4 */}
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white p-[10mm] shadow-lg print:shadow-none print:w-[210mm] print:h-[297mm] print:p-[15mm] print:m-0 text-[11px] leading-tight text-black border border-transparent print:border-none box-border print:overflow-hidden">
          {/* KOP SURAT */}
          <div className="flex border border-black mb-1">
            <div className="w-20 flex items-center justify-center border-r border-black p-2">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-[8px] overflow-hidden">
                <img
                  src="/img/image.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="flex-1 text-center flex flex-col justify-center py-2">
              <h1 className="font-bold text-lg uppercase">
                WIHDATUL UMMAH MEDICAL CENTER
              </h1>
              <p>
                Jl. DR. Leimena No.9, Tello Baru, Kec. Panakkukang, Kota
                Makassar
              </p>
            </div>
          </div>

          {/* JUDUL */}
          <div className="bg-black text-white text-center font-bold py-1 mb-1 text-sm uppercase">
            Ringkasan Pulang
          </div>

          {/* IDENTITAS GRID */}
          <div className="border border-black flex flex-col">
            <div className="flex border-b border-black">
              <div className="flex-1 border-r border-black p-1">
                <span className="block">Nama Pasien :</span>
                <span className="font-bold uppercase">{rm.pasien?.nama}</span>
              </div>
              <div className="w-1/4 border-r border-black p-1">
                <span className="block">No RM :</span>
                <span className="font-bold">{rm.id_rm}</span>
              </div>
              <div className="w-1/4 border-r border-black p-1">
                <span className="block">Tgl Lahir :</span>
                <span className="font-bold">
                  {rm.pasien?.tanggal_lahir
                    ? new Date(rm.pasien.tanggal_lahir).toLocaleDateString(
                        "id-ID",
                      )
                    : "-"}
                </span>
              </div>
              <div className="w-1/4 p-1">
                <span className="block">Jenis Kelamin :</span>
                <span className="font-bold">{rm.pasien?.jenis_kelamin}</span>
              </div>
            </div>

            <div className="flex border-b border-black">
              <div className="w-1/4 border-r border-black p-1">
                <span className="block">Tgl Masuk :</span>
                <span className="font-bold">{formatDate(rm.tgl_masuk)}</span>
              </div>
              <div className="w-1/4 border-r border-black p-1">
                <span className="block">Tgl Keluar :</span>
                <span className="font-bold">{formatDate(rm.tgl_keluar)}</span>
              </div>
              <div className="w-1/4 border-r border-black p-1">
                <span className="block">Lama Dirawat :</span>
                <span className="font-bold">{lamaDirawat}</span>
              </div>
              <div className="w-1/4 p-1">
                <span className="block">Ruang Rawat Terakhir :</span>
                <span className="font-bold">{rm.ruang_rawat || "-"}</span>
              </div>
            </div>

            <div className="flex">
              <div className="w-1/2 border-r border-black p-1">
                <span className="block">Penanggung Pembayaran :</span>
                <span className="font-bold uppercase">
                  {rm.antrean?.cara_bayar || "UMUM"}
                </span>
              </div>
              <div className="w-1/2 p-1">
                <span className="block">Indikasi Rawat Inap :</span>
                <span className="font-bold uppercase">
                  {rm.diagnosis_utama || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* TABEL KLINIS (ANAMNESIS & FISIK) */}
          <div className="border-x border-b border-black flex">
            <div className="w-1/4 border-r border-black p-1">
              Ringkasan Riwayat Penyakit :
            </div>
            <div className="w-3/4 p-1 flex flex-col gap-2">
              <div>
                <span className="font-bold">Ringkasan Penyakit Sekarang :</span>
                <p className="whitespace-pre-wrap">
                  {rm.riwayat_sekarang || "-"}
                </p>
              </div>
              <div>
                <span className="font-bold">Ringkasan Penyakit Dahulu :</span>
                <p className="whitespace-pre-wrap">
                  {rm.riwayat_dahulu || "Tidak Ada"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-x border-b border-black flex">
            <div className="w-1/4 border-r border-black p-1">
              Pemeriksaan Fisis :
            </div>
            <div className="w-3/4 p-1 whitespace-pre-wrap">
              {rm.pemeriksaan_fisis ||
                `KU: ${rm.keadaan_umum || "-"}\nHR: ${rm.nadi || "-"} kali/menit\nRR: ${rm.napas || "-"} kali/menit\nSuhu: ${rm.suhu || "-"} °C`}
            </div>
          </div>

          <div className="border-x border-b border-black flex">
            <div className="w-1/4 border-r border-black p-1">
              Pemeriksaan Penunjang / Diagnostik Terpenting :
            </div>
            <div className="w-3/4 p-1 flex flex-col gap-1">
              <span className="font-bold">Laboratorium :</span>
              <p className="whitespace-pre-wrap">
                {rm.laboratorium || "DR TERLAMPIR"}
              </p>
              <span className="font-bold mt-1">Radiologi :</span>
              <p className="whitespace-pre-wrap">
                {rm.radiologi || "FOTO THORAKS TERLAMPIR"}
              </p>
            </div>
          </div>

          {/* TABEL DIAGNOSIS & TINDAKAN */}
          <table className="w-full border-x border-b border-black text-left mt-1">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="p-1 border-r border-black w-[25%]">
                  Diagnosis Utama
                </th>
                <th className="p-1 border-r border-black w-[10%]">ICD 10</th>
                <th className="p-1 border-r border-black w-[35%]">
                  Terapi / Pengobatan
                </th>
                <th className="p-1 w-[30%]">Tindakan/Prosedur</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black align-top">
                <td className="p-1 border-r border-black uppercase">
                  {rm.diagnosis_utama || "-"}
                </td>
                <td className="p-1 border-r border-black">
                  {rm.icd10_utama || "-"}
                </td>
                <td className="p-1 border-r border-black whitespace-pre-wrap uppercase">
                  {rm.terapi_pengobatan || "-"}
                </td>
                <td className="p-1 whitespace-pre-wrap uppercase">
                  {rm.tindakan_prosedur || "-"}
                </td>
              </tr>
              <tr className="font-bold border-b border-black">
                <td className="p-1 border-r border-black">
                  Diagnosis Sekunder
                </td>
                <td className="p-1 border-r border-black">ICD 10</td>
                <td colSpan={2} className="p-1 bg-slate-50"></td>
              </tr>
              <tr className="align-top border-b border-black">
                <td className="p-1 border-r border-black uppercase">
                  {rm.diagnosis_sekunder || "-"}
                </td>
                <td className="p-1 border-r border-black">
                  {rm.icd10_sekunder || "-"}
                </td>
                <td colSpan={2} className="p-1"></td>
              </tr>
            </tbody>
          </table>

          <div className="border-x border-b border-black flex p-1">
            <div className="w-1/4">Alergi (Reaksi Obat) :</div>
            <div className="w-3/4 font-bold">{rm.alergi || "Tidak Ada"}</div>
          </div>

          {/* STATUS KELUAR */}
          <div className="border-x border-b border-black flex">
            <div className="w-1/2 border-r border-black p-1">
              <span className="block mb-1">Kondisi Waktu Keluar RS :</span>
              <div className="flex gap-4">
                <span>{rm.kondisi_keluar === "Sembuh" ? "☑" : "☐"} SEMBUH</span>
                <span>
                  {rm.kondisi_keluar === "Belum Sembuh" ? "☑" : "☐"} BELUM
                  SEMBUH
                </span>
                <span>
                  {rm.kondisi_keluar === "Membaik" ? "☑" : "☐"} MEMBAIK
                </span>
              </div>
              <span className="block mt-2 font-bold">Kondisi Umum :</span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                <div>
                  Tekanan Darah:{" "}
                  <span className="font-bold">
                    {rm.tensi_darah || "0/0"} mmHg
                  </span>
                </div>
                <div>
                  Nadi:{" "}
                  <span className="font-bold">{rm.nadi || "0"} x/Menit</span>
                </div>
                <div>
                  Napas:{" "}
                  <span className="font-bold">{rm.napas || "0"} x/Menit</span>
                </div>
                <div>
                  Suhu: <span className="font-bold">{rm.suhu || "0"} °C</span>
                </div>
              </div>
              <div className="mt-1">
                Kesadaran:{" "}
                <span className="font-bold">
                  {rm.kesadaran || "Sadar Baik / Alert"}
                </span>
              </div>
            </div>
            <div className="w-1/2 p-1">
              <span className="block mb-1">Cara Keluar :</span>
              <div className="flex flex-col">
                <span>
                  {rm.cara_keluar === "Diijinkan Pulang" ? "☑" : "☐"} DIIJINKAN
                  PULANG
                </span>
                <span>
                  {rm.cara_keluar === "Pulang Paksa" ? "☑" : "☐"} PULANG ATAS
                  PERMINTAAN SENDIRI
                </span>
                <span>{rm.cara_keluar === "Rujuk" ? "☑" : "☐"} DIRUJUK KE</span>
              </div>
            </div>
          </div>

          {/* TANDA TANGAN */}
          <div className="flex justify-between mt-8 p-1">
            <div className="text-center w-1/3 flex flex-col justify-end">
              <p className="mb-16">Pasien/Keluarga</p>
              <p>( ................................. )</p>
            </div>
            <div className="text-center w-1/3 flex flex-col justify-end">
              <p className="font-bold uppercase">
                MAKASSAR, {formatDate(new Date().toISOString())}
              </p>
              <p className="mb-16">Dokter Penanggung Jawab Pelayanan</p>
              <p className="font-bold underline uppercase">
                dr. {rm.dokter?.username}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
