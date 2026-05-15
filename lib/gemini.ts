// ============================================================
// GEMINI AI WRAPPER — Portal Kesiswaan
// ============================================================

import { SCHOOL } from "./school.config";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}
interface GeminiRequest {
  contents: { parts: GeminiPart[] }[];
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: { temperature?: number; maxOutputTokens?: number };
}

async function callAPI(payload: GeminiRequest): Promise<string> {
  if (!API_KEY) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY tidak diset");
  const res = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Gemini API Error");
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text as string;
}

// ── Text Generation ──────────────────────────────────────────
export async function callGemini(
  prompt: string,
  systemInstruction?: string,
): Promise<string> {
  return callAPI({
    contents: [{ parts: [{ text: prompt }] }],
    ...(systemInstruction && {
      systemInstruction: { parts: [{ text: systemInstruction }] },
    }),
    generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
  });
}

// ── Vision (OCR) ─────────────────────────────────────────────
export async function callGeminiVision(
  base64Image: string,
  prompt: string,
  mimeType?: string,
): Promise<string> {
  // Detect MIME type from data URL prefix (e.g. "data:image/png;base64,...")
  // If the caller passes an explicit mimeType, that takes priority.
  // If the prefix is absent and mimeType is not provided, default to "image/jpeg".
  let detectedMime: string = mimeType ?? "image/jpeg";
  if (!mimeType && base64Image.startsWith("data:")) {
    const match = base64Image.match(
      /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9.+\-]+);base64,/,
    );
    if (match) detectedMime = match[1];
  }

  // Strip data URL prefix so only the raw base64 payload is sent
  const pureBase64 = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  return callAPI({
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: detectedMime, data: pureBase64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
  });
}

// ── OCR Akta / KK ────────────────────────────────────────────
export async function extractDataOCR(
  base64Image: string,
): Promise<Record<string, string>> {
  const prompt = `Ekstrak data dari dokumen ini (Akta Kelahiran atau Kartu Keluarga) ke JSON.
Ketentuan: tanggalLahir harus YYYY-MM-DD, jk isi 'L' atau 'P'.
Respon HANYA JSON murni tanpa markdown.
{
  "nama":"","tempatLahir":"","tanggalLahir":"","jk":"",
  "namaAyah":"","namaIbu":"","alamat":"","agama":"Islam"
}`;
  const raw = await callGeminiVision(base64Image, prompt);
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn(
      "[extractDataOCR] Gagal parse JSON dari respons Gemini:",
      e,
      "\nRaw:",
      cleaned,
    );
    return {};
  }
}

// ── Smart Input (dari teks WA) ────────────────────────────────
export async function smartInputExtract(
  text: string,
): Promise<Record<string, string>> {
  const prompt = `Ekstrak informasi dari teks berikut ke JSON. Kosongkan field yang tidak ada.
Teks: "${text}"
Respon HANYA JSON murni:
{
  "nama":"","nisn":"","nis":"","nik":"","no_kk":"",
  "tempatLahir":"","tanggalLahir":"YYYY-MM-DD",
  "jk":"L atau P","agama":"","kelas":"",
  "alamat":"","kelurahan":"","kecamatan":"",
  "namaAyah":"","pekerjaanAyah":"","namaIbu":"","pekerjaanIbu":"",
  "noWa":"","asalSekolah":""
}`;
  const raw = await callGemini(
    prompt,
    "Anda adalah AI data-entry berkecepatan tinggi. Output JSON valid saja.",
  );
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn(
      "[smartInputExtract] Gagal parse JSON dari respons Gemini:",
      e,
      "\nRaw:",
      cleaned,
    );
    return {};
  }
}

// ── AI Chat dengan Konteks Sekolah ──────────────────────────
export async function chatWithAI(
  message: string,
  context?: {
    totalSiswa?: number;
    totalIzinMenunggu?: number;
    dataSummary?: string;
  },
): Promise<string> {
  const systemPrompt = `Anda adalah asisten AI untuk Portal Kesiswaan ${SCHOOL.nama}.
Tugas Anda: membantu administrasi sekolah, menjawab pertanyaan tentang data siswa, dan memberikan rekomendasi.
${context ? `Konteks saat ini: Siswa Aktif: ${context.totalSiswa || 0}, Izin Menunggu: ${context.totalIzinMenunggu || 0}. ${context.dataSummary || ""}` : ""}
Jawab dalam Bahasa Indonesia yang sopan dan ringkas.`;

  return callGemini(message, systemPrompt);
}

// ── Profil Narasi ─────────────────────────────────────────────
export async function generateProfilNarasi(data: {
  nama: string;
  kelas: string;
  jk: string;
  ttl: string;
  ortu: string;
  alamat: string;
}): Promise<string> {
  const prompt = `Buatkan paragraf singkat (3-4 kalimat) biodata profil naratif untuk arsip sekolah.
Nama: ${data.nama}, Kelas: ${data.kelas}, Jenis Kelamin: ${data.jk === "L" ? "Laki-laki" : "Perempuan"},
TTL: ${data.ttl}, Orang Tua: ${data.ortu}, Alamat: ${data.alamat}.
JANGAN gunakan blockticks markdown.`;
  return callGemini(
    prompt,
    "Anda adalah pengarsip biodata sekolah yang pandai merangkai kata.",
  );
}

// ── Surat Keterangan Aktif ────────────────────────────────────
export async function generateSuratKeterangan(data: {
  nama: string;
  nisn: string;
  kelas: string;
  ttl: string;
}): Promise<string> {
  const prompt = `Buatkan draf "Surat Keterangan Aktif Belajar" resmi untuk:
Nama: ${data.nama}, NISN: ${data.nisn}, Kelas: ${data.kelas}, TTL: ${data.ttl}
Instansi: ${SCHOOL.nama}.
Format HTML dasar (<p>,<br>,<b>). JANGAN gunakan markdown blockticks.`;
  return callGemini(
    prompt,
    "Anda adalah staf ahli tata usaha pembuat draf surat resmi sekolah.",
  );
}

// ── Laporan Statistik ─────────────────────────────────────────
export async function generateLaporanStatistik(stats: {
  totalSiswa: number;
  totalMasuk: number;
  totalKeluar: number;
  totalPrestasi: number;
}): Promise<string> {
  const prompt = `Buatkan Laporan Eksekutif singkat (2-3 paragraf) untuk Kepala Sekolah.
Data: Siswa Aktif: ${stats.totalSiswa}, Mutasi Masuk: ${stats.totalMasuk},
Mutasi Keluar: ${stats.totalKeluar}, Total Prestasi: ${stats.totalPrestasi}.
Berikan narasi analitis dan 1 rekomendasi strategis. Format HTML dasar TANPA markdown blockticks.`;
  return callGemini(
    prompt,
    "Anda adalah konsultan pendidikan dan data analis sekolah dasar.",
  );
}

// ── Draft WA Mutasi ───────────────────────────────────────────
export async function generateDraftWA(data: {
  nama: string;
  type: "masuk" | "keluar";
  sekolah: string;
  alasan: string;
  pengirim: string;
}): Promise<string> {
  const tipe = data.type === "masuk" ? `pindah masuk ke` : `pindah keluar dari`;
  const prompt = `Buatkan pesan WhatsApp resmi dari ${data.pengirim} (${SCHOOL.nama}) kepada wali murid.
Informasikan proses administrasi mutasi siswa "${data.nama}" yang ${tipe} "${data.sekolah}" karena "${data.alasan}" telah selesai.
JANGAN gunakan blockticks markdown, gunakan enter biasa.`;
  return callGemini(
    prompt,
    "Anda adalah staf sekolah yang komunikatif dan ramah.",
  );
}
