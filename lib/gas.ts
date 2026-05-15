// ============================================================
// GOOGLE APPS SCRIPT (GAS) — Google Drive Uploader
// ============================================================

import { createClient } from "@/lib/supabase/client";
import type { Siswa } from "@/types";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;

// ── Dev-only logger (silenced in production) ─────────────────
const log = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[GAS]", ...args);
  }
};
const logError = (...args: unknown[]) => {
  console.error("[GAS]", ...args);
};

// ── Upload single file to Google Drive via GAS ───────────────
export async function uploadFileToGDrive(
  file: File,
  prefixName: string,
  studentFolderName?: string,
): Promise<string> {
  log(`Starting upload: ${prefixName} / ${file.name}`);

  if (!GAS_URL) {
    logError("NEXT_PUBLIC_GAS_WEB_APP_URL tidak diset");
    throw new Error("NEXT_PUBLIC_GAS_WEB_APP_URL tidak diset");
  }

  if (!file) throw new Error("File tidak ada");

  // Validate size (max 5 MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(
      `File terlalu besar. Maksimal 5MB, file ini ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  // Validate type
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `Tipe file tidak didukung: ${file.type}. Gunakan: JPG, PNG, GIF, WebP, atau PDF`,
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) throw new Error("File tidak memiliki ekstensi");

  const base64Data = await fileToBase64(file);
  const cleanName = prefixName.replace(/[^a-zA-Z0-9_-]/g, "_");

  // Extract NISN from prefixName (last part after _)
  const nisn = prefixName.split("_").pop() || "UNKNOWN";

  const payload = {
    name: `${cleanName}.${ext}`,
    type: file.type,
    base64: base64Data,
    studentName: studentFolderName || `SPMB_${nisn}`, // This is what getFoldersByName expects!
  };

  log(`Uploading: ${payload.name}`);

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // Note: intentionally NOT 'application/json' to avoid CORS preflight OPTIONS request
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      logError(`HTTP ${res.status}: ${errorText}`);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const result = (await res.json()) as {
      status: string;
      url?: string;
      error?: string;
    };
    log("Response:", result);

    if (result.status === "sukses" && result.url) {
      return result.url;
    }

    throw new Error(result.error || "Upload ke Google Drive gagal");
  } catch (err) {
    logError("Fetch error:", err instanceof Error ? err.message : err);
    throw err;
  }
}

// ── Convert Google Drive URL to direct viewable link ─────────
export function konversiDirectLink(url: string): string {
  if (!url) return "";

  let driveId = "";

  // Format 1: ?id=FILEID
  const match1 = url.match(/id=([^&]+)/);
  if (match1?.[1]) driveId = match1[1];

  // Format 2: /d/FILEID/view
  if (!driveId) {
    const match2 = url.match(/\/d\/([^/]+)/);
    if (match2?.[1]) driveId = match2[1];
  }

  // Format 3: already direct lh3.googleusercontent.com/d/...
  if (!driveId) {
    const match3 = url.match(/lh3\.googleusercontent\.com\/d\/([^/?]+)/);
    if (match3?.[1]) return url;
  }

  if (!driveId) return url;

  return `https://lh3.googleusercontent.com/d/${driveId}=s0`;
}

// ── Progress callback type ────────────────────────────────────
export interface UploadProgress {
  current: number;
  total: number;
  fileName: string;
  status: "success" | "skip" | "error";
  message: string;
}

// ── Bulk photo sync: match file name (NISN) to student ───────
export async function uploadFotoMasal(
  files: File[],
  dataSiswa: Siswa[],
  onProgress?: (p: UploadProgress) => void,
): Promise<{ success: number; skip: number; error: number }> {
  log(`Bulk upload start: ${files.length} files, ${dataSiswa.length} students`);

  const supabase = createClient();
  let success = 0;
  let skip = 0;
  let errorCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Extract NISN from filename (without extension)
    const idIdentitas = file.name
      .substring(0, file.name.lastIndexOf("."))
      .trim();
    const siswa = dataSiswa.find(
      (s) => String(s.nisn).trim() === String(idIdentitas).trim(),
    );

    if (!siswa) {
      skip++;
      onProgress?.({
        current: i + 1,
        total: files.length,
        fileName: file.name,
        status: "skip",
        message: `NISN "${idIdentitas}" tidak ditemukan`,
      });
      continue;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const VALID_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
      if (!fileExt || !VALID_EXTENSIONS.includes(fileExt.toLowerCase())) {
        throw new Error(
          `Format file tidak valid: ${file.name}. Gunakan jpg, jpeg, png, atau webp.`,
        );
      }
      const fileName = `siswa_${idIdentitas}_${Date.now()}.${fileExt}`;
      const filePath = `siswa/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(`Gagal upload ke Supabase: ${uploadError.message}`);
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("siswa")
        .update({
          foto_url: data.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", siswa.id);

      if (updateError) {
        throw new Error(`Gagal update database: ${updateError.message}`);
      }

      success++;
      onProgress?.({
        current: i + 1,
        total: files.length,
        fileName: file.name,
        status: "success",
        message: `✓ Foto ${siswa.nama} berhasil sinkronisasi`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      logError(`Error processing ${file.name}: ${errorMsg}`);
      errorCount++;
      onProgress?.({
        current: i + 1,
        total: files.length,
        fileName: file.name,
        status: "error",
        message: `✗ Gagal: ${errorMsg}`,
      });
    }
  }

  log(
    `Bulk upload complete: ${success} OK, ${skip} skipped, ${errorCount} errors`,
  );
  return { success, skip, error: errorCount };
}

// ── File → base64 helper ─────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (!result?.includes("base64,")) {
        reject(new Error("Invalid file format or corrupted file"));
        return;
      }
      const base64Data = result.split(",")[1];
      if (!base64Data) {
        reject(new Error("Failed to extract base64 data"));
        return;
      }
      resolve(base64Data);
    };
    reader.onerror = () => reject(new Error("File reading failed"));
    reader.readAsDataURL(file);
  });
}
