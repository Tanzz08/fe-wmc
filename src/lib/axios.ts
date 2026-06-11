import axios from "axios";
import { getSession } from "next-auth/react";

// Inisialisasi Axios dengan URL Backend
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios Interceptor: Menyelipkan token sebelum request dikirim ke backend
api.interceptors.request.use(
  async (config) => {
    // Ambil sesi NextAuth yang sedang aktif
    const session = await getSession();

    // PENTING: Ambil properti 'token' (huruf kecil) yang menyimpan token Express
    const backendToken = session?.user?.token;

    // Jika ada token, masukkan ke Header Authorization
    if (backendToken) {
      config.headers.Authorization = `Bearer ${backendToken}`;
      console.log("Token disuntikkan:", backendToken); // Buka komen ini jika ingin tes
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
