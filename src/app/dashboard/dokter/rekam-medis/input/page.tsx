"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Tabs,
  Tab,
  Select,
  SelectItem,
  Spinner,
} from "@nextui-org/react";
import { Save, Activity, Stethoscope, Pill, ArrowLeft } from "lucide-react";
import api from "@/lib/axios";

// =========================================================================
// 1. SKEMA VALIDASI YUP
// =========================================================================
const rekamMedisSchema = yup.object().shape({
  tgl_masuk: yup.string().optional(),
  tgl_keluar: yup.string().optional(),
  ruang_rawat: yup.string().optional(),
  keadaan_umum: yup.string().optional(),
  kesadaran: yup.string().optional(),
  tensi_darah: yup.string().optional(),
  nadi: yup.string().optional(),
  napas: yup.string().optional(),
  suhu: yup.string().optional(),
  skala_nyeri: yup.string().optional(),
  kondisi_keluar: yup.string().optional(),
  cara_keluar: yup.string().optional(),

  riwayat_sekarang: yup.string().optional(),
  riwayat_dahulu: yup.string().optional(),
  alergi: yup.string().optional(),
  pemeriksaan_fisis: yup.string().optional(),
  laboratorium: yup.string().optional(),
  radiologi: yup.string().optional(),

  diagnosis_utama: yup.string().required("Diagnosis utama wajib diisi"),
  icd10_utama: yup.string().optional(),
  diagnosis_sekunder: yup.string().optional(),
  icd10_sekunder: yup.string().optional(),
  terapi_pengobatan: yup.string().optional(),
  tindakan_prosedur: yup.string().optional(),
  icd9_tindakan: yup.string().optional(),
  rencana_diet: yup.string().optional(),
  edukasi: yup.string().optional(),
  instruksi_pulang: yup.string().optional(),
});

type RekamMedisFormData = yup.InferType<typeof rekamMedisSchema>;

// =========================================================================
// 2. KOMPONEN INTI (FORM REKAM MEDIS)
// =========================================================================
function RekamMedisForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const nopen = searchParams.get("nopen");
  const id_rm = searchParams.get("id_rm");

  const [globalError, setGlobalError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RekamMedisFormData>({
    resolver: yupResolver(rekamMedisSchema) as any,
  });

  // Tarik data Obat dari Database
  const { data: listObat = [] } = useQuery({
    queryKey: ["obatList"],
    queryFn: async () => {
      try {
        const res = await api.get("/obat");
        return res.data?.data || [];
      } catch (error) {
        return [];
      }
    },
  });

  // Mutasi untuk menyimpan Rekam Medis
  const mutation = useMutation({
    mutationFn: async (data: RekamMedisFormData) => {
      return await api.post("/rekam-medis", {
        nopen,
        id_rm,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["antreanDokter"] });
      alert("Rekam Medis (Ringkasan Pulang) berhasil disimpan dan dienkripsi!");
      router.push("/dashboard/dokter/antrean");
    },
    onError: (error: any) => {
      setGlobalError(
        error.response?.data?.message || "Gagal menyimpan rekam medis.",
      );
    },
  });

  const onSubmit: SubmitHandler<RekamMedisFormData> = (data) => {
    setGlobalError("");
    mutation.mutate(data);
  };

  if (!nopen || !id_rm) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center border border-red-200 bg-red-50 rounded-xl max-w-lg mx-auto mt-10">
        <p className="text-red-600 font-bold text-lg mb-2">Akses Ditolak</p>
        <p className="text-red-500 text-sm mb-4">
          Parameter Nomor Pendaftaran atau ID RM tidak ditemukan.
        </p>
        <Button
          color="primary"
          onPress={() => router.push("/dashboard/dokter/antrean")}
        >
          Kembali ke Antrean
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="flat" onPress={() => router.back()}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Pengisian Ringkasan Pulang
          </h1>
          <p className="text-sm text-slate-500">
            Nomor Pendaftaran: <span className="font-semibold">{nopen}</span> |
            ID Pasien: <span className="font-semibold">{id_rm}</span>
          </p>
        </div>
      </div>

      {globalError && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-sm border border-slate-200">
          <CardBody className="p-0">
            <Tabs
              aria-label="Form Sections"
              variant="underlined"
              classNames={{ tabList: "px-6 pt-4", panel: "p-6 bg-slate-50/50" }}
            >
              {/* TAB 1: VITAL SIGN & ADMINISTRASI */}
              <Tab
                key="vital"
                title={
                  <div className="flex items-center gap-2">
                    <Activity size={16} />
                    <span>Tanda Vital & Admin</span>
                  </div>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-4 md:border-r pr-0 md:pr-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">
                      Data Administrasi
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mt-1">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">
                          Tgl Masuk
                        </label>
                        <Input
                          {...register("tgl_masuk")}
                          type="datetime-local"
                          variant="bordered"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">
                          Tgl Keluar
                        </label>
                        <Input
                          {...register("tgl_keluar")}
                          type="datetime-local"
                          variant="bordered"
                        />
                      </div>
                    </div>
                    <Input
                      {...register("ruang_rawat")}
                      label="Ruang Rawat (Misal: Kelas II)"
                      variant="bordered"
                    />

                    <Select
                      {...register("kondisi_keluar")}
                      label="Kondisi Keluar"
                      variant="bordered"
                      selectedKeys={
                        watch("kondisi_keluar")
                          ? [watch("kondisi_keluar")!]
                          : []
                      }
                      onSelectionChange={(keys) =>
                        setValue(
                          "kondisi_keluar",
                          Array.from(keys)[0] as string,
                        )
                      }
                    >
                      <SelectItem key="Sembuh" value="Sembuh">
                        Sembuh
                      </SelectItem>
                      <SelectItem key="Belum Sembuh" value="Belum Sembuh">
                        Belum Sembuh / Stabil
                      </SelectItem>
                      <SelectItem key="Membaik" value="Membaik">
                        Membaik
                      </SelectItem>
                      <SelectItem key="Memburuk" value="Memburuk">
                        Memburuk / Kritis
                      </SelectItem>
                    </Select>

                    <Select
                      {...register("cara_keluar")}
                      label="Cara Keluar / Tindak Lanjut"
                      variant="bordered"
                      selectedKeys={
                        watch("cara_keluar") ? [watch("cara_keluar")!] : []
                      }
                      onSelectionChange={(keys) =>
                        setValue("cara_keluar", Array.from(keys)[0] as string)
                      }
                    >
                      <SelectItem
                        key="Diijinkan Pulang"
                        value="Diijinkan Pulang"
                      >
                        Diijinkan Pulang / Rawat Jalan
                      </SelectItem>
                      <SelectItem key="Kontrol Ulang" value="Kontrol Ulang">
                        Disarankan Kontrol Ulang
                      </SelectItem>
                      <SelectItem key="Dirujuk" value="Dirujuk">
                        Rujuk ke RS / Spesialis
                      </SelectItem>
                      <SelectItem key="Rawat Inap" value="Rawat Inap">
                        Indikasi Rawat Inap
                      </SelectItem>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">
                      Kondisi Waktu Keluar
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        {...register("tensi_darah")}
                        label="Tensi Darah (mmHg)"
                        placeholder="120/80"
                        variant="bordered"
                      />
                      <Input
                        {...register("nadi")}
                        label="Nadi (x/Menit)"
                        placeholder="96"
                        variant="bordered"
                      />
                      <Input
                        {...register("napas")}
                        label="Napas (x/Menit)"
                        placeholder="32"
                        variant="bordered"
                      />
                      <Input
                        {...register("suhu")}
                        label="Suhu (°C)"
                        placeholder="36.5"
                        variant="bordered"
                      />
                    </div>

                    <Select
                      {...register("keadaan_umum")}
                      label="Keadaan Umum"
                      variant="bordered"
                      selectedKeys={
                        watch("keadaan_umum") ? [watch("keadaan_umum")!] : []
                      }
                      onSelectionChange={(keys) =>
                        setValue("keadaan_umum", Array.from(keys)[0] as string)
                      }
                    >
                      <SelectItem key="Tampak Baik" value="Tampak Baik">
                        Tampak Baik
                      </SelectItem>
                      <SelectItem
                        key="Tampak Sakit Sedang"
                        value="Tampak Sakit Sedang"
                      >
                        Tampak Sakit Sedang
                      </SelectItem>
                      <SelectItem
                        key="Tampak Sakit Berat"
                        value="Tampak Sakit Berat"
                      >
                        Tampak Sakit Berat
                      </SelectItem>
                    </Select>

                    <Select
                      {...register("kesadaran")}
                      label="Kesadaran (GCS)"
                      variant="bordered"
                      selectedKeys={
                        watch("kesadaran") ? [watch("kesadaran")!] : []
                      }
                      onSelectionChange={(keys) =>
                        setValue("kesadaran", Array.from(keys)[0] as string)
                      }
                    >
                      <SelectItem key="Compos Mentis" value="Compos Mentis">
                        Compos Mentis (Sadar Penuh)
                      </SelectItem>
                      <SelectItem key="Apatis" value="Apatis">
                        Apatis (Acuh tak acuh)
                      </SelectItem>
                      <SelectItem key="Somnolen" value="Somnolen">
                        Somnolen (Mengantuk)
                      </SelectItem>
                      <SelectItem key="Sopor" value="Sopor">
                        Sopor (Tidur Nyenyak)
                      </SelectItem>
                      <SelectItem key="Koma" value="Koma">
                        Koma
                      </SelectItem>
                    </Select>

                    <Select
                      {...register("skala_nyeri")}
                      label="Skala Nyeri (0-10)"
                      variant="bordered"
                      selectedKeys={
                        watch("skala_nyeri") ? [watch("skala_nyeri")!] : []
                      }
                      onSelectionChange={(keys) =>
                        setValue("skala_nyeri", Array.from(keys)[0] as string)
                      }
                    >
                      <SelectItem key="0 - Tidak Nyeri" value="0 - Tidak Nyeri">
                        0 - Tidak Nyeri
                      </SelectItem>
                      <SelectItem
                        key="1-3 (Nyeri Ringan)"
                        value="1-3 (Nyeri Ringan)"
                      >
                        1-3 - Nyeri Ringan
                      </SelectItem>
                      <SelectItem
                        key="4-6 (Nyeri Sedang)"
                        value="4-6 (Nyeri Sedang)"
                      >
                        4-6 - Nyeri Sedang
                      </SelectItem>
                      <SelectItem
                        key="7-10 (Nyeri Berat)"
                        value="7-10 (Nyeri Berat)"
                      >
                        7-10 - Nyeri Berat
                      </SelectItem>
                    </Select>
                  </div>
                </div>
              </Tab>

              {/* TAB 2: ANAMNESIS & FISIK */}
              <Tab
                key="anamnesis"
                title={
                  <div className="flex items-center gap-2">
                    <Stethoscope size={16} />
                    <span>Anamnesis & Penunjang</span>
                  </div>
                }
              >
                <div className="flex flex-col gap-6">
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-700 mb-2">
                    ℹ️ Data pada halaman ini diklasifikasikan sebagai data medis
                    sensitif dan akan dienkripsi menggunakan algoritma
                    AES-256-CBC saat disimpan.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Textarea
                      {...register("riwayat_sekarang")}
                      label="Ringkasan Penyakit Sekarang"
                      minRows={4}
                      variant="bordered"
                    />
                    <div className="flex flex-col gap-4">
                      <Textarea
                        {...register("pemeriksaan_fisis")}
                        label="Pemeriksaan Fisis"
                        minRows={2}
                        variant="bordered"
                      />
                      <Select
                        {...register("alergi")}
                        label="Alergi"
                        variant="bordered"
                        selectedKeys={watch("alergi") ? [watch("alergi")!] : []}
                        onSelectionChange={(keys) =>
                          setValue("alergi", Array.from(keys)[0] as string)
                        }
                      >
                        <SelectItem key="Tidak Ada" value="Tidak Ada">
                          Tidak Ada Alergi (Disangkal)
                        </SelectItem>
                        <SelectItem key="Alergi Obat" value="Alergi Obat">
                          Alergi Obat (Sebutkan di Pemeriksaan)
                        </SelectItem>
                        <SelectItem
                          key="Alergi Makanan/Debu"
                          value="Alergi Makanan/Debu"
                        >
                          Alergi Makanan / Debu / Cuaca
                        </SelectItem>
                      </Select>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-700 border-b pb-2 mt-2">
                    Pemeriksaan Penunjang Terpenting
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Textarea
                      {...register("laboratorium")}
                      label="Laboratorium"
                      placeholder="DR Terlampir"
                      minRows={2}
                      variant="bordered"
                    />
                    <Textarea
                      {...register("radiologi")}
                      label="Radiologi"
                      placeholder="Foto Thoraks Terlampir"
                      minRows={2}
                      variant="bordered"
                    />
                  </div>
                </div>
              </Tab>

              {/* TAB 3: DIAGNOSIS & TERAPI */}
              <Tab
                key="diagnosis"
                title={
                  <div className="flex items-center gap-2">
                    <Pill size={16} />
                    <span>Diagnosis & Edukasi</span>
                  </div>
                }
              >
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Diagnosis */}
                    <div className="flex flex-col gap-4">
                      <h3 className="font-semibold text-slate-700 border-b pb-2">
                        Diagnosis
                      </h3>
                      <div className="flex gap-2">
                        <Input
                          {...register("diagnosis_utama")}
                          label="Diagnosis Utama"
                          className="flex-1"
                          variant="bordered"
                          isRequired
                          isInvalid={!!errors.diagnosis_utama}
                          errorMessage={errors.diagnosis_utama?.message}
                        />
                        <Input
                          {...register("icd10_utama")}
                          label="ICD 10"
                          className="w-24"
                          variant="bordered"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          {...register("diagnosis_sekunder")}
                          label="Diagnosis Sekunder"
                          className="flex-1"
                          variant="bordered"
                        />
                        <Input
                          {...register("icd10_sekunder")}
                          label="ICD 10"
                          className="w-24"
                          variant="bordered"
                        />
                      </div>
                    </div>

                    {/* Tindakan & Terapi dengan Quick-Add */}
                    <div className="flex flex-col gap-4">
                      <h3 className="font-semibold text-slate-700 border-b pb-2">
                        Terapi & Tindakan
                      </h3>

                      {/* DROPDOWN SAKTI QUICK-ADD OBAT */}
                      <Select
                        label="Tambahkan Obat Cepat (Dari Database)"
                        placeholder="Klik untuk memilih obat..."
                        variant="bordered"
                        color="success"
                        className="mb-1"
                        selectedKeys={[]} // Selalu kosong agar dokter bisa pilih obat yang sama berulang kali jika perlu
                        onSelectionChange={(keys) => {
                          const obatTerpilih = Array.from(keys)[0] as string;
                          if (obatTerpilih) {
                            const teksSekarang =
                              watch("terapi_pengobatan") || "";
                            // Sisipkan nama obat, lalu beri spasi agar dokter tinggal ketik dosisnya
                            const teksBaru = teksSekarang
                              ? `${teksSekarang}\n- ${obatTerpilih} `
                              : `- ${obatTerpilih} `;
                            setValue("terapi_pengobatan", teksBaru, {
                              shouldValidate: true,
                            });
                          }
                        }}
                      >
                        {listObat.map((obat: any) => (
                          <SelectItem
                            key={obat.nama_obat}
                            value={obat.nama_obat}
                          >
                            {obat.nama_obat} ({obat.satuan}) - Stok: {obat.stok}
                          </SelectItem>
                        ))}
                      </Select>

                      <Textarea
                        {...register("terapi_pengobatan")}
                        label="Terapi / Pengobatan"
                        placeholder="Contoh: Ringer Laktat, Paracetamol..."
                        minRows={4}
                        variant="bordered"
                      />
                      <Textarea
                        {...register("tindakan_prosedur")}
                        label="Tindakan / Prosedur"
                        placeholder="Contoh: Hematologi Rutin, Pemasangan Infus..."
                        minRows={2}
                        variant="bordered"
                      />
                    </div>
                  </div>

                  {/* Edukasi */}
                  <h3 className="font-semibold text-slate-700 border-b pb-2 mt-4">
                    Edukasi & Follow Up
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Select
                      {...register("rencana_diet")}
                      label="Rencana Diet / Nutrisi"
                      variant="bordered"
                      selectedKeys={
                        watch("rencana_diet") ? [watch("rencana_diet")!] : []
                      }
                      onSelectionChange={(keys) =>
                        setValue("rencana_diet", Array.from(keys)[0] as string)
                      }
                    >
                      <SelectItem key="Bebas" value="Bebas">
                        Bebas / Makanan Biasa
                      </SelectItem>
                      <SelectItem key="Rendah Garam" value="Rendah Garam">
                        Rendah Garam (Hipertensi)
                      </SelectItem>
                      <SelectItem key="Rendah Gula" value="Rendah Gula">
                        Rendah Gula (Diabetes)
                      </SelectItem>
                      <SelectItem key="Lunak/Cair" value="Lunak/Cair">
                        Makanan Lunak / Cair
                      </SelectItem>
                    </Select>
                    <Textarea
                      {...register("edukasi")}
                      label="Edukasi Tambahan"
                      placeholder="Jaga kebersihan, pantau tumbuh kembang..."
                      className="sm:col-span-2"
                      minRows={2}
                      variant="bordered"
                    />
                  </div>
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="flat" onPress={() => router.back()}>
            Batal
          </Button>
          <Button
            color="primary"
            className="bg-klinik-blue font-bold px-8 shadow-md"
            startContent={<Save size={18} />}
            type="submit"
            isLoading={mutation.isPending}
          >
            {mutation.isPending
              ? "Menyimpan Data..."
              : "Simpan Ringkasan Pulang"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// =========================================================================
// 3. PEMBUNGKUS SUSPENSE
// =========================================================================
export default function InputRekamMedisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" color="primary" label="Memuat formulir medis..." />
        </div>
      }
    >
      <RekamMedisForm />
    </Suspense>
  );
}
