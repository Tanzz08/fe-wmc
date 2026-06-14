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

  // State Form disesuaikan 100% dengan kebutuhan req.body di backend-mu
  const [formData, setFormData] = useState({
    keadaan_umum: "",
    kesadaran: "",
    tensi_darah: "",
    nadi: "",
    napas: "",
    suhu: "",
    skala_nyeri: "",
    riwayat_sekarang: "",
    riwayat_dahulu: "",
    alergi: "",
    pemeriksaan_fisis: "",
    laboratorium: "",
    radiologi: "",
    diagnosis_utama: "",
    icd10_utama: "",
    diagnosis_sekunder: "",
    terapi_pengobatan: "",
    tindakan_prosedur: "", // Terapi diubah jadi string biasa
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
      // Langsung tembak ke endpoint buatanmu
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
        {/* TAB 1 */}
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
            </CardBody>
          </Card>
        </Tab>

        {/* TAB 2: MANUAL RESEP */}
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
                  label="Kode ICD-10"
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
                label="Tindakan / Prosedur"
                minRows={2}
                value={formData.tindakan_prosedur}
                onChange={(e) =>
                  handleChange("tindakan_prosedur", e.target.value)
                }
              />
            </CardBody>
          </Card>
        </Tab>

        {/* TAB 3 */}
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
                  label="Kondisi Keluar"
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
                    Belum Sembuh
                  </SelectItem>
                </Select>
                <Select
                  label="Cara Keluar"
                  selectedKeys={[formData.cara_keluar]}
                  onChange={(e) => handleChange("cara_keluar", e.target.value)}
                >
                  <SelectItem key="DIIJINKAN_PULANG" value="DIIJINKAN_PULANG">
                    Diijinkan Pulang / Kontrol
                  </SelectItem>
                  <SelectItem key="DIRUJUK" value="DIRUJUK">
                    Dirujuk
                  </SelectItem>
                </Select>
              </div>
              <Textarea
                label="Edukasi / Follow Up"
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
          className="font-bold px-8"
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
