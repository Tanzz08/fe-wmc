"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardBody,
  Input,
  Textarea,
  Button,
  Tabs,
  Tab,
  Select,
  SelectItem,
  Spinner,
  Divider,
} from "@nextui-org/react";
import { Activity, Pill, FileText, Save } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

export default function FormPemeriksaanDokter() {
  const { nopen } = useParams();
  const router = useRouter();

  // State Form
  const [formData, setFormData] = useState({
    keadaan_umum: "BAIK", // Diubah jadi default BAIK
    kesadaran: "COMPOS_MENTIS", // Diubah jadi default Sadar Penuh
    tensi_darah: "",
    nadi: "",
    napas: "",
    suhu: "",
    skala_nyeri: "0", // Diubah jadi string angka
    riwayat_sekarang: "",
    riwayat_dahulu: "",
    alergi: "TIDAK_ADA", // Default tidak ada
    pemeriksaan_fisis: "",
    laboratorium: "",
    radiologi: "",
    diagnosis_utama: "",
    icd10_utama: "",
    diagnosis_sekunder: "",
    terapi_pengobatan: "",
    tindakan_prosedur: "",
    edukasi: "",
    rencana_diet: "",
    kondisi_keluar: "MEMBAIK",
    cara_keluar: "DIIJINKAN_PULANG",
  });

  const { data: antrean, isLoading } = useQuery({
    queryKey: ["antreanDetail", nopen],
    queryFn: async () => {
      const res = await api.get(`/antrean/${nopen}`);
      return res.data?.data;
    },
  });

  const handleChange = (field: string, value: string) =>
    setFormData({ ...formData, [field]: value });

  const simpanPemeriksaanMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nopen: nopen,
        id_rm: antrean?.id_rm,
        ...formData,
      };
      await api.post(`/rekam-medis`, payload);
    },
    onSuccess: () => {
      toast.success("Pemeriksaan selesai!");
      router.push("/dashboard/dokter/antrean");
    },
    onError: (err: any) =>
      toast.error(
        err.response?.data?.message || "Gagal menyimpan rekam medis.",
      ),
  });

  if (isLoading)
    return <Spinner className="flex justify-center mt-20" size="lg" />;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-20">
      <Card className="bg-klinik-blue text-white shadow-md">
        <CardBody className="p-4 flex flex-row justify-between items-center">
          <div>
            <h2 className="text-xl font-bold uppercase">
              {antrean?.pasien?.nama}
            </h2>
            <p className="text-sm opacity-90">
              RM: {antrean?.id_rm} | NOPEN: {nopen}
            </p>
          </div>
          <div className="text-right font-semibold">Form Pemeriksaan Medis</div>
        </CardBody>
      </Card>

      <Tabs
        aria-label="Form Pemeriksaan"
        color="primary"
        variant="underlined"
        classNames={{ cursor: "w-full" }}
      >
        {/* TAB 1: ANAMNESIS & VITAL */}
        <Tab
          key="subjective"
          title={
            <div className="flex items-center gap-2">
              <Activity size={18} /> Anamnesis & Vital
            </div>
          }
        >
          <Card className="shadow-sm border border-slate-200 mt-2">
            <CardBody className="p-6 gap-6">
              {/* TANDA VITAL (Angka) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  label="Tensi (mmHg)"
                  placeholder="120/80"
                  value={formData.tensi_darah}
                  onChange={(e) => handleChange("tensi_darah", e.target.value)}
                />
                <Input
                  label="Nadi (x/mnt)"
                  placeholder="80"
                  value={formData.nadi}
                  onChange={(e) => handleChange("nadi", e.target.value)}
                />
                <Input
                  label="Suhu (°C)"
                  placeholder="36.5"
                  value={formData.suhu}
                  onChange={(e) => handleChange("suhu", e.target.value)}
                />
                <Input
                  label="Napas (x/mnt)"
                  placeholder="20"
                  value={formData.napas}
                  onChange={(e) => handleChange("napas", e.target.value)}
                />
              </div>

              <Divider />

              {/* KONDISI UMUM (Baru ditambahkan dropdown) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Keadaan Umum"
                  selectedKeys={[formData.keadaan_umum]}
                  onChange={(e) => handleChange("keadaan_umum", e.target.value)}
                >
                  <SelectItem key="BAIK" value="BAIK">
                    Tampak Baik
                  </SelectItem>
                  <SelectItem key="SEDANG" value="SEDANG">
                    Tampak Sakit Sedang
                  </SelectItem>
                  <SelectItem key="BERAT" value="BERAT">
                    Tampak Sakit Berat
                  </SelectItem>
                </Select>

                <Select
                  label="Tingkat Kesadaran"
                  selectedKeys={[formData.kesadaran]}
                  onChange={(e) => handleChange("kesadaran", e.target.value)}
                >
                  <SelectItem key="COMPOS_MENTIS" value="COMPOS_MENTIS">
                    Compos Mentis (Sadar Penuh)
                  </SelectItem>
                  <SelectItem key="APATIS" value="APATIS">
                    Apatis (Acuh tak acuh)
                  </SelectItem>
                  <SelectItem key="SOMNOLEN" value="SOMNOLEN">
                    Somnolen (Mengantuk)
                  </SelectItem>
                  <SelectItem key="SOPOR" value="SOPOR">
                    Sopor (Tidur nyenyak)
                  </SelectItem>
                  <SelectItem key="KOMA" value="KOMA">
                    Koma
                  </SelectItem>
                </Select>

                <Select
                  label="Skala Nyeri (0-10)"
                  selectedKeys={[formData.skala_nyeri]}
                  onChange={(e) => handleChange("skala_nyeri", e.target.value)}
                >
                  <SelectItem key="0" value="0">
                    0 - Tidak Nyeri
                  </SelectItem>
                  <SelectItem key="1" value="1">
                    1-3 - Nyeri Ringan
                  </SelectItem>
                  <SelectItem key="4" value="4">
                    4-6 - Nyeri Sedang
                  </SelectItem>
                  <SelectItem key="7" value="7">
                    7-10 - Nyeri Berat
                  </SelectItem>
                </Select>
              </div>

              <Divider />

              {/* KELUHAN & ALERGI */}
              <div className="grid grid-cols-1 gap-4">
                <Select
                  label="Riwayat Alergi"
                  selectedKeys={[formData.alergi]}
                  onChange={(e) => handleChange("alergi", e.target.value)}
                >
                  <SelectItem key="TIDAK_ADA" value="TIDAK_ADA">
                    Tidak Ada Alergi (Disangkal)
                  </SelectItem>
                  <SelectItem key="OBAT" value="OBAT">
                    Alergi Obat (Sebutkan di Pemeriksaan)
                  </SelectItem>
                  <SelectItem key="MAKANAN" value="MAKANAN">
                    Alergi Makanan / Debu / Lainnya
                  </SelectItem>
                </Select>

                <Textarea
                  label="Keluhan Utama / Riwayat Sekarang"
                  minRows={3}
                  value={formData.riwayat_sekarang}
                  onChange={(e) =>
                    handleChange("riwayat_sekarang", e.target.value)
                  }
                />
                <Textarea
                  label="Pemeriksaan Fisis (Objektif)"
                  minRows={3}
                  value={formData.pemeriksaan_fisis}
                  onChange={(e) =>
                    handleChange("pemeriksaan_fisis", e.target.value)
                  }
                />
              </div>
            </CardBody>
          </Card>
        </Tab>

        {/* TAB 2: MANUAL RESEP (Tidak ada dropdown di sini karena butuh ketik bebas) */}
        <Tab
          key="assessment"
          title={
            <div className="flex items-center gap-2">
              <Pill size={18} /> Diagnosis & Terapi
            </div>
          }
        >
          <Card className="shadow-sm border border-slate-200 mt-2">
            <CardBody className="p-6 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="Diagnosis Utama"
                  placeholder="Contoh: ISPA"
                  value={formData.diagnosis_utama}
                  onChange={(e) =>
                    handleChange("diagnosis_utama", e.target.value)
                  }
                />
                <Input
                  label="Kode ICD-10 (Opsional)"
                  placeholder="Contoh: J06.9"
                  value={formData.icd10_utama}
                  onChange={(e) => handleChange("icd10_utama", e.target.value)}
                />
              </div>
              <Divider />
              {/* INPUT RESEP MANUAL */}
              <Textarea
                label="Terapi / Resep Obat (Manual)"
                placeholder="Ketik resep di sini...&#10;Contoh:&#10;1. Paracetamol 500mg (10 tab) - 3x1&#10;2. Amoxicillin 500mg (10 tab) - 3x1 habiskan"
                minRows={5}
                value={formData.terapi_pengobatan}
                onChange={(e) =>
                  handleChange("terapi_pengobatan", e.target.value)
                }
                description="Teks ini akan dienkripsi dan diteruskan langsung ke layar Apoteker."
              />
              <Textarea
                label="Tindakan / Prosedur Khusus"
                placeholder="Contoh: Rawat Luka, Pemasangan Infus..."
                minRows={2}
                value={formData.tindakan_prosedur}
                onChange={(e) =>
                  handleChange("tindakan_prosedur", e.target.value)
                }
              />
            </CardBody>
          </Card>
        </Tab>

        {/* TAB 3: EDUKASI & KELUAR */}
        <Tab
          key="plan"
          title={
            <div className="flex items-center gap-2">
              <FileText size={18} /> Edukasi & Keluar
            </div>
          }
        >
          <Card className="shadow-sm border border-slate-200 mt-2">
            <CardBody className="p-6 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Kondisi Waktu Keluar Poli"
                  selectedKeys={[formData.kondisi_keluar]}
                  onChange={(e) =>
                    handleChange("kondisi_keluar", e.target.value)
                  }
                >
                  <SelectItem key="SEMBUH" value="SEMBUH">
                    Sembuh
                  </SelectItem>
                  <SelectItem key="MEMBAIK" value="MEMBAIK">
                    Membaik
                  </SelectItem>
                  <SelectItem key="BELUM_SEMBUH" value="BELUM_SEMBUH">
                    Belum Sembuh / Stabil
                  </SelectItem>
                  <SelectItem key="BURUK" value="BURUK">
                    Memburuk / Kritis
                  </SelectItem>
                </Select>
                <Select
                  label="Cara / Tindak Lanjut"
                  selectedKeys={[formData.cara_keluar]}
                  onChange={(e) => handleChange("cara_keluar", e.target.value)}
                >
                  <SelectItem key="DIIJINKAN_PULANG" value="DIIJINKAN_PULANG">
                    Diijinkan Pulang / Rawat Jalan
                  </SelectItem>
                  <SelectItem key="KONTROL" value="KONTROL">
                    Disarankan Kontrol Ulang
                  </SelectItem>
                  <SelectItem key="DIRUJUK" value="DIRUJUK">
                    Rujuk ke RS / Spesialis
                  </SelectItem>
                  <SelectItem key="RAWAT_INAP" value="RAWAT_INAP">
                    Indikasi Rawat Inap (Jika ada)
                  </SelectItem>
                </Select>
              </div>

              {/* Tambahan Rencana Diet (Dropdown baru) */}
              <Select
                label="Rencana Diet / Pola Makan"
                selectedKeys={
                  formData.rencana_diet ? [formData.rencana_diet] : []
                }
                onChange={(e) => handleChange("rencana_diet", e.target.value)}
              >
                <SelectItem key="BEBAS" value="BEBAS">
                  Bebas / Biasa
                </SelectItem>
                <SelectItem key="RENDAH_GARAM" value="RENDAH_GARAM">
                  Rendah Garam (Hipertensi)
                </SelectItem>
                <SelectItem key="RENDAH_GULA" value="RENDAH_GULA">
                  Rendah Gula (Diabetes)
                </SelectItem>
                <SelectItem key="LUNAK" value="LUNAK">
                  Makanan Lunak / Cair
                </SelectItem>
              </Select>

              <Textarea
                label="Edukasi Tambahan"
                placeholder="Tuliskan saran khusus untuk pasien (Misal: Banyak istirahat, hindari makanan pedas)..."
                minRows={3}
                value={formData.edukasi}
                onChange={(e) => handleChange("edukasi", e.target.value)}
              />
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="flat" color="danger" onPress={() => router.back()}>
          Kembali
        </Button>
        <Button
          color="primary"
          className="font-bold px-8 bg-klinik-blue shadow-md"
          size="lg"
          startContent={<Save size={20} />}
          isLoading={simpanPemeriksaanMutation.isPending}
          onPress={() => simpanPemeriksaanMutation.mutate()}
        >
          Simpan Rekam Medis
        </Button>
      </div>
    </div>
  );
}
