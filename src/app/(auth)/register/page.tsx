"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { ShieldCheck, UserPlus } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // State form pendaftaran
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "RESEPSIONIS", // Default role
    poli_tugas: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post("/auth/register", formData);
      toast.success("Akun berhasil dibuat! Silakan masuk.");
      // Jika berhasil, langsung arahkan ke halaman login
      router.push("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal membuat akun.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardBody className="p-8 flex flex-col gap-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-klinik-blue text-white p-3 rounded-full shadow-md">
                <UserPlus size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Registrasi Pegawai
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sistem Informasi Klinik WMC
            </p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input
              isRequired
              label="Username"
              placeholder="Masukkan username (tanpa spasi)"
              variant="bordered"
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value)}
            />

            <Input
              isRequired
              type="password"
              label="Password"
              placeholder="Masukkan password"
              variant="bordered"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
            />

            <Select
              isRequired
              label="Peran (Role)"
              variant="bordered"
              selectedKeys={[formData.role]}
              onChange={(e) => handleChange("role", e.target.value)}
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
            </Select>

            {/* Logika Cerdas: Tampilkan Input Poli HANYA jika Role = DOKTER */}
            {formData.role === "DOKTER" && (
              <Select
                isRequired
                label="Poli Tugas (Spesialisasi)"
                variant="bordered"
                selectedKeys={formData.poli_tugas ? [formData.poli_tugas] : []}
                onChange={(e) => handleChange("poli_tugas", e.target.value)}
              >
                <SelectItem key="Poli Umum" value="Poli Umum">
                  Poli Umum
                </SelectItem>
                <SelectItem key="Poli Gigi" value="Poli Gigi">
                  Poli Gigi
                </SelectItem>
                <SelectItem key="Poli KIA" value="Poli KIA">
                  Poli KIA
                </SelectItem>
              </Select>
            )}

            <Button
              type="submit"
              color="primary"
              className="mt-4 font-bold h-12 text-md bg-klinik-blue"
              isLoading={isLoading}
            >
              Buat Akun Pegawai
            </Button>
          </form>

          <div className="text-center text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-klinik-blue font-bold hover:underline"
            >
              Masuk di sini
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
