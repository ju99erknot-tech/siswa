"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Phone,
  X,
  Search,
  UserCheck,
  UserX,
  Camera,
  Key,
  MessageSquare,
  RefreshCw,
  Mail,
  ShieldCheck,
  Clipboard,
  ChevronDown,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useGuru } from "@/hooks/useGuru";
import { getFotoPublic, cn } from "@/lib/utils";
import { useAppStore } from "@/store/app.store";
import { createClient } from "@/lib/supabase/client";
import {
  PageShell,
  PageHeader,
  StatCards,
  PageCard,
  PageCardHeader,
  AuroraTable,
  ATRow,
  ATCell,
  EmptyState,
  usePagination,
  AuroraPagination,
} from "@/components/shared/PageShell";
import { SCHOOL } from "@/lib/school.config";
import type { Guru } from "@/types";

export default function GuruViewClient({ tab }: { tab: string }) {

  const {
    dataGuru,
    isLoading,
    addGuru,
    updateGuru,
    deleteGuru,
    refetch: refetchGuru,
  } = useGuru();
  const { user } = useAppStore();
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<Guru | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form state
  const [formNama, setFormNama] = useState("");
  const [formNip, setFormNip] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formJk, setFormJk] = useState<"L" | "P">("L");
  const [formNoWa, setFormNoWa] = useState("");
  const [formAktif, setFormAktif] = useState(true);
  const [formFotoUrl, setFormFotoUrl] = useState<string | null>(null);
  const [formKategori, setFormKategori] = useState("Pendidik");
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Vault state
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [vaultGuruId, setVaultGuruId] = useState("");
  const [vaultPlatform, setVaultPlatform] = useState("Akun Belajar.id");
  const [vaultCustomPlatform, setVaultCustomPlatform] = useState("");
  const [vaultUsername, setVaultUsername] = useState("");
  const [vaultPassword, setVaultPassword] = useState("");
  const [showOnlyWithAccounts, setShowOnlyWithAccounts] = useState(true);
  const [openPlatformSelect, setOpenPlatformSelect] = useState(false);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [expandedVaultItems, setExpandedVaultItems] = useState<string[]>([]);
  const [confirmDeleteVault, setConfirmDeleteVault] = useState<{
    guruId: string;
    platform: string;
  } | null>(null);

  const toggleExpandCard = (id: string) => {
    setExpandedCards((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleVaultExpand = (id: string) => {
    setExpandedVaultItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const sendWhatsApp = (g: Guru, akun?: any) => {
    let text = `Halo Bpk/Ibu *${g.nama}*,\n`;
    if (akun) {
      text += `Berikut adalah kredensial akun Anda:\n\n`;
      text += `ðŸ”¹ *${akun.platform}*\n`;
      text += `User: ${akun.username}\n`;
      text += `Pass: ${akun.password}\n\n`;
    } else {
      text += `Berikut adalah semua informasi kredensial akun Anda yang tersimpan di sistem:\n\n`;
      g.vault?.forEach((k: any) => {
        text += `ðŸ”¹ *${k.platform}*\n`;
        text += `User: ${k.username}\n`;
        text += `Pass: ${k.password}\n\n`;
      });
    }
    text += `Mohon simpan pesan ini baik-baik. Terima kasih.`;

    let phone = g.no_wa?.replace(/[^0-9]/g, "") || "";
    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
    if (!phone.startsWith("62")) phone = "62" + phone;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const PLATFORM_GROUPS = [
    {
      label: "UTAMA",
      items: ["Akun Belajar.id", "MyASN BKN", "Info GTK", "PMM"],
    },
    {
      label: "KEPENDIDIKAN",
      items: [
        "Dapodik",
        "Sim PKB",
        "Siaga Pendis",
        "Simpatika",
        "NUPTK",
        "SIKAP",
      ],
    },
    {
      label: "ADMINISTRASI & KEUANGAN",
      items: [
        "E-Kinerja BKN",
        "ARKAS",
        "SIP Lah",
        "Pajak (DJP Online)",
        "SIPD",
      ],
    },
    {
      label: "LAYANAN LAIN",
      items: [
        "Canva Education",
        "Microsoft 365",
        "Google Workspace",
        "BPJS Kesehatan",
        "Satusehat",
      ],
    },
  ];

  const filtered = dataGuru.filter((g) => {
    // Tab Filter
    if (tab === "pendidik" && g.kategori !== "Pendidik") return false;
    if (tab === "tendik" && g.kategori !== "Tenaga Kependidikan") return false;

    // Vault Filter
    if (
      tab === "vault" &&
      showOnlyWithAccounts &&
      (!g.vault || g.vault.length === 0)
    )
      return false;

    // Search Filter
    const q = search.toLowerCase();
    if (
      q &&
      !(
        g.nama.toLowerCase().includes(q) ||
        (g.nip && g.nip.includes(q)) ||
        (g.no_wa && g.no_wa.includes(q)) ||
        (tab === "vault" &&
          g.vault?.some(
            (k: any) =>
              k.platform.toLowerCase().includes(q) ||
              k.username.toLowerCase().includes(q),
          ))
      )
    ) {
      return false;
    }
    return true;
  });

  const totalAktif = dataGuru.filter((g) => g.status_aktif).length;
  const totalNonAktif = dataGuru.filter((g) => !g.status_aktif).length;
  const totalLaki = dataGuru.filter((g) => g.jk === "L").length;
  const totalPerempuan = dataGuru.filter((g) => g.jk === "P").length;

  // Tab specific stats
  const currentData = dataGuru.filter((g) => {
    if (tab === "pendidik") return g.kategori === "Pendidik";
    if (tab === "tendik") return g.kategori === "Tenaga Kependidikan";
    return true;
  });
  const currentAktif = currentData.filter((g) => g.status_aktif).length;
  const currentLaki = currentData.filter((g) => g.jk === "L").length;
  const currentPerempuan = currentData.filter((g) => g.jk === "P").length;

  // Vault stats
  const totalAkunTersimpan = dataGuru.reduce(
    (acc, g) => acc + (g.vault?.length || 0),
    0,
  );
  const guruBerakun = dataGuru.filter(
    (g) => g.vault && g.vault.length > 0,
  ).length;
  const totalBelajarId = dataGuru.filter((g) =>
    g.vault?.some((k: any) => k.platform === "Akun Belajar.id"),
  ).length;
  const totalMyASN = dataGuru.filter((g) =>
    g.vault?.some((k: any) => k.platform === "MyASN BKN"),
  ).length;

  const openAdd = () => {
    setEditData(null);
    setFormNama("");
    setFormNip("");
    setFormEmail("");
    setFormJk("L");
    setFormNoWa("");
    setFormAktif(true);
    setFormFotoUrl(null);
    setFormKategori("Pendidik");
    setShowModal(true);
  };

  const openEdit = (g: Guru) => {
    setEditData(g);
    setFormNama(g.nama);
    setFormNip(g.nip || "");
    setFormEmail(g.email || "");
    setFormJk(g.jk);
    setFormNoWa(g.no_wa || "");
    setFormAktif(g.status_aktif);
    setFormFotoUrl(g.foto_url || null);
    setFormKategori(g.kategori || "Pendidik");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formNama.trim() || !formEmail.trim()) {
      toast.error("Nama dan Email wajib diisi");
      return;
    }
    setSaving(true);
    const payload = {
      nama: formNama.trim(),
      nip: formNip.trim() || undefined,
      email: formEmail.trim(),
      jk: formJk,
      no_wa: formNoWa.trim() || undefined,
      status_aktif: formAktif,
      foto_url: formFotoUrl || undefined,
      kategori: formKategori,
    };
    if (editData) {
      await updateGuru(editData.id, payload);
    } else {
      await addGuru(payload as Omit<Guru, "id" | "created_at">);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleSaveVault = async () => {
    if (!vaultGuruId || !vaultUsername) return;
    setSaving(true);
    const platformName =
      vaultPlatform === "Lainnya"
        ? vaultCustomPlatform || "Lainnya"
        : vaultPlatform;
    const supabase = createClient();

    try {
      const guruTarget = dataGuru.find((g) => g.id === vaultGuruId);
      if (guruTarget) {
        const existingVault = guruTarget.vault || [];
        const existingAcc = existingVault.find(
          (k: any) => k.platform === platformName,
        );

        if (existingAcc) {
          // Update existing
          const { error } = await supabase
            .from("vault_guru")
            .update({ username: vaultUsername, password: vaultPassword })
            .eq("id", existingAcc.id);
          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase.from("vault_guru").insert({
            guru_id: vaultGuruId,
            platform: platformName,
            username: vaultUsername,
            password: vaultPassword,
          });
          if (error) throw error;
        }
        toast.success("Akun berhasil diperbarui di Brankas!");
        void refetchGuru();
      }
    } catch (err: any) {
      toast.error("Gagal: " + err.message);
    } finally {
      setSaving(false);
      setShowVaultModal(false);
      setVaultCustomPlatform("");
    }
  };

  const removeVaultAccount = async (guruId: string, platform: string) => {
    const guruTarget = dataGuru.find((g) => g.id === guruId);
    if (guruTarget) {
      const acc = guruTarget.vault?.find((k: any) => k.platform === platform);
      if (acc) {
        const supabase = createClient();
        const { error } = await supabase
          .from("vault_guru")
          .delete()
          .eq("id", acc.id);
        if (error) {
          toast.error("Gagal menghapus: " + error.message);
        } else {
          toast.success("Akun berhasil dihapus dari Brankas");
          void refetchGuru();
        }
      }
    }
  };

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
      const fileExt = file.name.split(".").pop();
      const fileName = `guru_${Date.now()}.${fileExt}`;
      const filePath = `guru/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setFormFotoUrl(publicUrl);
      toast.success("Foto berhasil diunggah");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mengunggah foto");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteGuru(id);
    setConfirmDelete(null);
  };

  const pag = usePagination(filtered);

  return (
    <PageShell>
      <PageHeader
        icon={<Users className="w-6 h-6 text-emerald-400" />}
        title={
          tab === "tendik"
            ? "Tenaga Kependidikan"
            : tab === "vault"
              ? "Vault Akun Guru"
              : "Data Pendidik (Guru)"
        }
        subtitle={`${SCHOOL.nama} — ${tab === "vault" ? "Kelola Kredensial Akun" : "Kelola data GTK"}`}
        gradient="linear-gradient(135deg, #051a1a 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(16,185,129,0.28)"
        action={
          isAdmin ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (tab === "vault") {
                    setVaultGuruId(dataGuru[0]?.id || "");
                    setVaultPlatform("Akun Belajar.id");
                    setVaultUsername("");
                    setVaultPassword("");
                    setShowVaultModal(true);
                  } else {
                    openAdd();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  boxShadow: "0 0 20px rgba(124,58,237,0.3)",
                }}
              >
                <Plus size={16} />{" "}
                {tab === "vault" ? "Tambah Akun" : "Tambah Guru"}
              </button>
            </div>
          ) : undefined
        }
      />

      <StatCards
        items={
          tab === "vault"
            ? [
                {
                  label: "Total Akun",
                  value: totalAkunTersimpan,
                  color: "#8b5cf6",
                  icon: <Key className="w-5 h-5 text-violet-400" />,
                },
                {
                  label: "Guru Berakun",
                  value: guruBerakun,
                  color: "#10b981",
                  icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
                },
                {
                  label: "Belajar.id",
                  value: totalBelajarId,
                  color: "#3b82f6",
                  icon: <Mail className="w-5 h-5 text-blue-400" />,
                },
                {
                  label: "MyASN BKN",
                  value: totalMyASN,
                  color: "#f59e0b",
                  icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
                },
              ]
            : [
                {
                  label: tab === "tendik" ? "Total Tendik" : "Total Pendidik",
                  value: currentData.length,
                  color: "#8b5cf6",
                  icon: <Users className="w-5 h-5 text-violet-400" />,
                },
                {
                  label: "Status Aktif",
                  value: currentAktif,
                  color: "#10b981",
                  icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
                },
                {
                  label: "Laki-laki",
                  value: currentLaki,
                  color: "#3b82f6",
                  icon: <Users className="w-5 h-5 text-blue-400" />,
                },
                {
                  label: "Perempuan",
                  value: currentPerempuan,
                  color: "#ec4899",
                  icon: <Users className="w-5 h-5 text-pink-400" />,
                },
              ]
        }
      />

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            placeholder={
              tab === "vault"
                ? "Cari nama guru atau platform akun..."
                : "Cari nama, NIP, atau No. WA..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl text-sm text-white/80 placeholder-white/20 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
        </div>
        {tab === "vault" && (
          <button
            onClick={() => setShowOnlyWithAccounts(!showOnlyWithAccounts)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
            style={{
              background: showOnlyWithAccounts
                ? "rgba(139,92,246,0.1)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${showOnlyWithAccounts ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.06)"}`,
              color: showOnlyWithAccounts ? "#a78bfa" : "rgba(255,255,255,0.4)",
            }}
          >
            {showOnlyWithAccounts ? (
              <ShieldCheck size={14} />
            ) : (
              <Users size={14} />
            )}
            {showOnlyWithAccounts ? "Hanya Guru Berakun" : "Semua Guru"}
          </button>
        )}
      </div>

      {/* Table / Cards */}
      {tab === "vault" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={<Key size={40} className="text-violet-500" />}
                  title={
                    showOnlyWithAccounts
                      ? "Belum Ada Akun Vault"
                      : "Guru Tidak Ditemukan"
                  }
                  subtitle={
                    showOnlyWithAccounts
                      ? "Gunakan fitur Sinkron Otomatis atau tambah akun manual untuk memulai"
                      : "Coba ubah kata kunci pencarian Anda"
                  }
                  variant="search"
                />
              </div>
            ) : (
              filtered.map((g) => {
                const isCardExpanded = expandedCards.includes(g.id);
                return (
                  <motion.div
                    layout
                    key={g.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative overflow-hidden rounded-2xl transition-all hover:translate-y-[-4px]"
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
                    }}
                  >
                    {/* Card Header - Always Visible */}
                    <button
                      onClick={() => toggleExpandCard(g.id)}
                      className="w-full p-5 text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                            {getFotoPublic(g.foto_url) ? (
                              <img
                                src={getFotoPublic(g.foto_url)!}
                                alt={g.nama}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
                                {g.nama.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white/90 truncate">
                              {g.nama}
                            </h4>
                            <p className="text-[10px] text-white/30 font-mono truncate">
                              {g.nip || "NIP -"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            <span className="text-[11px] font-black text-violet-400">
                              {g.vault?.length || 0}
                            </span>
                            <span className="text-[9px] text-white/20">
                              Akun
                            </span>
                          </div>
                          <ChevronDown
                            size={20}
                            className={cn(
                              "text-white/20 transition-transform duration-300",
                              isCardExpanded && "rotate-180 text-violet-400",
                            )}
                          />
                        </div>
                      </div>

                      {/* Quick Preview of Platforms */}
                      {g.vault && g.vault.length > 0 && (
                        <div className="mt-3 flex gap-1.5 flex-wrap">
                          {g.vault.slice(0, 3).map((k: any) => (
                            <span
                              key={k.id}
                              className="px-2 py-1 rounded-md text-[9px] font-bold"
                              style={{
                                background: k.platform.includes("Belajar")
                                  ? "rgba(16,185,129,0.15)"
                                  : k.platform.includes("MyASN")
                                    ? "rgba(59,130,246,0.15)"
                                    : "rgba(139,92,246,0.15)",
                                color: k.platform.includes("Belajar")
                                  ? "#34d399"
                                  : k.platform.includes("MyASN")
                                    ? "#93c5fd"
                                    : "#a78bfa",
                                border: `1px solid ${
                                  k.platform.includes("Belajar")
                                    ? "rgba(16,185,129,0.25)"
                                    : k.platform.includes("MyASN")
                                      ? "rgba(59,130,246,0.25)"
                                      : "rgba(139,92,246,0.25)"
                                }`,
                              }}
                            >
                              {k.platform.split(" ")[0]}
                            </span>
                          ))}
                          {g.vault.length > 3 && (
                            <span className="px-2 py-1 rounded-md text-[9px] font-bold text-white/30 bg-white/05 border border-white/10">
                              +{g.vault.length - 3} lagi
                            </span>
                          )}
                        </div>
                      )}
                    </button>

                    {/* Expandable Content */}
                    <AnimatePresence>
                      {isCardExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-0 space-y-3 border-t border-white/5">
                            <div className="flex items-center justify-between pt-3">
                              <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">
                                Detail Akun
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVaultGuruId(g.id);
                                    setShowVaultModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-violet-400 hover:bg-violet-400/10 transition-all"
                                  title="Kelola Akun"
                                >
                                  <Key size={14} />
                                </button>
                                {!!g.no_wa &&
                                  !!g.vault &&
                                  g.vault.length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        sendWhatsApp(g);
                                      }}
                                      className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
                                      title="Kirim Semua via WA"
                                    >
                                      <MessageSquare size={14} />
                                    </button>
                                  )}
                              </div>
                            </div>

                            {!!g.vault && g.vault.length > 0 ? (
                              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scroll">
                                {g.vault.map((k: any) => (
                                  <div
                                    key={k.id}
                                    className="p-3 rounded-xl bg-black/20 border border-white/5 group/item transition-all hover:bg-black/30 overflow-hidden"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div
                                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                          style={{
                                            background: k.platform.includes(
                                              "Belajar",
                                            )
                                              ? "rgba(16, 185, 129, 0.1)"
                                              : k.platform.includes("MyASN")
                                                ? "rgba(59, 130, 246, 0.1)"
                                                : "rgba(139, 92, 246, 0.1)",
                                          }}
                                        >
                                          {k.platform.includes("Belajar") ? (
                                            <Mail
                                              size={16}
                                              className="text-emerald-400"
                                            />
                                          ) : k.platform.includes("MyASN") ? (
                                            <ShieldCheck
                                              size={16}
                                              className="text-blue-400"
                                            />
                                          ) : (
                                            <Key
                                              size={16}
                                              className="text-violet-400"
                                            />
                                          )}
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                          <span className="text-[11px] font-bold text-white/80 truncate">
                                            {k.platform}
                                          </span>
                                          <span className="text-[10px] text-white/40 font-mono truncate">
                                            {k.username}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-all">
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(
                                              k.password,
                                            );
                                            toast.success(
                                              `Password ${k.platform} disalin`,
                                            );
                                          }}
                                          className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-yellow-400 hover:bg-yellow-400/10"
                                          title="Salin Password"
                                        >
                                          <Eye size={12} />
                                        </button>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(
                                              k.username,
                                            );
                                            toast.success(
                                              `Username ${k.platform} disalin`,
                                            );
                                          }}
                                          className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-cyan-400 hover:bg-cyan-400/10"
                                          title="Salin Username"
                                        >
                                          <Clipboard size={12} />
                                        </button>
                                        {g.no_wa && (
                                          <button
                                            onClick={() => sendWhatsApp(g, k)}
                                            className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-emerald-400 hover:bg-emerald-400/10"
                                            title="Kirim via WA"
                                          >
                                            <MessageSquare size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-6 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                                <Key size={24} className="text-white/10 mb-2" />
                                <p className="text-[10px] text-white/20 font-medium italic">
                                  Belum ada akun di brankas
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      ) : (
        <PageCard noPad>
          <PageCardHeader
            title="Daftar Guru & Tendik"
            subtitle={`Menampilkan ${filtered.length} dari ${dataGuru.length} data`}
            icon={<Users className="w-4 h-4" />}
          />

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users size={40} />}
              title="Belum Ada Data Guru" variant="search"
              subtitle="Tambahkan data guru dan tenaga kependidikan sekolah Anda"
            />
          ) : (
            <>
              <AuroraTable
                headers={[
                  "No",
                  "Nama",
                  "NIP",
                  "JK",
                  "No. WA",
                  "Status",
                  "Aksi",
                ]}
              >
                {pag.paginated.map((g, i) => (
                  <ATRow key={g.id}>
                    <ATCell className="text-white/20 font-mono text-xs">
                      {(pag.page - 1) * pag.perPage + i + 1}
                    </ATCell>
                    <ATCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                          style={{
                            background: g.status_aktif
                              ? "rgba(16,185,129,0.1)"
                              : "rgba(239,68,68,0.1)",
                            border: `1px solid ${g.status_aktif ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                          }}
                        >
                          {getFotoPublic(g.foto_url) ? (
                            <img
                              src={getFotoPublic(g.foto_url)!}
                              alt={g.nama}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span
                              className="text-[10px] font-black"
                              style={{
                                color: g.status_aktif ? "#34d399" : "#f87171",
                              }}
                            >
                              {g.nama.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-white/80">
                          {g.nama}
                        </span>
                      </div>
                    </ATCell>
                    <ATCell className="text-cyan-400/60 font-mono text-xs">
                      {g.nip || "-"}
                    </ATCell>
                    <ATCell className="text-white/40 text-xs">{g.jk}</ATCell>
                    <ATCell>
                      {g.no_wa ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400/60">
                          <Phone size={10} /> {g.no_wa}
                        </span>
                      ) : (
                        <span className="text-white/15 text-xs">-</span>
                      )}
                    </ATCell>
                    <ATCell>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          g.status_aktif
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {g.status_aktif ? "Aktif" : "Non-Aktif"}
                      </span>
                    </ATCell>
                    <ATCell>
                      <div className="flex gap-1">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEdit(g)}
                              className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-cyan-400 transition-all"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(g.id)}
                              className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-red-400 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </ATCell>
                  </ATRow>
                ))}
              </AuroraTable>
              <AuroraPagination
                currentPage={pag.page}
                totalItems={pag.totalItems}
                perPage={pag.perPage}
                onPageChange={pag.setPage}
                onPerPageChange={pag.setPerPage}
              />
            </>
          )}
        </PageCard>
      )}

      {/* â”€â”€ Modal Add/Edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(8,9,13,0.85)",
              backdropFilter: "blur(12px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl p-6 space-y-5"
              style={{
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-white">
                  {editData ? "Edit Guru" : "Tambah Guru Baru"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/30 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Photo Upload Section */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500/30">
                    {formFotoUrl ? (
                      <img
                        src={formFotoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-white/10" />
                    )}

                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                      </div>
                    )}

                    <button
                      onClick={() =>
                        document.getElementById("guru-photo-upload")?.click()
                      }
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <input
                    type="file"
                    id="guru-photo-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                  />
                  {!formFotoUrl && (
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-2">
                      Upload Foto
                    </p>
                  )}
                  {formFotoUrl && (
                    <button
                      onClick={() => setFormFotoUrl(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 transition-all hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                    Nama Lengkap *
                  </label>
                  <input
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    placeholder="Nama guru..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                    NIP
                  </label>
                  <input
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    placeholder="NIP (opsional)..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                    Email (Untuk Login) *
                  </label>
                  <input
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    type="email"
                    className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none disabled:opacity-50"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    placeholder="Email aktif guru..."
                    disabled={!!editData && !!editData.email}
                  />
                  {!!editData && !!editData.email && (
                    <p className="text-[9px] text-white/30 italic">
                      Email tidak dapat diubah setelah dibuat.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                      Kategori
                    </label>
                    <select
                      value={formKategori}
                      onChange={(e) => setFormKategori(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none appearance-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <option value="Pendidik">Pendidik (Guru)</option>
                      <option value="Tenaga Kependidikan">
                        Tenaga Kependidikan
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                      Status
                    </label>
                    <select
                      value={formAktif ? "aktif" : "nonaktif"}
                      onChange={(e) => setFormAktif(e.target.value === "aktif")}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none appearance-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Non-Aktif</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                      Jenis Kelamin
                    </label>
                    <select
                      value={formJk}
                      onChange={(e) => setFormJk(e.target.value as "L" | "P")}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none appearance-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                      No. WhatsApp
                    </label>
                    <input
                      value={formNoWa}
                      onChange={(e) => setFormNoWa(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/50 transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formNama.trim() || !formEmail.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                    boxShadow: "0 0 16px rgba(16,185,129,0.25)",
                  }}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : editData ? (
                    "Simpan Perubahan"
                  ) : (
                    "Tambah Guru & Akun"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€ Vault Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {showVaultModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(8,9,13,0.85)",
              backdropFilter: "blur(12px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowVaultModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-5"
              style={{
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Key size={18} className="text-violet-400" /> Vault Akun Guru
                </h3>
                <button
                  onClick={() => setShowVaultModal(false)}
                  className="text-white/30 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                    Pilih Guru / PTK
                  </label>
                  <select
                    value={vaultGuruId}
                    onChange={(e) => {
                      setVaultGuruId(e.target.value);
                      setVaultUsername("");
                      setVaultPassword("");
                    }}
                    className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none appearance-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {dataGuru.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Akun Tersimpan (Sederhana) */}
                {(() => {
                  const selectedGuru = dataGuru.find(
                    (g) => g.id === vaultGuruId,
                  );
                  if (
                    !vaultGuruId ||
                    !selectedGuru?.vault ||
                    selectedGuru.vault.length === 0
                  )
                    return null;

                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                          Akun Tersimpan
                        </label>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scroll">
                        {selectedGuru.vault.map((k: any) => (
                          <div
                            key={k.id}
                            className="p-3.5 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between gap-2 overflow-hidden"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: k.platform.includes("Belajar")
                                    ? "rgba(16, 185, 129, 0.1)"
                                    : k.platform.includes("MyASN")
                                      ? "rgba(59, 130, 246, 0.1)"
                                      : "rgba(139, 92, 246, 0.1)",
                                }}
                              >
                                {k.platform.includes("Belajar") ? (
                                  <Mail
                                    size={14}
                                    className="text-emerald-400"
                                  />
                                ) : k.platform.includes("MyASN") ? (
                                  <ShieldCheck
                                    size={14}
                                    className="text-blue-400"
                                  />
                                ) : (
                                  <Key size={14} className="text-violet-400" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[11px] font-bold text-white/80 truncate">
                                  {k.platform}
                                </span>
                                <span className="text-[10px] text-white/40 truncate">
                                  {k.username}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setVaultPlatform(k.platform);
                                  setVaultUsername(k.username);
                                  setVaultPassword(k.password);
                                }}
                                className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() =>
                                  setConfirmDeleteVault({
                                    guruId: vaultGuruId,
                                    platform: k.platform,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="h-px bg-white/5 my-2" />

                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                    Platform / Aplikasi
                  </label>

                  {/* Custom Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenPlatformSelect(!openPlatformSelect)}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 flex items-center justify-between transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <span>{vaultPlatform}</span>
                      <ChevronDown
                        size={16}
                        className={cn(
                          "transition-transform opacity-30",
                          openPlatformSelect && "rotate-180",
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {openPlatformSelect && (
                        <>
                          <div
                            className="fixed inset-0 z-[60]"
                            onClick={() => setOpenPlatformSelect(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute left-0 right-0 top-12 z-[70] max-h-60 overflow-y-auto rounded-xl p-2 custom-scroll"
                            style={{
                              background: "#0d1117",
                              border: "1px solid rgba(255,255,255,0.1)",
                              boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
                            }}
                          >
                            {PLATFORM_GROUPS.map((group) => (
                              <div key={group.label} className="mb-2 last:mb-0">
                                <div className="px-2 py-1 text-[9px] font-black text-white/20 uppercase tracking-widest border-b border-white/5 mb-1">
                                  {group.label}
                                </div>
                                <div className="space-y-0.5">
                                  {group.items.map((item) => (
                                    <button
                                      key={item}
                                      type="button"
                                      onClick={() => {
                                        setVaultPlatform(item);
                                        setOpenPlatformSelect(false);
                                      }}
                                      className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg text-xs transition-all",
                                        vaultPlatform === item
                                          ? "bg-violet-500/20 text-violet-400 font-bold"
                                          : "text-white/60 hover:bg-white/5 hover:text-white",
                                      )}
                                    >
                                      {item}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <div className="h-px bg-white/5 my-1" />
                            <button
                              type="button"
                              onClick={() => {
                                setVaultPlatform("Lainnya");
                                setOpenPlatformSelect(false);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-xs transition-all",
                                vaultPlatform === "Lainnya"
                                  ? "bg-violet-500/20 text-violet-400 font-bold"
                                  : "text-white/60 hover:bg-white/5 hover:text-white",
                              )}
                            >
                              Lainnya...
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {vaultPlatform === "Lainnya" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                      Nama Platform Kustom
                    </label>
                    <input
                      value={vaultCustomPlatform}
                      onChange={(e) => setVaultCustomPlatform(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                      placeholder="Masukkan nama aplikasi..."
                    />
                  </motion.div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                    Username / Email
                  </label>
                  <div className="relative">
                    <input
                      value={vaultUsername}
                      onChange={(e) => setVaultUsername(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                      placeholder="Contoh: budi12@guru.sd..."
                    />
                    {vaultUsername && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(vaultUsername);
                          toast.success("Username disalin");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/20 hover:text-white"
                      >
                        <Clipboard size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      value={vaultPassword}
                      onChange={(e) => setVaultPassword(e.target.value)}
                      type="text"
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                      placeholder="Contoh: Merdeka123!"
                    />
                    {vaultPassword && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(vaultPassword);
                          toast.success("Password disalin");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/20 hover:text-white"
                      >
                        <Clipboard size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowVaultModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/50 transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveVault}
                  disabled={saving || !vaultUsername || !vaultGuruId}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                    boxShadow: "0 0 16px rgba(139,92,246,0.25)",
                  }}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Simpan Kredensial"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€ Confirm Delete Modal (Guru) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(8,9,13,0.85)",
              backdropFilter: "blur(12px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmDelete(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3 className="text-lg font-bold text-white">Hapus Data Guru?</h3>
              <p className="text-sm text-white/40">
                Data yang dihapus tidak bisa dikembalikan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/50"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-all"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€ Confirm Delete Modal (Vault) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {confirmDeleteVault && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(8,9,13,0.85)",
              backdropFilter: "blur(12px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmDeleteVault(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3 className="text-lg font-bold text-white">Hapus Akun Ini?</h3>
              <p className="text-sm text-white/40">
                Anda akan menghapus akun{" "}
                <span className="text-violet-400 font-bold">
                  {confirmDeleteVault.platform}
                </span>
                . Data tidak bisa dikembalikan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteVault(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/50"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    removeVaultAccount(
                      confirmDeleteVault.guruId,
                      confirmDeleteVault.platform,
                    );
                    setConfirmDeleteVault(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-all"
                >
                  Hapus Akun
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
