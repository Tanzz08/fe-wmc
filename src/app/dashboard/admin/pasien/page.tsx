"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Spinner,
  Select,
  SelectItem,
  Chip,
} from "@nextui-org/react";
import { Users, Edit2, Trash2, ShieldAlert, Plus } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// Sesuaikan dengan skema Prisma
interface Pasien {
  id_rm: string;
  nama: string;
  nik: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  alamat: string;
  no_telepon: string;
  is_active: boolean;
}

export default function AdminPasienPage() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    id_rm: "",
    nama: "",
    nik: "",
    tanggal_lahir: "",
    jenis_kelamin: "",
    alamat: "",
    no_telepon: "",
  });

  // 1. Fetch Data Pasien
  const { data: listPasien = [], isLoading } = useQuery<Pasien[]>({
    queryKey: ["adminMasterPasien"],
    queryFn: async () => {
      const res = await api.get("/pasien");
      return res.data?.data || [];
    },
  });

  // 2. Mutasi Simpan (Add/Edit)
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) return await api.put(`/pasien/${data.id_rm}`, data);
      return await api.post("/pasien", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit ? "Data pasien diperbarui!" : "Pasien baru ditambahkan!",
      );
      queryClient.invalidateQueries({ queryKey: ["adminMasterPasien"] });
      onOpenChange();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Terjadi kesalahan.");
    },
  });

  // 3. Mutasi Soft Delete (Nonaktifkan)
  const deleteMutation = useMutation({
    mutationFn: async (id_rm: string) => await api.delete(`/pasien/${id_rm}`),
    onSuccess: () => {
      toast.success("Pasien berhasil dinonaktifkan (Soft Delete).");
      queryClient.invalidateQueries({ queryKey: ["adminMasterPasien"] });
    },
    onError: () => toast.error("Gagal menonaktifkan data pasien."),
  });

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({
      id_rm: "",
      nama: "",
      nik: "",
      tanggal_lahir: "",
      jenis_kelamin: "",
      alamat: "",
      no_telepon: "",
    });
    onOpen();
  };

  const handleOpenEdit = (item: Pasien) => {
    setIsEdit(true);
    setFormData({
      id_rm: item.id_rm,
      nama: item.nama,
      nik: item.nik,
      tanggal_lahir: new Date(item.tanggal_lahir).toISOString().split("T")[0], // Format ke YYYY-MM-DD untuk input date
      jenis_kelamin: item.jenis_kelamin,
      alamat: item.alamat,
      no_telepon: item.no_telepon,
    });
    onOpen();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <Users className="text-klinik-blue" /> Master Data Pasien
          </h1>
          <p className="text-sm text-slate-500">
            Kelola data demografi pasien, koreksi kesalahan input, dan
            nonaktifkan data (Soft Delete).
          </p>
        </div>
        <Button
          color="primary"
          className="bg-klinik-blue shadow-md font-bold"
          onPress={handleOpenAdd}
          startContent={<Plus size={18} />}
        >
          Tambah Pasien
        </Button>
      </div>

      <Table
        aria-label="Tabel Master Pasien"
        className="shadow-sm border border-slate-200"
      >
        <TableHeader>
          <TableColumn>NO. RM</TableColumn>
          <TableColumn>NAMA PASIEN</TableColumn>
          <TableColumn>NIK & KONTAK</TableColumn>
          <TableColumn>L/P</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn align="center">AKSI</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading ? <Spinner /> : "Belum ada data pasien."}
          items={listPasien}
        >
          {(item) => (
            <TableRow key={item.id_rm}>
              <TableCell className="font-mono font-bold text-klinik-blue">
                {item.id_rm}
              </TableCell>
              <TableCell className="font-semibold uppercase">
                {item.nama}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.nik}</span>
                  <span className="text-xs text-slate-500">
                    {item.no_telepon}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {item.jenis_kelamin === "Laki-laki" ? "L" : "P"}
              </TableCell>
              <TableCell>
                {item.is_active ? (
                  <Chip color="success" variant="flat" size="sm">
                    Aktif
                  </Chip>
                ) : (
                  <Chip
                    color="danger"
                    variant="flat"
                    size="sm"
                    startContent={<ShieldAlert size={12} />}
                  >
                    Nonaktif
                  </Chip>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    color="warning"
                    variant="flat"
                    onPress={() => handleOpenEdit(item)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  {/* Sembunyikan tombol hapus jika sudah nonaktif */}
                  {item.is_active && (
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="flat"
                      isLoading={deleteMutation.isPending}
                      onPress={() => {
                        if (
                          confirm(
                            `Yakin ingin menonaktifkan pasien ${item.nama}?`,
                          )
                        )
                          deleteMutation.mutate(item.id_rm);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* MODAL FORM PASIEN */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b">
                {isEdit ? "Edit Data Pasien" : "Tambah Data Pasien"}
                {isEdit && (
                  <span className="text-xs text-slate-500 font-normal">
                    Pastikan NIK, Alamat, dan Telepon terisi dengan benar (akan
                    otomatis dienkripsi AES oleh sistem).
                  </span>
                )}
              </ModalHeader>
              <ModalBody className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ID RM disembunyikan saat tambah, hanya read-only saat edit */}
                {isEdit && (
                  <Input
                    label="No. Rekam Medis"
                    variant="flat"
                    value={formData.id_rm}
                    isReadOnly
                    className="md:col-span-2"
                  />
                )}

                <Input
                  label="Nama Lengkap"
                  variant="bordered"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  isRequired
                />
                <Input
                  label="NIK"
                  variant="bordered"
                  value={formData.nik}
                  onChange={(e) =>
                    setFormData({ ...formData, nik: e.target.value })
                  }
                  isRequired
                />

                <Input
                  label="Tanggal Lahir"
                  type="date"
                  variant="bordered"
                  value={formData.tanggal_lahir}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggal_lahir: e.target.value })
                  }
                  isRequired
                />
                <Select
                  label="Jenis Kelamin"
                  variant="bordered"
                  selectedKeys={
                    formData.jenis_kelamin ? [formData.jenis_kelamin] : []
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, jenis_kelamin: e.target.value })
                  }
                  isRequired
                >
                  <SelectItem key="Laki-laki" value="Laki-laki">
                    Laki-laki
                  </SelectItem>
                  <SelectItem key="Perempuan" value="Perempuan">
                    Perempuan
                  </SelectItem>
                </Select>

                <Input
                  label="No. Telepon / WA"
                  variant="bordered"
                  value={formData.no_telepon}
                  onChange={(e) =>
                    setFormData({ ...formData, no_telepon: e.target.value })
                  }
                  isRequired
                />
                <Input
                  label="Alamat Lengkap"
                  variant="bordered"
                  value={formData.alamat}
                  onChange={(e) =>
                    setFormData({ ...formData, alamat: e.target.value })
                  }
                  className="md:col-span-2"
                  isRequired
                />
              </ModalBody>
              <ModalFooter className="border-t bg-slate-50">
                <Button color="danger" variant="light" onPress={onClose}>
                  Batal
                </Button>
                <Button
                  color="primary"
                  className="bg-klinik-blue font-bold"
                  isLoading={saveMutation.isPending}
                  onPress={() => saveMutation.mutate(formData)}
                >
                  Simpan Data
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
