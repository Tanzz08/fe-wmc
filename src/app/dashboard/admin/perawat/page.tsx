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
  Card,
  CardBody,
  Spinner,
  Tooltip,
} from "@nextui-org/react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Stethoscope,
  Phone,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

// =========================================================================
// 1. INTERFACE & YUP SCHEMA
// =========================================================================
interface Perawat {
  id: number;
  nama_perawat: string;
  no_telepon: string | null;
  alamat: string | null;
  is_active: boolean;
}

const perawatSchema = yup.object().shape({
  nama_perawat: yup.string().required("Nama perawat wajib diisi"),
  no_telepon: yup.string().nullable().optional(),
  alamat: yup.string().nullable().optional(),
});

type PerawatFormData = yup.InferType<typeof perawatSchema>;

export default function MasterPerawatPage() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PerawatFormData>({
    resolver: yupResolver(perawatSchema),
  });

  // =========================================================================
  // 2. FETCH DATA (READ)
  // =========================================================================
  const { data: listPerawat = [], isLoading } = useQuery<Perawat[]>({
    queryKey: ["perawatList"],
    queryFn: async () => {
      try {
        const res = await api.get("/perawat");
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error) {
        console.error("Gagal menarik data perawat", error);
        toast.error("Gagal menarik data perawat");
        return [];
      }
    },
  });

  // Fitur Pencarian
  const filteredPerawat = listPerawat.filter((p) =>
    p.nama_perawat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // =========================================================================
  // 3. MUTASI (CREATE, UPDATE, DELETE)
  // =========================================================================
  
  // A. Tambah Perawat
  const createMutation = useMutation({
    mutationFn: async (data: PerawatFormData) => {
      return await api.post("/perawat", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perawatList"] });
      toast.success("Perawat berhasil ditambahkan");
      handleCloseModal();
    },
    onError: () => toast.error("Gagal menambahkan perawat"),
  });

  // B. Update Perawat
  const updateMutation = useMutation({
    mutationFn: async (data: PerawatFormData) => {
      return await api.put(`/perawat/${selectedId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perawatList"] });
      toast.success("Data perawat berhasil diperbarui");
      handleCloseModal();
    },
    onError: () => toast.error("Gagal memperbarui data perawat"),
  });

  // C. Delete Perawat (Soft Delete)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/perawat/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perawatList"] });
      toast.success("Perawat berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus perawat"),
  });

  // =========================================================================
  // 4. HANDLER FUNGSI
  // =========================================================================
  const onSubmitForm: SubmitHandler<PerawatFormData> = (data) => {
    if (isEditMode && selectedId !== null) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAddClick = () => {
    setIsEditMode(false);
    setSelectedId(null);
    reset({
      nama_perawat: "",
      no_telepon: "",
      alamat: "",
    });
    onOpen();
  };

  const handleEditClick = (perawat: Perawat) => {
    setIsEditMode(true);
    setSelectedId(perawat.id);
    setValue("nama_perawat", perawat.nama_perawat);
    setValue("no_telepon", perawat.no_telepon || "");
    setValue("alamat", perawat.alamat || "");
    onOpen();
  };

  const handleDeleteClick = (id: number, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus perawat ${nama}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    onClose();
    reset();
    setIsEditMode(false);
    setSelectedId(null);
  };

  // =========================================================================
  // 5. RENDER UI
  // =========================================================================
  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-klinik-blue rounded-xl">
            <Stethoscope size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Master Perawat</h1>
            <p className="text-sm text-slate-500">
              Kelola data referensi perawat dan tenaga medis klinik.
            </p>
          </div>
        </div>
        <Button
          color="primary"
          className="bg-klinik-blue font-semibold shadow-md"
          startContent={<Plus size={18} />}
          onPress={handleAddClick}
        >
          Tambah Perawat
        </Button>
      </div>

      {/* PENCARIAN */}
      <Card className="shadow-sm border border-slate-100">
        <CardBody>
          <Input
            isClearable
            className="w-full sm:max-w-md"
            placeholder="Cari Nama Perawat..."
            startContent={<Search className="text-default-300" size={18} />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            variant="bordered"
          />
        </CardBody>
      </Card>

      {/* TABEL DATA PERAWAT */}
      <div className="overflow-x-auto w-full">
        <Table
          aria-label="Tabel Master Perawat"
          className="shadow-sm border border-slate-200 min-w-max"
        >
          <TableHeader>
            <TableColumn>NAMA PERAWAT</TableColumn>
            <TableColumn>NO. TELEPON</TableColumn>
            <TableColumn>ALAMAT</TableColumn>
            <TableColumn align="center">AKSI</TableColumn>
          </TableHeader>
          <TableBody
            items={filteredPerawat}
            isLoading={isLoading}
            loadingContent={<Spinner size="md" color="primary" />}
            emptyContent={isLoading ? " " : "Tidak ada data perawat ditemukan."}
          >
            {(perawat) => (
              <TableRow key={perawat.id}>
                <TableCell>
                  <div className="font-semibold text-slate-700 uppercase">
                    {perawat.nama_perawat}
                  </div>
                </TableCell>
                <TableCell>
                  {perawat.no_telepon ? (
                    <div className="flex items-center gap-2 text-slate-600 font-mono text-sm">
                      <Phone size={14} /> {perawat.no_telepon}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Belum diisi</span>
                  )}
                </TableCell>
                <TableCell>
                  {perawat.alamat ? (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin size={14} /> {perawat.alamat}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Belum diisi</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Tooltip content="Edit Data">
                      <Button
                        isIconOnly
                        size="sm"
                        color="warning"
                        variant="flat"
                        onPress={() => handleEditClick(perawat)}
                      >
                        <Edit2 size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Hapus Perawat" color="danger">
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => handleDeleteClick(perawat.id, perawat.nama_perawat)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL FORM TAMBAH / EDIT PERAWAT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        onClose={handleCloseModal}
      >
        <ModalContent>
          {() => (
            <form onSubmit={handleSubmit(onSubmitForm)}>
              <ModalHeader className="flex flex-col gap-1 border-b">
                <span className="text-lg font-bold">
                  {isEditMode ? "Edit Data Perawat" : "Tambah Perawat Baru"}
                </span>
              </ModalHeader>

              <ModalBody className="py-6 flex flex-col gap-4">
                <Input
                  {...register("nama_perawat")}
                  isRequired
                  label="Nama Lengkap & Gelar"
                  placeholder="Contoh: Mutmainnah, Amd. Kep"
                  variant="bordered"
                  isInvalid={!!errors.nama_perawat}
                  errorMessage={errors.nama_perawat?.message}
                />
                <Input
                  {...register("no_telepon")}
                  label="Nomor Telepon"
                  placeholder="Contoh: 08123456789"
                  variant="bordered"
                  isInvalid={!!errors.no_telepon}
                  errorMessage={errors.no_telepon?.message}
                />
                <Input
                  {...register("alamat")}
                  label="Alamat Lengkap"
                  placeholder="Masukkan alamat domisili..."
                  variant="bordered"
                  isInvalid={!!errors.alamat}
                  errorMessage={errors.alamat?.message}
                />
              </ModalBody>

              <ModalFooter className="border-t bg-slate-50">
                <Button color="danger" variant="flat" onPress={handleCloseModal}>
                  Batal
                </Button>
                <Button
                  color="primary"
                  className="bg-klinik-blue font-semibold"
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {isEditMode ? "Simpan Perubahan" : "Simpan Data"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}