"use client";

import { useState } from "react";
import { Plus, Loader2, Heart, Pencil } from "lucide-react";
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
  EmptyState,
  usePagination,
  AuroraPagination,
} from "@/components/shared/PageShell";
import type { Siswa } from "@/types";
import { SCHOOL } from "@/lib/school.config";

export default function UKSPage() {
  const { data: dataSiswa, updateSiswa, isLoading } = useSiswa();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("all");
  const [saving, setSaving] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);

  const [form, setForm] = useState({
    tinggi_badan: "",
    berat_badan: "",
    lingkar_kepala: "",
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
    return ms && mk;
  });

  const handleEdit = (s: Siswa) => {
    setEditingSiswa(s);
    setForm({
      tinggi_badan: s.tinggi_badan || "",
      berat_badan: s.berat_badan || "",
      lingkar_kepala: s.lingkar_kepala || "",
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
        icon={<Heart className="w-6 h-6 text-rose-400" />}
        title="Layanan UKS"
        subtitle={`Manajemen kesehatan siswa terintegrasi Buku Induk ${SCHOOL.nama}`}
        gradient="linear-gradient(135deg, #012418 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(244,63,94,0.2)"
        action={
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <Heart className="w-3 h-3 text-rose-400 animate-pulse" /> Sinkron
            Buku Induk Aktif
          </div>
        }
      />
      <StatCards
        items={[
          { label: "Total Siswa", value: filtered.length, color: "#34d399" },
          {
            label: "Data Lengkap",
            value: filtered.filter((s) => s.tinggi_badan && s.berat_badan)
              .length,
            color: "#22d3ee",
          },
          {
            label: "Belum Terisi",
            value: filtered.filter((s) => !s.tinggi_badan || !s.berat_badan)
              .length,
            color: "#f43f5e",
          },
        ]}
      />
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Cari nama atau NISN siswa..."
        right={
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="h-10 px-4 rounded-xl text-sm outline-none min-w-[140px]"
            style={selectStyle}
          >
            <option value="all">Semua Kelas</option>
            {KUMPULAN_KELAS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
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
              "Tinggi (cm)",
              "Berat (kg)",
              "Lingkar Kepala",
              "Aksi",
            ]}
            loading={isLoading}
            empty={
              filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<Heart className="w-7 h-7" />}
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
                <ATCell className="text-white/55 text-center font-bold">
                  {s.tinggi_badan || "—"}
                </ATCell>
                <ATCell className="text-white/55 text-center font-bold">
                  {s.berat_badan || "—"}
                </ATCell>
                <ATCell className="text-white/40 text-xs font-mono">
                  {s.lingkar_kepala || "—"} cm
                </ATCell>
                <ATCell>
                  <button
                    onClick={() => handleEdit(s)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
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
        title="Update Data Kesehatan"
        icon={<Heart className="w-5 h-5 text-rose-400" />}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AuroraInput
              label="Tinggi (cm)"
              type="number"
              value={form.tinggi_badan}
              onChange={(e) =>
                setForm({ ...form, tinggi_badan: e.target.value })
              }
              placeholder="120"
            />
            <AuroraInput
              label="Berat (kg)"
              type="number"
              value={form.berat_badan}
              onChange={(e) =>
                setForm({ ...form, berat_badan: e.target.value })
              }
              placeholder="30"
            />
            <AuroraInput
              label="Lingkar Kepala (cm)"
              type="number"
              value={form.lingkar_kepala}
              onChange={(e) =>
                setForm({ ...form, lingkar_kepala: e.target.value })
              }
              placeholder="50"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-solid btn-block h-12 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Simpan Perubahan
          </button>
        </form>
      </AuroraModal>
    </PageShell>
  );
}
