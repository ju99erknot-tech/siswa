"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Users,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Save,
  Camera,
  Sparkles,
  Loader2,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Brain,
  MessageSquare,
  Plus,
  Minus,
  RefreshCw,
  Heart,
} from "lucide-react";
import type { Siswa } from "@/types";
import { FormWizard } from "@/components/shared/FormWizard";
import {
  KUMPULAN_AGAMA,
  KUMPULAN_PENDIDIKAN,
  KUMPULAN_PENGHASILAN,
  KUMPULAN_JENIS_TINGGAL,
  KUMPULAN_TRANSPORTASI,
  KEBUTUHAN_KHUSUS,
} from "@/types";
import { useSiswa } from "@/hooks/useSiswa";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app.store";

// â”€â”€ Local constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PEKERJAAN_OPTIONS = [
  "PNS/ASN",
  "TNI/POLRI",
  "Pegawai Swasta",
  "Wiraswasta/Pedagang",
  "Petani/Pekebun",
  "Nelayan",
  "Buruh/Pekerja Tidak Tetap",
  "Pensiunan",
  "Ibu Rumah Tangga",
  "Tidak Bekerja",
  "Lainnya",
] as const;

const BANK_OPTIONS = [
  "BRI",
  "BNI",
  "BCA",
  "Mandiri",
  "BSI (Bank Syariah Indonesia)",
  "BTN",
  "CIMB Niaga",
  "Danamon",
  "BJB",
  "Bank DKI",
  "Lainnya",
] as const;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Schema
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const schema = z.object({
  // Identitas
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  nisn: z.string().regex(/^\d{10}$/, "NISN harus tepat 10 digit angka"),
  nis: z.string().optional(),
  nik: z.string().optional(),
  no_kk: z.string().optional(),
  no_akta: z.string().optional(),
  tempat_lahir: z.string().optional(),
  tanggal_lahir: z.string().optional(),
  jk: z.enum(["L", "P"], {
    errorMap: () => ({ message: "Pilih jenis kelamin" }),
  }),
  agama: z.string().optional(),
  kebutuhan_khusus: z.string().optional(),
  jml_saudara: z.string().optional(),
  anak_ke: z.string().optional(),
  foto_url: z.string().optional(),
  // Domisili
  alamat: z.string().optional(),
  rt: z.string().optional(),
  rw: z.string().optional(),
  kode_pos: z.string().optional(),
  dusun: z.string().optional(),
  kelurahan: z.string().optional(),
  kecamatan: z.string().optional(),
  lintang: z.string().optional(),
  bujur: z.string().optional(),
  jenis_tinggal: z.string().optional(),
  alat_transportasi: z.string().optional(),
  telepon: z.string().optional(),
  no_wa: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Format email tidak valid",
    ),
  jarak_rumah: z.string().optional(),
  // Orang Tua - Ayah
  nama_ayah: z.string().optional(),
  nik_ayah: z.string().optional(),
  tahun_lahir_ayah: z.string().optional(),
  pendidikan_ayah: z.string().optional(),
  pekerjaan_ayah: z.string().optional(),
  penghasilan_ayah: z.string().optional(),
  // Orang Tua - Ibu
  nama_ibu: z.string().optional(),
  nik_ibu: z.string().optional(),
  tahun_lahir_ibu: z.string().optional(),
  pendidikan_ibu: z.string().optional(),
  pekerjaan_ibu: z.string().optional(),
  penghasilan_ibu: z.string().optional(),
  // Wali
  nama_wali: z.string().optional(),
  nik_wali: z.string().optional(),
  tahun_lahir_wali: z.string().optional(),
  pendidikan_wali: z.string().optional(),
  pekerjaan_wali: z.string().optional(),
  penghasilan_wali: z.string().optional(),
  // Akademik
  kelas: z.string().optional(),
  asal_sekolah: z.string().optional(),
  no_peserta_un: z.string().optional(),
  no_ijazah: z.string().optional(),
  skhun: z.string().optional(),
  // Fisik & Sosial
  berat_badan: z.string().optional(),
  tinggi_badan: z.string().optional(),
  lingkar_kepala: z.string().optional(),
  penerima_kps: z.string().optional(),
  no_kps: z.string().optional(),
  penerima_kip: z.string().optional(),
  no_kip: z.string().optional(),
  nama_kip: z.string().optional(),
  layak_pip: z.string().optional(),
  alasan_pip: z.string().optional(),
  no_kks: z.string().optional(),
  bank: z.string().optional(),
  no_rekening: z.string().optional(),
  nama_rekening: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const TABS = [
  {
    id: "identitas",
    label: "Identitas Diri",
    icon: User,
    fields: [
      "nama",
      "nisn",
      "nis",
      "nik",
      "no_kk",
      "no_akta",
      "tempat_lahir",
      "tanggal_lahir",
      "jk",
      "agama",
      "kebutuhan_khusus",
      "jml_saudara",
      "anak_ke",
    ],
  },
  {
    id: "domisili",
    label: "Domisili & Kontak",
    icon: MapPin,
    fields: [
      "alamat",
      "rt",
      "rw",
      "kode_pos",
      "dusun",
      "kelurahan",
      "kecamatan",
      "jenis_tinggal",
      "alat_transportasi",
      "telepon",
      "no_wa",
      "email",
      "jarak_rumah",
    ],
  },
  {
    id: "orangtua",
    label: "Data Orang Tua",
    icon: Users,
    fields: [
      "nama_ayah",
      "nik_ayah",
      "tahun_lahir_ayah",
      "pendidikan_ayah",
      "pekerjaan_ayah",
      "penghasilan_ayah",
      "nama_ibu",
      "nik_ibu",
      "tahun_lahir_ibu",
      "pendidikan_ibu",
      "pekerjaan_ibu",
      "penghasilan_ibu",
    ],
  },
  {
    id: "akademik",
    label: "Data Akademik",
    icon: GraduationCap,
    fields: ["kelas", "asal_sekolah", "no_peserta_un", "no_ijazah", "skhun"],
  },
  {
    id: "fisik_sosial",
    label: "Fisik & Sosial",
    icon: Heart,
    fields: [
      "berat_badan",
      "tinggi_badan",
      "lingkar_kepala",
      "penerima_kps",
      "no_kps",
      "penerima_kip",
      "no_kip",
      "nama_kip",
      "layak_pip",
      "alasan_pip",
      "no_kks",
      "bank",
      "no_rekening",
      "nama_rekening",
    ],
  },
] as const;

interface SiswaFormProps {
  initialData?: Siswa;
  mode: "tambah" | "edit";
  onSuccess?: (siswa: Siswa) => void;
}

const inputCls = [
  "w-full rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/10",
  "bg-white/[0.015] border border-white/[0.04]",
  "focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/10 focus:bg-white/[0.03]",
  "transition-all duration-200",
  "disabled:opacity-40",
].join(" ");

const selectCls = [
  "w-full rounded-xl px-4 py-2.5 text-sm text-white/90",
  "bg-white/[0.015] border border-white/[0.04] cursor-pointer appearance-none",
  "focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.03]",
  "transition-all duration-200",
].join(" ");

const labelCls = "block text-[10px] font-black text-white/20 uppercase tracking-[0.15em] mb-2";
const errorCls = "mt-1 text-xs text-red-400 flex items-center gap-1";

const Err = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className={errorCls}>
      <AlertCircle className="w-3 h-3" />
      {msg}
    </p>
  ) : null;

const Field = ({
  label,
  required,
  error,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={className}>
    <label className={labelCls}>
      {label}
      {required && <span className="text-violet-400 ml-0.5">*</span>}
    </label>
    {children}
    <Err msg={error} />
  </div>
);

// â”€â”€ Shared Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AIPanel({
  onExtract,
}: {
  onExtract: (data: Partial<FormData>) => void;
}) {
  const [activeMode, setActiveMode] = useState<"ocr" | "paste" | null>(null);
  const [pasted, setPasted] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOCR = async () => {
    toast.info("Fitur OCR segera hadir!");
  };

  const handlePaste = async () => {
    if (!pasted.trim()) return;
    setIsLoading(true);
    toast.info("Fitur AI Extract membutuhkan konfigurasi API.");
    setTimeout(() => setIsLoading(false), 800);
  };

  return (
    <div
      className="rounded-2xl p-4 mb-6"
      style={{
        background: "rgba(124,58,237,0.06)",
        border: "1px solid rgba(124,58,237,0.2)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-semibold text-white">
          Isi Otomatis dengan AI
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveMode(activeMode === "ocr" ? null : "ocr")}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeMode === "ocr" ? "bg-violet-500/20 text-violet-400 border border-violet-500/40" : "bg-white/5 text-white/60 border border-white/10"}`}
        >
          Scan Dokumen
        </button>
        <button
          type="button"
          onClick={() => setActiveMode(activeMode === "paste" ? null : "paste")}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeMode === "paste" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "bg-white/5 text-white/60 border border-white/10"}`}
        >
          Paste Teks
        </button>
      </div>
    </div>
  );
}

function StepperMinimap({
  activeTab,
  onTabClick,
  progress,
}: {
  activeTab: number;
  onTabClick: (i: number) => void;
  progress: number[];
}) {
  return (
    <div className="hidden lg:flex flex-col py-8 px-6 gap-0 sticky top-6">
      {TABS.map((tab, i) => {
        const Icon = tab.icon;
        const isActive = i === activeTab;
        const isDone = progress[i] > 0;
        const isLast = i === TABS.length - 1;

        return (
          <div key={tab.id} className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => onTabClick(i)}
              className="flex items-center gap-4 w-full group transition-all"
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isActive 
                    ? "bg-violet-600 shadow-lg shadow-violet-500/20 border border-violet-400/50" 
                    : isDone 
                      ? "bg-emerald-500/05 border border-emerald-500/10 text-emerald-400/60" 
                      : "bg-white/[0.02] border border-white/[0.04] text-white/10 group-hover:bg-white/[0.04] group-hover:text-white/30"
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="text-left">
                <div
                  className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${isActive ? "text-white/90" : "text-white/20 group-hover:text-white/40"}`}
                >
                  {tab.label}
                </div>
                <div className={`text-[9px] font-bold mt-0.5 ${isActive ? "text-violet-400/60" : "text-white/5"}`}>
                  {progress[i]}% <span className="uppercase tracking-tighter">Filled</span>
                </div>
              </div>
            </button>
            {!isLast && (
              <div
                className={`w-px h-10 ml-5 my-1.5 ${isDone ? "bg-emerald-500/10" : "bg-white/[0.03]"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

type RHFControl = ReturnType<typeof useForm<FormData>>["control"];
type RHFRegister = ReturnType<typeof useForm<FormData>>["register"];
type RHFErrors = ReturnType<typeof useForm<FormData>>["formState"]["errors"];
type RHFWatch = ReturnType<typeof useForm<FormData>>["watch"];

// â”€â”€ Tab 1: Identitas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TabIdentitas({
  register,
  control,
  errors,
  onAIExtract,
  setValue,
  watch,
}: {
  register: RHFRegister;
  control: RHFControl;
  errors: RHFErrors;
  onAIExtract: (d: Partial<FormData>) => void;
  setValue: any;
  watch: any;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fotoPreview = watch("foto_url");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 2MB!");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `siswa_${Date.now()}.${fileExt}`;
      const filePath = `siswa/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setValue("foto_url", publicUrl, { shouldValidate: true, shouldDirty: true });
      toast.success("Foto berhasil diunggah");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunggah foto");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <AIPanel onExtract={onAIExtract} />
      <div>
        <label className={labelCls}>Foto Siswa</label>
        <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
          <div className="relative w-20 h-20 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center overflow-hidden group shrink-0">
            {fotoPreview ? (
              <img
                src={fotoPreview}
                className="w-full h-full object-cover"
                alt="preview"
              />
            ) : (
              <Camera className="w-6 h-6 text-white/20" />
            )}
            <div
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              onClick={() => document.getElementById("foto-upload")?.click()}
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 w-full space-y-2">
            <input
              type="file"
              id="foto-upload"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              type="button"
              onClick={() => document.getElementById("foto-upload")?.click()}
              className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm rounded-xl transition-all"
            >
              Unggah dari Perangkat
            </button>
            <input
              type="url"
              placeholder="Atau masukkan URL foto"
              className={inputCls}
              {...register("foto_url")}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nama Lengkap" required error={errors.nama?.message}>
          <input className={inputCls} {...register("nama")} />
        </Field>
        <Field label="NISN" required error={errors.nisn?.message}>
          <input className={inputCls} maxLength={10} {...register("nisn")} />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="NIK" error={errors.nik?.message}>
          <input className={inputCls} maxLength={16} {...register("nik")} />
        </Field>
        <Field label="Tempat Lahir" error={errors.tempat_lahir?.message}>
          <input className={inputCls} {...register("tempat_lahir")} />
        </Field>
        <Field label="Tanggal Lahir" error={errors.tanggal_lahir?.message}>
          <input type="date" className={inputCls} {...register("tanggal_lahir")} />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Jenis Kelamin" required error={errors.jk?.message}>
          <Controller
            control={control}
            name="jk"
            render={({ field }) => (
              <div className="flex gap-2">
                {["L", "P"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => field.onChange(v)}
                    className={`flex-1 py-2 rounded-lg text-sm transition-all ${field.value === v ? "bg-violet-600 text-white" : "bg-white/5 text-white/40"}`}
                  >
                    {v === "L" ? "Laki-laki" : "Perempuan"}
                  </button>
                ))}
              </div>
            )}
          />
        </Field>
        <Field label="Agama" error={errors.agama?.message}>
          <select className={selectCls} {...register("agama")}>
            <option value="">-- Pilih --</option>
            {KUMPULAN_AGAMA.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

// â”€â”€ Tab 2: Domisili â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TabDomisili({
  register,
  control,
  errors,
}: {
  register: RHFRegister;
  control: RHFControl;
  errors: RHFErrors;
}) {
  return (
    <div className="space-y-4">
      <Field label="Alamat Lengkap" error={errors.alamat?.message}>
        <textarea className={`${inputCls} resize-none`} rows={3} {...register("alamat")} />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="RT" error={errors.rt?.message}>
          <input className={inputCls} {...register("rt")} />
        </Field>
        <Field label="RW" error={errors.rw?.message}>
          <input className={inputCls} {...register("rw")} />
        </Field>
        <Field label="Kode Pos" error={errors.kode_pos?.message}>
          <input className={inputCls} {...register("kode_pos")} />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="No. WA" error={errors.no_wa?.message}>
          <input className={inputCls} {...register("no_wa")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" className={inputCls} {...register("email")} />
        </Field>
      </div>
    </div>
  );
}

// â”€â”€ Tab 3: Orang Tua â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OrangTuaSection({ title, prefix, register, errors }: any) {
  return (
    <div className="space-y-4 p-5 rounded-[20px] bg-white/[0.01] border border-white/[0.03]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-500/40" />
        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nama">
          <input className={inputCls} {...register(`nama_${prefix}`)} />
        </Field>
        <Field label="NIK">
          <input className={inputCls} maxLength={16} {...register(`nik_${prefix}`)} />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Tahun Lahir">
          <input className={inputCls} type="number" placeholder="Contoh: 1980" {...register(`tahun_lahir_${prefix}`)} />
        </Field>
        <Field label="Pekerjaan">
          <select className={selectCls} {...register(`pekerjaan_${prefix}`)}>
            <option value="">-- Pilih --</option>
            {PEKERJAAN_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Penghasilan">
          <select className={selectCls} {...register(`penghasilan_${prefix}`)}>
            <option value="">-- Pilih --</option>
            {KUMPULAN_PENGHASILAN.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Pendidikan Terakhir">
        <select className={selectCls} {...register(`pendidikan_${prefix}`)}>
          <option value="">-- Pilih --</option>
          {KUMPULAN_PENDIDIKAN.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function TabOrangTua({ register, errors }: any) {
  const [showWali, setShowWali] = useState(false);
  return (
    <div className="space-y-4">
      <OrangTuaSection title="Data Ayah" prefix="ayah" register={register} errors={errors} />
      <OrangTuaSection title="Data Ibu" prefix="ibu" register={register} errors={errors} />
      <button
        type="button"
        onClick={() => setShowWali(!showWali)}
        className="text-xs font-bold text-violet-400 flex items-center gap-1"
      >
        {showWali ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        DATA WALI
      </button>
      {showWali && <OrangTuaSection title="Data Wali" prefix="wali" register={register} errors={errors} />}
    </div>
  );
}

// â”€â”€ Tab 4: Akademik â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TabAkademik({ register, errors }: any) {
  const { dataSiswa } = useAppStore();
  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map(s => s.kelas))).filter((k): k is string => !!k).sort();

  return (
    <div className="space-y-4">
      <Field label="Kelas">
        <select className={selectCls} {...register("kelas")}>
          <option value="">-- Pilih --</option>
          {KUMPULAN_KELAS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </Field>
      <Field label="Asal Sekolah">
        <input className={inputCls} {...register("asal_sekolah")} />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="No Peserta UN"><input className={inputCls} {...register("no_peserta_un")} /></Field>
        <Field label="No Ijazah"><input className={inputCls} {...register("no_ijazah")} /></Field>
        <Field label="SKHUN"><input className={inputCls} {...register("skhun")} /></Field>
      </div>
    </div>
  );
}

// â”€â”€ Tab 5: Fisik & Sosial â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TabFisikSosial({ register, watch }: any) {
  const pkps = watch("penerima_kps");
  const pkip = watch("penerima_kip");
  const plpip = watch("layak_pip");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Field label="BB (kg)"><input type="number" step="0.1" className={inputCls} {...register("berat_badan")} /></Field>
        <Field label="TB (cm)"><input type="number" step="0.1" className={inputCls} {...register("tinggi_badan")} /></Field>
        <Field label="Lingkar Kepala"><input type="number" step="0.1" className={inputCls} {...register("lingkar_kepala")} /></Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-[20px] bg-white/[0.01] border border-white/[0.03]">
        <Field label="Penerima KPS">
          <select className={selectCls} {...register("penerima_kps")}>
            <option value="Tidak">Tidak</option>
            <option value="Ya">Ya</option>
          </select>
        </Field>
        {pkps === "Ya" && <Field label="No KPS"><input className={inputCls} {...register("no_kps")} /></Field>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-[20px] bg-white/[0.01] border border-white/[0.03]">
        <Field label="Penerima KIP">
          <select className={selectCls} {...register("penerima_kip")}>
            <option value="Tidak">Tidak</option>
            <option value="Ya">Ya</option>
          </select>
        </Field>
        {pkip === "Ya" && (
          <div className="grid grid-cols-1 gap-2">
            <Field label="No KIP"><input className={inputCls} {...register("no_kip")} /></Field>
            <Field label="Nama di KIP"><input className={inputCls} {...register("nama_kip")} /></Field>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-[20px] bg-white/[0.01] border border-white/[0.03]">
        <Field label="Layak PIP">
          <select className={selectCls} {...register("layak_pip")}>
            <option value="Tidak">Tidak</option>
            <option value="Ya">Ya</option>
          </select>
        </Field>
        {plpip === "Ya" && <Field label="Alasan PIP"><input className={inputCls} {...register("alasan_pip")} /></Field>}
      </div>

      <div className="p-5 rounded-[20px] bg-white/[0.01] border border-white/[0.03] space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500/40" />
          <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Data Perbankan</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Bank">
            <select className={selectCls} {...register("bank")}>
              <option value="">-- Pilih --</option>
              {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="No Rekening"><input className={inputCls} {...register("no_rekening")} /></Field>
          <Field label="Atas Nama"><input className={inputCls} {...register("nama_rekening")} /></Field>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main Component
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DRAFT_KEY = "siswa-form-draft";

export default function SiswaForm({ initialData, mode, onSuccess }: SiswaFormProps) {
  const router = useRouter();
  const { addSiswa, updateSiswa } = useSiswa();
  const [activeTab, setActiveTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? Object.fromEntries(
          Object.entries(initialData).map(([k, v]) => [k, v === null ? undefined : v])
        ) as FormData
      : { jk: "L" as const },
  });

  const watchedValues = watch();

  const tabProgress = TABS.map((tab) => {
    const filled = (tab.fields as readonly string[]).filter((f) => {
      const v = watchedValues[f as keyof FormData];
      return v !== undefined && v !== null && v !== "";
    });
    return Math.round((filled.length / tab.fields.length) * 100);
  });

  const handleNext = async () => {
    const fieldsToValidate = TABS[activeTab].fields as any;
    const valid = await trigger(fieldsToValidate);
    if (valid) setActiveTab((t) => Math.min(t + 1, TABS.length - 1));
  };

  const handlePrev = () => setActiveTab((t) => Math.max(t - 1, 0));

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      if (mode === "edit" && initialData?.id) {
        await updateSiswa(initialData.id, data);
        toast.success("Berhasil diperbarui");
        onSuccess?.({ ...initialData, ...data } as Siswa);
        router.push(`/siswa/${initialData.id}`);
      } else {
        await addSiswa(data as any);
        toast.success("Berhasil ditambahkan");
        router.push("/siswa");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  });

  const WIZARD_STEPS = TABS.map(tab => ({
    id: tab.id,
    title: tab.label,
    description: `${tabProgress[TABS.indexOf(tab)]}% terisi`,
  }));

  const handleWizardComplete = () => {
    onSubmit();
  };

  const handleCanProceed = (stepId: string) => {
    const tabIndex = TABS.findIndex(t => t.id === stepId);
    if (tabIndex < 0) return true;
    // Trigger validation for current tab fields
    trigger(TABS[tabIndex].fields as any);
    return true;
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="bg-[#0d1221] border border-white/[0.03] rounded-2xl min-h-[500px] backdrop-blur-xl overflow-hidden">
        <FormWizard
          steps={WIZARD_STEPS}
          onComplete={handleWizardComplete}
          completeLabel={isSubmitting ? "Menyimpan..." : (mode === "edit" ? "Simpan Perubahan" : "Simpan Data")}
          canProceed={handleCanProceed}
          onStepChange={(_id, idx) => setActiveTab(idx)}
        >
          {(stepId) => {
            switch (stepId) {
              case 'identitas':
                return <TabIdentitas register={register} control={control} errors={errors} onAIExtract={() => {}} setValue={setValue} watch={watch} />;
              case 'domisili':
                return <TabDomisili register={register} control={control} errors={errors} />;
              case 'orangtua':
                return <TabOrangTua register={register} errors={errors} />;
              case 'akademik':
                return <TabAkademik register={register} errors={errors} />;
              case 'fisik_sosial':
                return <TabFisikSosial register={register} watch={watch} />;
              default:
                return null;
            }
          }}
        </FormWizard>
      </div>
    </form>
  );
}
