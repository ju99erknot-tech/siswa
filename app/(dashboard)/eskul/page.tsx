"use client";

import { useState } from "react";
import { Rocket, Plus, Loader2, Trash2, Music } from "lucide-react";
import { useEskul } from "@/hooks/useEskul";
import { formatTanggal } from "@/lib/utils";
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
import { SCHOOL } from "@/lib/school.config";
import { useAppStore } from "@/store/app.store";

export default function EskulPage() {
  const { dataSiswa } = useAppStore();
  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map((s) => s.kelas)))
    .filter((k): k is string => !!k)
    .sort();
  const { dataEskul, isLoading, addEskul, deleteEskul } = useEskul();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("all");
  const [saving, setSaving] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);

  const [form, setForm] = useState({
    nama: "",
    kelas: "",
    nisn: "",
    nama_eskul: "",
    tanggal_daftar: new Date().toISOString().split("T")[0],
    keterangan: "",
  });

  const filtered = dataEskul.filter((e) => {
    const ms =
      !search ||
      e.nama.toLowerCase().includes(search.toLowerCase()) ||
      e.nama_eskul?.toLowerCase().includes(search.toLowerCase());
    const mk = filterKelas === "all" || e.kelas === filterKelas;
    return ms && mk;
  });

  const eskulList = Array.from(
    new Set(filtered.map((e) => e.nama_eskul).filter(Boolean)),
  );
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!selectedSiswa || !form.nama_eskul) return;
    setSaving(true);
    const ok = await addEskul({
      ...form,
      nama: selectedSiswa.nama,
      kelas: selectedSiswa.kelas || "",
      nisn: selectedSiswa.nisn || "",
    });
    setSaving(false);
    if (ok) {
      setShowForm(false);
      setSelectedSiswa(null);
      setForm({
        nama: "",
        kelas: "",
        nisn: "",
        nama_eskul: "",
        tanggal_daftar: new Date().toISOString().split("T")[0],
        keterangan: "",
      });
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

  const ESKUL_COLORS = [
    "#a78bfa",
    "#22d3ee",
    "#34d399",
    "#fbbf24",
    "#fb7185",
    "#60a5fa",
  ];

  const pag = usePagination(filtered);

  return (
    <PageShell>
      <PageHeader
        icon={<Rocket className="w-6 h-6 text-orange-400" />}
        title="Ekstrakurikuler"
        subtitle={`Data peserta kegiatan ekstrakurikuler ${SCHOOL.nama}`}
        gradient="linear-gradient(135deg, #1a0d00 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(249,115,22,0.25)"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="btn-solid btn-sm flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Peserta
          </button>
        }
      />
      <StatCards
        items={[
          { label: "Total Peserta", value: filtered.length, color: "#fb923c" },
          { label: "Jenis Eskul", value: eskulList.length, color: "#a78bfa" },
          {
            label: "Kelas Aktif",
            value: new Set(filtered.map((e) => e.kelas)).size,
            color: "#22d3ee",
          },
        ]}
      />

      {/* Eskul chips */}
      {eskulList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {eskulList.map((e, i) => (
            <span
              key={e}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
              style={{
                background: `${ESKUL_COLORS[i % ESKUL_COLORS.length]}15`,
                color: ESKUL_COLORS[i % ESKUL_COLORS.length],
                border: `1px solid ${ESKUL_COLORS[i % ESKUL_COLORS.length]}25`,
              }}
            >
              {e} · {filtered.filter((x) => x.nama_eskul === e).length}
            </span>
          ))}
        </div>
      )}

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Cari nama siswa atau eskul..."
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
              "Nama Eskul",
              "Tgl Daftar",
              "Keterangan",
              "Aksi",
            ]}
            loading={isLoading}
            empty={
              filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<Music className="w-7 h-7" />}
                      title="Belum ada data ekstrakurikuler" variant="search"
                    />
                  </td>
                </tr>
              ) : undefined
            }
          >
            {pag.paginated.map((e, i) => {
              const ci = eskulList.indexOf(e.nama_eskul);
              const col = ESKUL_COLORS[ci >= 0 ? ci % ESKUL_COLORS.length : 0];
              return (
                <ATRow key={e.id}>
                  <ATCell className="text-white/25 font-mono text-xs">
                    {(pag.page - 1) * pag.perPage + i + 1}
                  </ATCell>
                  <ATCell className="font-semibold text-white/85">
                    {e.nama}
                  </ATCell>
                  <ATCell>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                      style={{
                        background: "rgba(249,115,22,0.10)",
                        color: "#fb923c",
                      }}
                    >
                      {e.kelas}
                    </span>
                  </ATCell>
                  <ATCell mono className="text-cyan-400 text-xs">
                    {e.nisn || "—"}
                  </ATCell>
                  <ATCell>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: `${col}15`, color: col }}
                    >
                      {e.nama_eskul}
                    </span>
                  </ATCell>
                  <ATCell className="text-white/35 text-xs">
                    {e.tanggal_daftar ? formatTanggal(e.tanggal_daftar) : "—"}
                  </ATCell>
                  <ATCell className="text-white/30 text-xs max-w-[140px] truncate">
                    {e.keterangan || "—"}
                  </ATCell>
                  <ATCell>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus data "${e.nama}"?`))
                          deleteEskul(e.id);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </ATCell>
                </ATRow>
              );
            })}
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
        title="Tambah Peserta Eskul"
        icon={<Rocket className="w-5 h-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <SiswaPicker
            value={selectedSiswa?.id || ""}
            onChange={(s) => setSelectedSiswa(s)}
            label="Siswa"
            required
          />
          <AuroraInput
            label="Nama Eskul *"
            required
            value={form.nama_eskul}
            onChange={(e) => setForm({ ...form, nama_eskul: e.target.value })}
            placeholder="Pramuka, Tari, Futsal, dll."
          />
          <AuroraInput
            label="Tanggal Daftar"
            type="date"
            value={form.tanggal_daftar}
            onChange={(e) =>
              setForm({ ...form, tanggal_daftar: e.target.value })
            }
          />
          <AuroraInput
            label="Keterangan"
            value={form.keterangan}
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
          />
          <button
            type="submit"
            disabled={saving || !selectedSiswa || !form.nama_eskul}
            className="btn-solid btn-block h-11 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            {saving ? "Menyimpan..." : "Simpan Data Eskul"}
          </button>
        </form>
      </AuroraModal>
    </PageShell>
  );
}
