"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Card, CardHeader, CardBody, Input, Button } from "@nextui-org/react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
// =========================================================================
// 1. SKEMA VALIDASI (YUP)
// Di sini kita mendefinisikan aturan form. Sangat rapi dan terpusat!
// =========================================================================
const loginSchema = yup.object().shape({
  username: yup.string().required("Username tidak boleh kosong"),
  password: yup.string().required("Password wajib diisi"),
});

// Inferensi tipe data otomatis dari skema Yup
type LoginFormData = yup.InferType<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const toggleVisibility = () => setIsVisible(!isVisible);

  // =========================================================================
  // 2. INIT REACT HOOK FORM
  // Tidak perlu lagi useState yang panjang untuk formData!
  // =========================================================================
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  // =========================================================================
  // 3. FUNGSI SUBMIT (Dikelola otomatis oleh handleSubmit)
  // =========================================================================
  const onSubmit = async (data: LoginFormData) => {
    setGlobalError(""); // Reset pesan error sebelumnya

    try {
      // Menembak fungsi 'authorize' di NextAuth (src/app/api/auth/[...nextauth]/route.ts)
      const res = await signIn("credentials", {
        redirect: false, // Matikan redirect otomatis agar kita bisa cek role
        username: data.username,
        password: data.password,
      });

      if (res?.error) {
        // Error yang dilempar dari backend (via NextAuth) akan masuk ke sini
        setGlobalError(res.error);
        return;
      }

      // Jika sukses, kita ambil sesi terenkripsi yang baru saja dibuat NextAuth
      const session = await getSession();

      // Redirect pintar berdasarkan Role
      if (session?.user?.role === "DOKTER") {
        router.push("/dashboard/dokter/antrean");
      } else {
        router.push("/dashboard/resepsionis/antrean");
      }
    } catch (error) {
      console.error("Login Client Error:", error);
      setGlobalError("Terjadi kesalahan jaringan yang tidak terduga.");
    }
  };

  // =========================================================================
  // 4. RENDER UI
  // =========================================================================
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
      <Card className="w-full max-w-md p-4 shadow-xl">
        <CardHeader className="flex flex-col items-center gap-2 pb-0 pt-2 px-4">
          <div className="p-3 bg-blue-100 text-klinik-blue rounded-full">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Klinik WMC</h1>
          <p className="text-sm text-slate-500">
            Secure Electronic Medical Record
          </p>
        </CardHeader>

        <CardBody className="overflow-hidden">
          {/* Form kini dibungkus handleSubmit dari React Hook Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 mt-4"
          >
            {globalError && (
              <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center font-medium">
                {globalError}
              </div>
            )}

            <Input
              {...register("username")} // Menyambungkan Input dengan React Hook Form
              label="Username"
              placeholder="Masukkan username Anda"
              variant="bordered"
              // Integrasi error otomatis dari Yup ke UI NextUI
              isInvalid={!!errors.username}
              errorMessage={errors.username?.message}
            />

            <Input
              {...register("password")}
              label="Password"
              placeholder="Masukkan password"
              variant="bordered"
              type={isVisible ? "text" : "password"}
              isInvalid={!!errors.password}
              errorMessage={errors.password?.message}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility}
                >
                  {isVisible ? (
                    <EyeOff className="text-2xl text-slate-400" />
                  ) : (
                    <Eye className="text-2xl text-slate-400" />
                  )}
                </button>
              }
            />

            <Button
              type="submit"
              color="primary"
              className="w-full mt-2 bg-klinik-blue font-semibold text-lg"
              isLoading={isSubmitting} // Efek loading otomatis dari formState
            >
              {isSubmitting ? "Memverifikasi..." : "Masuk"}
            </Button>

            {/* Tambahkan kode ini di bawah tombol Submit Login */}
            <div className="text-center text-sm text-slate-500 mt-4">
              Belum punya akun pegawai?{" "}
              <Link
                href="/register"
                className="text-klinik-blue font-bold hover:underline"
              >
                Daftar di sini
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
