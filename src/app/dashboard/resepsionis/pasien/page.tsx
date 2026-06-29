"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
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
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Textarea,
  Card,
  CardBody,
  Chip,
} from "@nextui-org/react";
import { Plus, Search, UserPlus, Eye, Edit, Trash2 } from "lucide-react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

// =========================================================================
// 1. TIPE DATA & SKEMA VALIDASI YUP
// =========================================================================
interface Pasien {
  id_rm: string;
  nama: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  no_telepon: string;
  alamat: string;
}

type ModalMode = "create" | "edit" | "view";

const pasienSchema = yup.object().shape({
  id_rm: yup.string().optional(),
  nama: yup.string().required("Nama lengkap wajib diisi"),
  jenis_kelamin: yup.string().required("Pilih jenis kelamin"),
  tanggal_lahir: yup.string().required("Tanggal lahir wajib diisi"),
  no_telepon: yup.string().required("Nomor telepon wajib diisi"),
  alamat: yup.string().required("Alamat wajib diisi"),
});

type PasienFormData = yup.InferType<typeof pasienSchema>;

export default function PasienPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [errorMsg, setErrorMsg] = useState("");
  const [globalError, setGlobalError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasienFormData>({
    resolver: yupResolver(pasienSchema) as any,
  });

  // =========================================================================
  // 2. REACT QUERY (GET DATA PASIEN)
  // =========================================================================
  const { data: listPasien = [], isLoading } = useQuery<Pasien[]>({
    queryKey: ["pasienList"],
    queryFn: async () => {
      try {
        const response = await api.get("/pasien");
        const fetchedData = response.data?.data || response.data;
        return Array.isArray(fetchedData) ? fetchedData : [];
      } catch (error) {
        console.error("Gagal menarik data pasien", error);
        return [];
      }
    },
  });

  const filteredPasien = listPasien.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.id_rm && p.id_rm.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // =========================================================================
  // 3. HANDLER MODAL (CREATE & EDIT)
  // =========================================================================
  const handleOpenCreate = () => {
    setModalMode("create");
    setErrorMsg("");
    reset({
      id_rm: "",
      nama: "",
      jenis_kelamin: "",
      tanggal_lahir: "",
      no_telepon: "",
      alamat: "",
    });
    onOpen();
  };

  const handleOpenAction = async (id_rm: string, mode: "edit" | "view") => {
    setModalMode(mode);
    setErrorMsg("");
    onOpen();

    try {
      const response = await api.get(`/pasien/${id_rm}`);
      const dataPasien = response.data.data;
      const formattedDate = new Date(dataPasien.tanggal_lahir)
        .toISOString()
        .split("T")[0];

      reset({
        id_rm: dataPasien.id_rm,
        nama: dataPasien.nama,
        jenis_kelamin: dataPasien.jenis_kelamin,
        tanggal_lahir: formattedDate,
        no_telepon: dataPasien.no_telepon,
        alamat: dataPasien.alamat,
      });
    } catch (err) {
      setErrorMsg("Gagal mengambil detail pasien dari server.");
    }
  };

  // =========================================================================
  // 4. REACT QUERY MUTATIONS
  // =========================================================================
  const saveMutation = useMutation({
    mutationFn: async (data: PasienFormData) => {
      if (modalMode === "create") {
        return await api.post("/pasien", data);
      } else {
        return await api.put(`/pasien/${data.id_rm}`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pasienList"] });
      onClose();
    },
    onError: (error: any) => {
      setErrorMsg(
        error.response?.data?.message ||
          "Terjadi kesalahan sistem saat menyimpan data.",
      );
    },
  });

  const onSubmitForm: SubmitHandler<PasienFormData> = (data) => {
    if (modalMode === "view") return onClose();
    setErrorMsg("");
    saveMutation.mutate(data);
  };

  const onValidationError = (errors: any) => {
    setGlobalError(
      "Gagal menyimpan: Harap periksa kembali form Anda. Ada field wajib yang belum diisi!",
    );

  const deleteMutation = useMutation({
    mutationFn: async (id_rm: string) => {
      return await api.delete(`/pasien/${id_rm}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pasienList"] });
    },
    onError: () => {
      alert("Gagal menghapus data pasien.");
    },
  });

  const handleDelete = (id_rm: string, namaPasien: string) => {
    const isConfirm = window.confirm(
      `Apakah Anda yakin ingin menghapus data pasien: ${namaPasien}?`,
    );
    if (isConfirm) {
      deleteMutation.mutate(id_rm);
    }
  };

  // =========================================================================
  // 5. RENDER UI
  // =========================================================================
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Master Data Pasien
          </h1>
          <p className="text-sm text-slate-500">
            Kelola informasi rekam medis dan identitas pasien klinik.
          </p>
        </div>
        <Button
          color="primary"
          className="bg-klinik-blue font-semibold"
          startContent={<Plus size={18} />}
          onPress={handleOpenCreate}
        >
          Pasien Baru
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardBody>
          <Input
            isClearable
            className="w-full sm:max-w-md"
            placeholder="Cari berdasarkan Nama atau ID RM..."
            startContent={<Search className="text-default-300" size={18} />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            variant="bordered"
          />
        </CardBody>
      </Card>

      <div className="overflow-x-auto w-full">
        <Table
          aria-label="Tabel Master Data Pasien"
          className="shadow-sm min-w-max"
        >
          <TableHeader>
            <TableColumn>ID RM</TableColumn>
            <TableColumn>NAMA PASIEN</TableColumn>
            <TableColumn>JENIS KELAMIN</TableColumn>
            <TableColumn>TANGGAL LAHIR</TableColumn>
            <TableColumn>NO. TELEPON</TableColumn>
            <TableColumn>ALAMAT</TableColumn>
            <TableColumn align="center">AKSI</TableColumn>
          </TableHeader>
          <TableBody
            items={filteredPasien}
            isLoading={isLoading}
            loadingContent={
              <div className="font-semibold text-klinik-blue">
                Memuat Data...
              </div>
            }
            emptyContent={isLoading ? " " : "Tidak ada data."}
          >
            {(pasien) => (
              <TableRow key={pasien.id_rm}>
                <TableCell>
                  <Chip
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="font-semibold"
                  >
                    {pasien.id_rm}
                  </Chip>
                </TableCell>
                <TableCell className="font-medium text-slate-700 whitespace-nowrap">
                  {pasien.nama}
                </TableCell>
                <TableCell>{pasien.jenis_kelamin}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {new Date(pasien.tanggal_lahir).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {pasien.no_telepon}
                </TableCell>
                <TableCell>
                  <div className="max-w-[250px] truncate" title={pasien.alamat}>
                    {pasien.alamat}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="primary"
                      onPress={() =>
                        router.push(
                          `/dashboard/resepsionis/pasien/${pasien.id_rm}`,
                        )
                      }
                    >
                      <Eye size={18} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="warning"
                      onPress={() => handleOpenAction(pasien.id_rm, "edit")}
                    >
                      <Edit size={18} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      isLoading={
                        deleteMutation.isPending &&
                        deleteMutation.variables === pasien.id_rm
                      }
                      onPress={() => handleDelete(pasien.id_rm, pasien.nama)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit(onSubmitForm, onValidationError)}>
              <ModalHeader className="flex items-center gap-2 border-b">
                <UserPlus className="text-klinik-blue" size={24} />
                <div className="flex flex-col">
                  <span className="text-lg font-bold">
                    {modalMode === "create"
                      ? "Registrasi Pasien Baru"
                      : modalMode === "edit"
                        ? "Edit Data Pasien"
                        : "Detail Pasien"}
                  </span>
                  <p className="text-xs text-slate-400 font-normal">
                    {modalMode === "view"
                      ? "Mode Hanya Lihat"
                      : "Data sensitif akan otomatis dienkripsi dengan AES-256."}
                  </p>
                </div>
              </ModalHeader>

              <ModalBody className="py-6 flex flex-col gap-4">
                {globalError && (
                  <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center font-medium">
                    {globalError}
                  </div>
                )}

                {modalMode !== "create" && watch("id_rm") && (
                  <Input
                    label="ID Rekam Medis"
                    variant="flat"
                    value={watch("id_rm")}
                    isReadOnly
                    color="primary"
                  />
                )}

                <Input
                  {...register("nama")}
                  isRequired
                  label="Nama Lengkap"
                  variant="bordered"
                  isReadOnly={modalMode === "view"}
                  isInvalid={!!errors.nama}
                  errorMessage={errors.nama?.message}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modalMode === "view" ? (
                    <Input
                      label="Jenis Kelamin"
                      variant="bordered"
                      value={watch("jenis_kelamin")}
                      isReadOnly
                    />
                  ) : (
                    <Select
                      {...register("jenis_kelamin")}
                      isRequired
                      label="Jenis Kelamin"
                      variant="bordered"
                      selectedKeys={
                        watch("jenis_kelamin") ? [watch("jenis_kelamin")] : []
                      }
                      onSelectionChange={(keys) =>
                        setValue("jenis_kelamin", Array.from(keys)[0] as string)
                      }
                      isInvalid={!!errors.jenis_kelamin}
                      errorMessage={errors.jenis_kelamin?.message}
                    >
                      <SelectItem key="Laki-laki" value="Laki-laki">
                        Laki-laki
                      </SelectItem>
                      <SelectItem key="Perempuan" value="Perempuan">
                        Perempuan
                      </SelectItem>
                    </Select>
                  )}

                  <Input
                    {...register("tanggal_lahir")}
                    isRequired
                    label="Tanggal Lahir"
                    type="date"
                    variant="bordered"
                    isReadOnly={modalMode === "view"}
                    isInvalid={!!errors.tanggal_lahir}
                    errorMessage={errors.tanggal_lahir?.message}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    {...register("no_telepon")}
                    isRequired
                    label="Nomor Telepon / WA"
                    variant="bordered"
                    isReadOnly={modalMode === "view"}
                    isInvalid={!!errors.no_telepon}
                    errorMessage={errors.no_telepon?.message}
                  />
                  <Textarea
                    {...register("alamat")}
                    isRequired
                    label="Alamat Lengkap"
                    variant="bordered"
                    isReadOnly={modalMode === "view"}
                    isInvalid={!!errors.alamat}
                    errorMessage={errors.alamat?.message}
                  />
                </div>
              </ModalBody>

              <ModalFooter className="border-t bg-slate-50">
                <Button color="danger" variant="flat" onPress={onClose}>
                  {modalMode === "view" ? "Tutup" : "Batal"}
                </Button>
                {modalMode !== "view" && (
                  <Button
                    color="primary"
                    className="bg-klinik-blue font-semibold"
                    type="submit"
                    isLoading={saveMutation.isPending || isSubmitting}
                  >
                    {saveMutation.isPending ? "Menyimpan..." : "Simpan Data"}
                  </Button>
                )}
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
