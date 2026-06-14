"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Card, CardHeader, CardBody, Input, Button } from "@nextui-org/react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

// =========================================================================
// 1. SKEMA VALIDASI (YUP)
// =========================================================================
const loginSchema = yup.object().shape({
  username: yup.string().required("Username tidak boleh kosong"),
  password: yup.string().required("Password wajib diisi"),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

// =========================================================================
// 2. KOMPONEN INTI (LOGIN FORM)
// Di sinilah semua logika dan useSearchParams berada
// =========================================================================
function LoginForm() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const toggleVisibility = () => setIsVisible(!isVisible);

  // Ambil data sesi
  const { data: session, status } = useSession();

  // Logika Pemantau Sesi (Pindah otomatis)
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      if (callbackUrl && callbackUrl !== "/") {
        router.push(callbackUrl);
        return;
      }

      const role = session.user.role;
      if (role === "SUPER_ADMIN") router.push("/dashboard/admin/users");
      else if (role === "RESEPSIONIS")
        router.push("/dashboard/resepsionis/antrean");
      else if (role === "DOKTER") router.push("/dashboard/dokter/antrean");
      else if (role === "APOTEKER") router.push("/dashboard/apoteker/antrean");
    }
  }, [status, session, router, callbackUrl]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setGlobalError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        username: data.username,
        password: data.password,
      });

      if (res?.error) {
        setGlobalError(res.error);
        return;
      }
    } catch (error) {
      console.error("Login Client Error:", error);
      setGlobalError("Terjadi kesalahan jaringan yang tidak terduga.");
    }
  };

  return (
    <div
      className="relative flex justify-center items-center min-h-screen p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/img/bg-klinik.jpeg')" }}
    >
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
              {...register("username")}
              label="Username"
              placeholder="Masukkan username Anda"
              variant="bordered"
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
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Memverifikasi..." : "Masuk"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

// =========================================================================
// 3. PEMBUNGKUS UTAMA (DEFAULT EXPORT)
// Tugasnya hanya membungkus LoginForm dengan Suspense agar lolos build Vercel
// =========================================================================
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Memuat...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
