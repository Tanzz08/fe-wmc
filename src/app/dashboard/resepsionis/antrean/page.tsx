"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Chip,
  Autocomplete,
  AutocompleteItem,
  Card,
  CardBody,
  Input,
} from "@nextui-org/react";
import {
  Plus,
  ClipboardList,
  CheckCircle2,
  Clock,
  Users,
  Activity,
  CreditCard,
  IdCard,
} from "lucide-react";
import api from "@/lib/axios";

// =========================================================================
// 1. INTERFACES & YUP SCHEMA
// =========================================================================
interface Pasien {
  id_rm: string;
  nama: string;
  tanggal_lahir?: string; // 🔥 Ditambahkan untuk menghitung umur
}

interface Antrean {
  nopen: string;
  id_rm: string;
  status_pasien: string;
  instalasi: string;
  unit_pelayanan: string;
  cara_bayar: string;
  status_antrean: string;
  tgl_registrasi: string;
  pasien: Pasien;
  safeKey?: string;
}

const antreanSchema = yup.object().shape({
  id_rm: yup.string().required("Pilih pasien terlebih dahulu"),
  status_pasien: yup.string().required("Pilih status pasien"),
  instalasi: yup.string().required("Pilih instalasi"),
  unit_pelayanan: yup.string().required("Pilih unit pelayanan (Poli)"),
  sub_unit: yup.string().optional(),
  cara_bayar: yup.string().required("Pilih cara bayar"),
  nik: yup.string().when("cara_bayar", {
    is: "BPJS",
    then: (schema) => schema.required("NIK wajib diisi untuk pasien BPJS"),
    otherwise: (schema) => schema.optional(),
  }),
  no_bpjs: yup.string().when("cara_bayar", {
    is: "BPJS",
    then: (schema) => schema.required("Nomor BPJS/KIS wajib diisi"),
    otherwise: (schema) => schema.optional(),
  }),
});

type AntreanFormData = yup.InferType<typeof antreanSchema> & {
  no_bpjs?: string;
  nik?: string;
};

// =========================================================================
// FUNGSI HELPER: Menghitung Umur Pasien
// =========================================================================
const calculateAge = (dobString?: string) => {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

export default function AntreanPage() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [errorMsg, setErrorMsg] = useState("");

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    register,
    formState: { errors },
  } = useForm<AntreanFormData>({
    resolver: yupResolver(antreanSchema) as any,
  });

  // Pantau interaksi secara real-time
  const selectedCaraBayar = watch("cara_bayar");
  const selectedIdRm = watch("id_rm");

  // =========================================================================
  // 2. REACT QUERY (FETCH DATA)
  // =========================================================================
  const { data: listAntrean = [] } = useQuery<Antrean[]>({
    queryKey: ["antreanList"],
    queryFn: async () => {
      try {
        const res = await api.get("/antrean");
        const fetchedData = res.data?.data || res.data;
        const safeData = Array.isArray(fetchedData) ? fetchedData : [];
        return safeData.map((item, index) => ({
          ...item,
          safeKey: item.nopen || `fallback-antrean-${index}`,
        }));
      } catch (error) {
        console.error("Gagal menarik data antrean", error);
        return [];
      }
    },
    refetchInterval: 5000,
  });

  const { data: listPasien = [] } = useQuery<Pasien[]>({
    queryKey: ["pasienListDropdown"],
    queryFn: async () => {
      try {
        const res = await api.get("/pasien");
        const fetchedData = res.data?.data || res.data;
        return Array.isArray(fetchedData) ? fetchedData : [];
      } catch (error) {
        return [];
      }
    },
  });

  // =========================================================================
  // LOGIKA PEMBATASAN UMUR (HANYA POLI ANAK JIKA <= 3 TAHUN)
  // =========================================================================
  const selectedPasien = listPasien.find((p) => p.id_rm === selectedIdRm);
  const umurPasien = calculateAge(selectedPasien?.tanggal_lahir);
  const isBalita = umurPasien !== null && umurPasien <= 3;

  // Efek Samping: Memaksa Unit Pelayanan ke "Poli Anak" jika pasien adalah balita
  useEffect(() => {
    if (isBalita) {
      setValue("unit_pelayanan", "Poli Anak", { shouldValidate: true });
    }
  }, [isBalita, setValue]);

  // =========================================================================
  // 3. FILTER DATA HARI INI & KALKULASI STATISTIK
  // =========================================================================
  const todayStr = new Date().toDateString();

  const antreanHariIni = listAntrean.filter((a) => {
    return new Date(a.tgl_registrasi).toDateString() === todayStr;
  });

  const totalAntrean = antreanHariIni.length;
  const tungguPoli = antreanHariIni.filter(
    (a) => a.status_antrean === "TUNGGU_POLI",
  ).length;
  const sedangDiperiksa = antreanHariIni.filter(
    (a) =>
      a.status_antrean === "PEMERIKSAAN" || a.status_antrean === "PROSES_POLI",
  ).length;
  const selesaiPoli = antreanHariIni.filter(
    (a) => a.status_antrean === "SELESAI",
  ).length;

  // =========================================================================
  // 4. MUTASI (POST ANTREAN BARU)
  // =========================================================================
  const mutation = useMutation({
    mutationFn: async (newData: AntreanFormData) => {
      let combinedSubUnit = newData.sub_unit || null;

      if (newData.cara_bayar === "BPJS" && (newData.nik || newData.no_bpjs)) {
        combinedSubUnit = `NIK: ${newData.nik || "-"} | No. BPJS: ${newData.no_bpjs || "-"}`;
      }

      const payload = {
        ...newData,
        sub_unit: combinedSubUnit,
      };

      delete payload.no_bpjs;
      delete payload.nik;

      return await api.post("/antrean", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["antreanList"] });
      onClose();
      reset();
    },
    onError: (error: any) => {
      setErrorMsg(
        error.response?.data?.message || "Gagal mendaftarkan antrean.",
      );
    },
  });

  const onSubmitForm: SubmitHandler<AntreanFormData> = (data) => {
    setErrorMsg("");
    mutation.mutate(data);
  };

  const handleOpenModal = () => {
    reset({});
    setErrorMsg("");
    onOpen();
  };

  // =========================================================================
  // 5. RENDER UI
  // =========================================================================
  const renderStatus = (status: string) => {
    switch (status) {
      case "TUNGGU_POLI":
        return (
          <Chip
            color="warning"
            variant="flat"
            size="sm"
            startContent={<Clock size={12} />}
          >
            Tunggu Poli
          </Chip>
        );
      case "PEMERIKSAAN":
      case "PROSES_POLI":
        return (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            startContent={<Activity size={12} />}
          >
            Diperiksa
          </Chip>
        );
      case "SELESAI":
        return (
          <Chip
            color="success"
            variant="flat"
            size="sm"
            startContent={<CheckCircle2 size={12} />}
          >
            Selesai
          </Chip>
        );
      default:
        return (
          <Chip color="default" variant="flat" size="sm">
            {status}
          </Chip>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Menara Pengawas Kunjungan
          </h1>
          <p className="text-sm text-slate-500">
            Pantau seluruh pergerakan pasien hari ini di semua unit pelayanan.
          </p>
        </div>
        <Button
          color="primary"
          className="bg-klinik-blue font-semibold shadow-md"
          startContent={<Plus size={18} />}
          onPress={handleOpenModal}
        >
          Daftar Antrean
        </Button>
      </div>

      {/* 4 KARTU RINGKASAN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border border-slate-100">
          <CardBody className="flex flex-row items-center gap-3 p-4">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">
                Total Hari Ini
              </p>
              <h3 className="text-xl font-bold text-slate-800">
                {totalAntrean}
              </h3>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm border border-amber-100 bg-amber-50/30">
          <CardBody className="flex flex-row items-center gap-3 p-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-amber-600 font-semibold uppercase">
                Menunggu Poli
              </p>
              <h3 className="text-xl font-bold text-amber-900">{tungguPoli}</h3>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm border border-blue-100 bg-blue-50/30">
          <CardBody className="flex flex-row items-center gap-3 p-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase">
                Diperiksa
              </p>
              <h3 className="text-xl font-bold text-blue-900">
                {sedangDiperiksa}
              </h3>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm border border-emerald-100 bg-emerald-50/30">
          <CardBody className="flex flex-row items-center gap-3 p-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-semibold uppercase">
                Selesai
              </p>
              <h3 className="text-xl font-bold text-emerald-900">
                {selesaiPoli}
              </h3>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* TABEL ANTREAN */}
      <Table aria-label="Tabel Antrean Hari Ini" className="shadow-sm">
        <TableHeader>
          <TableColumn>NOPEN</TableColumn>
          <TableColumn>NAMA PASIEN</TableColumn>
          <TableColumn>POLIKLINIK</TableColumn>
          <TableColumn>WAKTU DAFTAR</TableColumn>
          <TableColumn>STATUS</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={"Belum ada kunjungan hari ini."}
          items={antreanHariIni}
        >
          {(antrean) => (
            <TableRow key={antrean.safeKey}>
              <TableCell className="font-mono text-xs text-slate-500">
                {antrean.nopen}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700">
                    {antrean.pasien?.nama || "Unknown"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {antrean.id_rm}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">{antrean.unit_pelayanan}</span>
              </TableCell>
              <TableCell>
                {new Date(antrean.tgl_registrasi).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell>{renderStatus(antrean.status_antrean)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* MODAL FORM PENDAFTARAN ANTREAN */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit(onSubmitForm)}>
              <ModalHeader className="flex items-center gap-2 border-b">
                <ClipboardList className="text-klinik-blue" size={24} />
                <div className="flex flex-col">
                  <span className="text-lg font-bold">Registrasi Antrean</span>
                  <p className="text-xs text-slate-400 font-normal">
                    Pilih pasien dan arahkan ke poli tujuan.
                  </p>
                </div>
              </ModalHeader>

              <ModalBody className="py-6 flex flex-col gap-4">
                {errorMsg && (
                  <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center font-medium">
                    {errorMsg}
                  </div>
                )}

                <Controller
                  name="id_rm"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      isRequired
                      label="Cari Pasien (Nama atau ID RM)"
                      variant="bordered"
                      defaultItems={listPasien}
                      selectedKey={field.value || ""}
                      onSelectionChange={(key) => {
                        field.onChange(key ? String(key) : "");
                      }}
                      isInvalid={!!errors.id_rm}
                      errorMessage={errors.id_rm?.message}
                    >
                      {(pasien) => (
                        <AutocompleteItem
                          key={pasien.id_rm}
                          textValue={`${pasien.nama} (${pasien.id_rm})`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {pasien.nama}
                            </span>
                            <span className="text-tiny text-slate-500">
                              {pasien.id_rm}
                            </span>
                          </div>
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    {...register("status_pasien")}
                    isRequired
                    label="Status Pasien"
                    variant="bordered"
                    selectedKeys={
                      watch("status_pasien") ? [watch("status_pasien")] : []
                    }
                    onSelectionChange={(keys) =>
                      setValue("status_pasien", Array.from(keys)[0] as string, {
                        shouldValidate: true,
                      })
                    }
                    isInvalid={!!errors.status_pasien}
                    errorMessage={errors.status_pasien?.message}
                  >
                    <SelectItem key="Baru" value="Baru">
                      Baru
                    </SelectItem>
                    <SelectItem key="Lama" value="Lama">
                      Lama
                    </SelectItem>
                  </Select>

                  <Select
                    {...register("instalasi")}
                    isRequired
                    label="Instalasi"
                    variant="bordered"
                    selectedKeys={
                      watch("instalasi") ? [watch("instalasi")] : []
                    }
                    onSelectionChange={(keys) =>
                      setValue("instalasi", Array.from(keys)[0] as string, {
                        shouldValidate: true,
                      })
                    }
                    isInvalid={!!errors.instalasi}
                    errorMessage={errors.instalasi?.message}
                  >
                    <SelectItem key="Rawat Jalan" value="Rawat Jalan">
                      Rawat Jalan
                    </SelectItem>
                    <SelectItem key="UGD" value="UGD">
                      UGD
                    </SelectItem>
                    <SelectItem key="IGD" value="IGD">
                      IGD
                    </SelectItem>
                    <SelectItem key="Rawat Inap" value="Rawat Inap">
                      Rawat Inap
                    </SelectItem>
                  </Select>

                  {/* 🔥 SELECT POLI: Terkunci pada Poli Anak jika balita */}
                  <div>
                    <Select
                      {...register("unit_pelayanan")}
                      isRequired
                      label="Unit Pelayanan (Poli Tujuan)"
                      variant="bordered"
                      disabledKeys={
                        isBalita
                          ? [
                              "Poli Umum",
                              "Poli Obgyn",
                              "Poli Gigi",
                              "Poli Jiwa",
                            ]
                          : []
                      }
                      selectedKeys={
                        watch("unit_pelayanan") ? [watch("unit_pelayanan")] : []
                      }
                      onSelectionChange={(keys) =>
                        setValue(
                          "unit_pelayanan",
                          Array.from(keys)[0] as string,
                          { shouldValidate: true },
                        )
                      }
                      isInvalid={!!errors.unit_pelayanan}
                      errorMessage={errors.unit_pelayanan?.message}
                    >
                      <SelectItem key="Poli Umum" value="Poli Umum">
                        Poli Umum
                      </SelectItem>
                      <SelectItem key="Poli Obgyn" value="Poli Obgyn">
                        Poli Obgyn
                      </SelectItem>
                      <SelectItem key="Poli Gigi" value="Poli Gigi">
                        Poli Gigi
                      </SelectItem>
                      <SelectItem key="Poli Anak" value="Poli Anak">
                        Poli Anak
                      </SelectItem>
                      <SelectItem key="Poli Jiwa" value="Poli Jiwa">
                        Poli Jiwa
                      </SelectItem>
                    </Select>

                    {/* Pesan informasi otomatis jika pasien balita */}
                    {isBalita && (
                      <p className="text-xs font-semibold text-blue-600 mt-1">
                        * Pasien berusia {umurPasien} tahun otomatis diarahkan
                        ke Poli Anak.
                      </p>
                    )}
                  </div>

                  <Select
                    {...register("cara_bayar")}
                    isRequired
                    label="Cara Bayar"
                    variant="bordered"
                    selectedKeys={
                      watch("cara_bayar") ? [watch("cara_bayar")] : []
                    }
                    onSelectionChange={(keys) =>
                      setValue("cara_bayar", Array.from(keys)[0] as string, {
                        shouldValidate: true,
                      })
                    }
                    isInvalid={!!errors.cara_bayar}
                    errorMessage={errors.cara_bayar?.message}
                  >
                    <SelectItem key="Umum" value="Umum">
                      Umum / Pribadi
                    </SelectItem>
                    <SelectItem key="BPJS" value="BPJS">
                      BPJS Kesehatan
                    </SelectItem>
                  </Select>
                </div>

                {/* 🔥 INPUT DINAMIS: Menampilkan NIK & No BPJS */}
                {selectedCaraBayar === "BPJS" && (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col gap-4">
                    <Input
                      {...register("nik")}
                      isRequired
                      label="Nomor Induk Kependudukan (NIK)"
                      placeholder="Masukkan 16 digit NIK..."
                      variant="bordered"
                      startContent={
                        <IdCard size={18} className="text-blue-500" />
                      }
                      isInvalid={!!errors.nik}
                      errorMessage={errors.nik?.message}
                    />
                    <Input
                      {...register("no_bpjs")}
                      isRequired
                      label="Nomor Kartu BPJS / KIS"
                      placeholder="Masukkan 13 digit nomor BPJS..."
                      variant="bordered"
                      startContent={
                        <CreditCard size={18} className="text-blue-500" />
                      }
                      isInvalid={!!errors.no_bpjs}
                      errorMessage={errors.no_bpjs?.message}
                    />
                    <p className="text-xs text-blue-600">
                      * NIK dan Nomor Kartu akan disimpan secara aman di dalam
                      catatan sub-unit pendaftaran.
                    </p>
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="border-t bg-slate-50">
                <Button color="danger" variant="flat" onPress={onClose}>
                  Batal
                </Button>
                <Button
                  color="primary"
                  className="bg-klinik-blue font-semibold"
                  type="submit"
                  isLoading={mutation.isPending}
                >
                  {mutation.isPending ? "Memproses..." : "Daftarkan ke Poli"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
