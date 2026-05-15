"use client";

import { useState } from "react";
import { Coins, Plus, Loader2, Trash2, Wallet, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useSiswa } from "@/hooks/useSiswa";
import {
  PageShell,
  PageHeader,
  StatCards,
  PageCard,
  AuroraTable,
  ATRow,
  ATCell,
  SearchBar,
  AuroraModal,
  AuroraInput,
  AuroraSelect,
  EmptyState,
  usePagination,
  AuroraPagination,
} from "@/components/shared/PageShell";
import { SiswaPicker } from "@/components/shared/SiswaPicker";
import type { Siswa } from "@/types";
import { useAppStore } from "@/store/app.store";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Layak: { bg: "rgba(52,211,153,0.12)", color: "#34d399" },
  "Sudah Cair": { bg: "rgba(96,165,250,0.12)", color: "#60a5fa" },
  "Belum Cair": { bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
  "Tidak Layak": { bg: "rgba(148,163,184,0.10)", color: "#94a3b8" },
};

export default function PIPPage() {
  const { data: dataSiswa, updateSiswa, isLoading } = useSiswa();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("all");
  const [filterLayak, setFilterLayak] = useState("all");
  const [saving, setSaving] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);

  const [form, setForm] = useState({
    penerima_kip: "Tidak",
    no_kip: "",
    layak_pip: "Tidak",
    alasan_pip: "",
    penerima_kps: "Tidak",
    no_kps: "",
  });

  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map((s) => s.kelas)))
    .filter((k): k is string => !!k)
    .sort();

  const filtered = dataSiswa.filter((s) => {
    const ms =
      !search ||
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nisn?.includes(search);
    const mk = filterKelas === "all" || s.kelas === filterKelas;
    const ml = filterLayak === "all" || s.layak_pip === filterLayak;
    return ms && mk && ml;
  });

  const totalKIP = filtered.filter((s) => s.penerima_kip === "Ya").length;

  const handleEdit = (s: Siswa) => {
    setEditingSiswa(s);
    setForm({
      penerima_kip: s.penerima_kip || "Tidak",
      no_kip: s.no_kip || "",
      layak_pip: s.layak_pip || "Tidak",
      alasan_pip: s.alasan_pip || "",
      penerima_kps: s.penerima_kps || "Tidak",
      no_kps: s.no_kps || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;
    setSaving(true);
    const ok = await updateSiswa(editingSiswa.id, form);
    setSaving(false);
    if (ok) {
      setShowForm(false);
      setEditingSiswa(null);
    }
  };

  const selectStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.75)",
    appearance: "none" as const,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='rgba(255,255,255,0.35)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 12px center",
    paddingRight: "36px",
  };

  const pag = usePagination(filtered);

  return (
    <PageShell>
      <PageHeader
        icon={<Coins className="w-6 h-6 text-yellow-400" />}
        title="Bantuan PIP"
        subtitle="Program Indonesia Pintar — Data penerima bantuan siswa"
        gradient="linear-gradient(135deg, #1a1400 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(234,179,8,0.25)"
        action={
          <button
            onClick={() => toast.info("Fitur sinkronisasi sedang dikembangkan")}
            className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
          >
            <Wallet className="w-3 h-3 text-yellow-400" /> Sinkron Data
            Kesejahteraan
          </button>
        }
      />
      <StatCards
        items={[
          { label: "Total Siswa", value: filtered.length, color: "#94a3b8" },
          {
            label: "Layak PIP",
            value: filtered.filter((s) => s.layak_pip === "Ya").length,
            color: "#fbbf24",
          },
          { label: "Penerima KIP", value: totalKIP, color: "#34d399" },
          {
            label: "Penerima KPS",
            value: filtered.filter((s) => s.penerima_kps === "Ya").length,
            color: "#60a5fa",
          },
        ]}
      />
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Cari nama atau NISN..."
        right={
          <div className="flex gap-2">
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="h-10 px-4 rounded-xl text-sm outline-none min-w-[130px]"
              style={selectStyle}
            >
              <option value="all">Semua Kelas</option>
              {KUMPULAN_KELAS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <select
              value={filterLayak}
              onChange={(e) => setFilterLayak(e.target.value)}
              className="h-10 px-4 rounded-xl text-sm outline-none min-w-[130px]"
              style={selectStyle}
            >
              <option value="all">Semua Status</option>
              <option value="Ya">Layak PIP</option>
              <option value="Tidak">Tidak Layak</option>
            </select>
          </div>
        }
      />
      <PageCard noPad>
        <>
          <AuroraTable
            headers={[
              "No",
              "Nama Siswa",
              "Kelas",
              "NISN",
              "KIP",
              "Layak PIP",
              "Alasan",
              "Aksi",
            ]}
            loading={isLoading}
            empty={
              filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<Wallet className="w-7 h-7" />}
                      title="Tidak ada data siswa" variant="search"
                    />
                  </td>
                </tr>
              ) : undefined
            }
          >
            {pag.paginated.map((s, i) => (
              <ATRow key={s.id}>
                <ATCell className="text-white/25 font-mono text-xs">
                  {(pag.page - 1) * pag.perPage + i + 1}
                </ATCell>
                <ATCell className="font-semibold text-white/85">
                  {s.nama}
                </ATCell>
                <ATCell>
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={{
                      background: "rgba(52,211,153,0.10)",
                      color: "#34d399",
                    }}
                  >
                    {s.kelas}
                  </span>
                </ATCell>
                <ATCell mono className="text-cyan-400 text-xs">
                  {s.nisn || "—"}
                </ATCell>
                <ATCell>
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={
                      STATUS_STYLE[
                        s.penerima_kip === "Ya" ? "Sudah Cair" : "Tidak Layak"
                      ]
                    }
                  >
                    {s.penerima_kip === "Ya" ? "Penerima KIP" : "Bukan"}
                  </span>
                </ATCell>
                <ATCell>
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={
                      STATUS_STYLE[
                        s.layak_pip === "Ya" ? "Layak" : "Tidak Layak"
                      ]
                    }
                  >
                    {s.layak_pip === "Ya" ? "Layak PIP" : "Tidak Layak"}
                  </span>
                </ATCell>
                <ATCell className="text-white/30 text-xs max-w-[150px] truncate">
                  {s.alasan_pip || "—"}
                </ATCell>
                <ATCell>
                  <button
                    onClick={() => handleEdit(s)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-yellow-400/50 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
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
      </PageCard>
      <AuroraModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Manajemen Kesejahteraan Siswa (PIP)"
        icon={<Wallet className="w-5 h-5 text-yellow-400" />}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">
              Siswa
            </p>
            <p className="text-sm font-bold text-white">{editingSiswa?.nama}</p>
            <p className="text-[10px] text-white/40">
              {editingSiswa?.kelas} — {editingSiswa?.nisn}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <AuroraSelect
                label="Penerima KIP"
                value={form.penerima_kip}
                onChange={(e) =>
                  setForm({ ...form, penerima_kip: e.target.value })
                }
              >
                <option value="Tidak">Tidak</option>
                <option value="Ya">Ya</option>
              </AuroraSelect>
              {form.penerima_kip === "Ya" && (
                <AuroraInput
                  label="No KIP"
                  value={form.no_kip}
                  onChange={(e) => setForm({ ...form, no_kip: e.target.value })}
                />
              )}
            </div>

            <div className="space-y-4">
              <AuroraSelect
                label="Layak PIP"
                value={form.layak_pip}
                onChange={(e) =>
                  setForm({ ...form, layak_pip: e.target.value })
                }
              >
                <option value="Tidak">Tidak</option>
                <option value="Ya">Ya</option>
              </AuroraSelect>
              <AuroraInput
                label="Alasan Layak PIP"
                value={form.alasan_pip}
                onChange={(e) =>
                  setForm({ ...form, alasan_pip: e.target.value })
                }
                placeholder="Cth: Pemegang KIP / Miskin"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AuroraSelect
              label="Penerima KPS"
              value={form.penerima_kps}
              onChange={(e) =>
                setForm({ ...form, penerima_kps: e.target.value })
              }
            >
              <option value="Tidak">Tidak</option>
              <option value="Ya">Ya</option>
            </AuroraSelect>
            {form.penerima_kps === "Ya" && (
              <AuroraInput
                label="No KPS"
                value={form.no_kps}
                onChange={(e) => setForm({ ...form, no_kps: e.target.value })}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-solid btn-block h-12 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 border-none"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Wallet className="w-5 h-5" />
            )}
            Simpan Data Kesejahteraan
          </button>
        </form>
      </AuroraModal>
    </PageShell>
  );
}
