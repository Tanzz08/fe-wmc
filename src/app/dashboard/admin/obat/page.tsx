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
} from "@nextui-org/react";
import { Plus, Edit2, Trash2, PackageSearch } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

export default function AdminObatPage() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    nama_obat: "",
    satuan: "",
    stok: "",
    harga: "",
  });

  const { data: listObat = [], isLoading } = useQuery({
    queryKey: ["adminMasterObat"],
    queryFn: async () => {
      const res = await api.get("/obat");
      return res.data?.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) return await api.put(`/obat/${data.id}`, data);
      return await api.post("/obat", data);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Obat diperbarui!" : "Obat ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["adminMasterObat"] });
      onOpenChange();
    },
    onError: () => toast.error("Terjadi kesalahan sistem."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await api.delete(`/obat/${id}`),
    onSuccess: () => {
      toast.success("Obat dihapus.");
      queryClient.invalidateQueries({ queryKey: ["adminMasterObat"] });
    },
  });

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({ id: "", nama_obat: "", satuan: "", stok: "", harga: "" });
    onOpen();
  };

  const handleOpenEdit = (item: any) => {
    setIsEdit(true);
    setFormData({
      id: item.id,
      nama_obat: item.nama_obat,
      satuan: item.satuan,
      stok: item.stok.toString(),
      harga: item.harga ? item.harga.toString() : "",
    });
    onOpen();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <PackageSearch className="text-klinik-blue" /> Master Data Obat
          </h1>
          <p className="text-sm text-slate-500">
            Kelola inventaris dan koreksi stok obat secara menyeluruh (Akses
            Admin).
          </p>
        </div>
        <Button
          color="primary"
          className="bg-klinik-blue shadow-md font-bold"
          onPress={handleOpenAdd}
          startContent={<Plus size={18} />}
        >
          Tambah Obat Baru
        </Button>
      </div>

      <Table
        aria-label="Tabel Master Obat"
        className="shadow-sm border border-slate-200"
      >
        <TableHeader>
          <TableColumn>NAMA OBAT</TableColumn>
          <TableColumn>SATUAN</TableColumn>
          <TableColumn align="center">STOK SAAT INI</TableColumn>
          <TableColumn>HARGA (OPSIONAL)</TableColumn>
          <TableColumn align="center">AKSI</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading ? <Spinner /> : "Belum ada data obat."}
          items={listObat}
        >
          {(item: any) => (
            <TableRow key={item.id}>
              <TableCell className="font-bold uppercase">
                {item.nama_obat}
              </TableCell>
              <TableCell>{item.satuan}</TableCell>
              <TableCell>
                <span
                  className={`font-bold px-3 py-1 rounded-full text-xs ${item.stok < 10 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {item.stok}
                </span>
              </TableCell>
              <TableCell>
                {item.harga ? `Rp ${item.harga.toLocaleString("id-ID")}` : "-"}
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    color="warning"
                    variant="flat"
                    onPress={() => handleOpenEdit(item)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="flat"
                    isLoading={deleteMutation.isPending}
                    onPress={() => {
                      if (confirm("Yakin hapus obat ini?"))
                        deleteMutation.mutate(item.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
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
              <ModalHeader>
                {isEdit ? "Edit Data Obat" : "Tambah Obat Baru"}
              </ModalHeader>
              <ModalBody className="flex flex-col gap-4">
                <Input
                  label="Nama Obat"
                  value={formData.nama_obat}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_obat: e.target.value })
                  }
                  isRequired
                  variant="bordered"
                />
                <Input
                  label="Satuan"
                  placeholder="Contoh: Tablet / Sirup"
                  value={formData.satuan}
                  onChange={(e) =>
                    setFormData({ ...formData, satuan: e.target.value })
                  }
                  isRequired
                  variant="bordered"
                />
                <Input
                  type="number"
                  label="Stok Fisik"
                  value={formData.stok}
                  onChange={(e) =>
                    setFormData({ ...formData, stok: e.target.value })
                  }
                  isRequired
                  variant="bordered"
                />
                <Input
                  type="number"
                  label="Harga (Rp)"
                  placeholder="Opsional"
                  value={formData.harga}
                  onChange={(e) =>
                    setFormData({ ...formData, harga: e.target.value })
                  }
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Batal
                </Button>
                <Button
                  color="primary"
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
