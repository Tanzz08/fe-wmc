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
import { Plus, Edit2, Trash2, UserCog, KeyRound } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// 1. UPDATE INTERFACE
interface User {
  id: number;
  nama_lengkap: string | null;
  username: string;
  role: string;
  poli_tugas: string | null;
}

export default function ManajemenPegawaiPage() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [isEdit, setIsEdit] = useState(false);
  // 2. UPDATE STATE DEFAULT
  const [formData, setFormData] = useState({
    id: "",
    nama_lengkap: "",
    username: "",
    password: "",
    role: "",
    poli_tugas: "",
  });

  const { data: listUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data?.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) return await api.put(`/users/${data.id}`, data);
      return await api.post("/users", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit ? "Data akun diperbarui!" : "Akun baru berhasil dibuat!",
      );
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      onOpenChange();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Terjadi kesalahan.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success("Akun berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: () =>
      toast.error("Gagal menghapus akun (mungkin sedang digunakan)."),
  });

  const handleOpenAdd = () => {
    setIsEdit(false);
    // Reset state termasuk nama_lengkap
    setFormData({
      id: "",
      nama_lengkap: "",
      username: "",
      password: "",
      role: "",
      poli_tugas: "",
    });
    onOpen();
  };

  const handleOpenEdit = (item: User) => {
    setIsEdit(true);
    setFormData({
      id: item.id.toString(),
      nama_lengkap: item.nama_lengkap || "",
      username: item.username,
      password: "",
      role: item.role,
      poli_tugas: item.poli_tugas || "",
    });
    onOpen();
  };

  const renderRoleChip = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <Chip color="danger" variant="flat" size="sm">
            Admin
          </Chip>
        );
      case "DOKTER":
        return (
          <Chip color="primary" variant="flat" size="sm">
            Dokter
          </Chip>
        );
      case "RESEPSIONIS":
        return (
          <Chip color="warning" variant="flat" size="sm">
            Resepsionis
          </Chip>
        );
      case "APOTEKER":
        return (
          <Chip color="success" variant="flat" size="sm">
            Apoteker
          </Chip>
        );
      default:
        return (
          <Chip variant="flat" size="sm">
            {role}
          </Chip>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <UserCog className="text-klinik-blue" /> Manajemen Pegawai
          </h1>
          <p className="text-sm text-slate-500">
            Buat akun, atur hak akses (role), dan reset password pegawai.
          </p>
        </div>
        <Button
          color="primary"
          className="bg-klinik-blue shadow-md font-bold"
          onPress={handleOpenAdd}
          startContent={<Plus size={18} />}
        >
          Buat Akun Pegawai
        </Button>
      </div>

      <Table
        aria-label="Tabel Manajemen Pegawai"
        className="shadow-sm border border-slate-200"
      >
        <TableHeader>
          {/* 3. TAMBAHKAN HEADER KOLOM BARU */}
          <TableColumn>NAMA LENGKAP</TableColumn>
          <TableColumn>USERNAME</TableColumn>
          <TableColumn>HAK AKSES</TableColumn>
          <TableColumn>POLI TUGAS</TableColumn>
          <TableColumn align="center">AKSI</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading ? <Spinner /> : "Belum ada data pegawai."}
          items={listUsers}
        >
          {(item) => (
            <TableRow key={item.id}>
              {/* 4. RENDER DATA NAMA LENGKAP */}
              <TableCell className="font-bold text-slate-700 capitalize">
                {item.nama_lengkap || (
                  <span className="text-slate-400 italic">Belum diatur</span>
                )}
              </TableCell>
              <TableCell className="font-mono text-slate-600">
                {item.username}
              </TableCell>
              <TableCell>{renderRoleChip(item.role)}</TableCell>
              <TableCell>
                {item.role === "DOKTER" ? (
                  <span className="font-semibold text-klinik-blue">
                    {item.poli_tugas || "Belum Ditentukan"}
                  </span>
                ) : (
                  <span className="text-slate-400">-</span>
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
                  {item.role !== "SUPER_ADMIN" && (
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="flat"
                      isLoading={deleteMutation.isPending}
                      onPress={() => {
                        if (confirm(`Yakin hapus akun ${item.username}?`))
                          deleteMutation.mutate(item.id);
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

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b">
                {isEdit ? "Edit Akun Pegawai" : "Buat Akun Baru"}
                {isEdit && (
                  <span className="text-xs text-slate-500 font-normal">
                    Biarkan field password kosong jika tidak ingin mereset
                    password.
                  </span>
                )}
              </ModalHeader>
              <ModalBody className="py-4 flex flex-col gap-4">
                {/* 5. TAMBAHKAN INPUT NAMA LENGKAP DI SINI */}
                <Input
                  label="Nama Lengkap"
                  placeholder="Contoh: dr. Budi Santoso"
                  variant="bordered"
                  value={formData.nama_lengkap}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_lengkap: e.target.value })
                  }
                  isRequired
                />

                <Input
                  label="Username"
                  variant="bordered"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  isRequired
                />

                <Input
                  label="Password"
                  type="password"
                  variant="bordered"
                  placeholder={
                    isEdit
                      ? "Ketik untuk reset password..."
                      : "Minimal 6 karakter"
                  }
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  isRequired={!isEdit}
                  startContent={
                    <KeyRound size={16} className="text-slate-400" />
                  }
                />

                <Select
                  label="Hak Akses (Role)"
                  variant="bordered"
                  selectedKeys={formData.role ? [formData.role] : []}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value,
                      poli_tugas: "",
                    })
                  }
                  isRequired
                >
                  <SelectItem key="RESEPSIONIS" value="RESEPSIONIS">
                    Resepsionis
                  </SelectItem>
                  <SelectItem key="DOKTER" value="DOKTER">
                    Dokter
                  </SelectItem>
                  <SelectItem key="APOTEKER" value="APOTEKER">
                    Apoteker
                  </SelectItem>
                  <SelectItem key="SUPER_ADMIN" value="SUPER_ADMIN">
                    Super Admin
                  </SelectItem>
                </Select>

                {formData.role === "DOKTER" && (
                  <Select
                    label="Poli Penugasan"
                    variant="bordered"
                    selectedKeys={
                      formData.poli_tugas ? [formData.poli_tugas] : []
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, poli_tugas: e.target.value })
                    }
                    isRequired
                  >
                    <SelectItem key="Poli Anak" value="Poli Anak">
                      Poli Anak
                    </SelectItem>
                    <SelectItem key="Poli Umum" value="Poli Umum">
                      Poli Umum
                    </SelectItem>
                    <SelectItem key="Poli Gigi" value="Poli Gigi">
                      Poli Gigi
                    </SelectItem>
                    <SelectItem key="Poli Obgyn" value="Poli Obgyn">
                      Poli Obgyn
                    </SelectItem>
                    <SelectItem key="Poli Interna" value="Poli Interna">
                      Poli Interna
                    </SelectItem>
                    <SelectItem key="Poli Jiwa" value="Poli Jiwa">
                      Poli Jiwa
                    </SelectItem>
                  </Select>
                )}
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
                  Simpan Akun
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
