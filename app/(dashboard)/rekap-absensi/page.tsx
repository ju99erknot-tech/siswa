"use client";

import { useState, useMemo } from "react";
import { BarChart3, ChevronDown, Download } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { SCHOOL } from "@/lib/school.config";
import { getFotoPublic } from "@/lib/utils";
import {
  PageShell,
  PageHeader,
  PageCard,
  PageCardHeader,
  AuroraTable,
  ATRow,
  ATCell,
  StatCards,
  usePagination,
  AuroraPagination,
} from "@/components/shared/PageShell";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const getWeekdays = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
};

export default function RekapAbsensiPage() {
  const { dataSiswa } = useAppStore();
  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map((s) => s.kelas)))
    .filter((k): k is string => !!k)
    .sort();
  const [selectedKelas, setSelectedKelas] = useState("all");
  const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth());
  const selectedTahun = new Date().getFullYear();

  // Fetch Absensi data
  const { data: absensiData = [], isLoading } = useQuery({
    queryKey: ["rekap-absensi", selectedBulan, selectedTahun],
    queryFn: async () => {
      const supabase = createClient();
      const startObj = new Date(selectedTahun, selectedBulan, 1);
      const endObj = new Date(selectedTahun, selectedBulan + 1, 0);

      const startStr = `${startObj.getFullYear()}-${String(startObj.getMonth() + 1).padStart(2, "0")}-01`;
      const endStr = `${endObj.getFullYear()}-${String(endObj.getMonth() + 1).padStart(2, "0")}-${String(endObj.getDate()).padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("absensi")
        .select("*")
        .gte("tanggal", startStr)
        .lte("tanggal", endStr);
      if (error) throw error;
      return data || [];
    },
  });

  const rekapData = useMemo(() => {
    const siswaList =
      selectedKelas === "all"
        ? dataSiswa
        : dataSiswa.filter((s) => s.kelas === selectedKelas);
    const schoolDays = getWeekdays(selectedTahun, selectedBulan);

    return siswaList
      .sort((a, b) => a.nama.localeCompare(b.nama))
      .map((s) => {
        const absensiSiswa = absensiData.filter((a) => a.siswa_id === s.id);
        const hadir = absensiSiswa.filter((a) => a.status === "H").length;
        const sakit = absensiSiswa.filter((a) => a.status === "S").length;
        const izin = absensiSiswa.filter((a) => a.status === "I").length;
        const alpha = absensiSiswa.filter((a) => a.status === "A").length;
        const total = hadir + sakit + izin + alpha;

        // Calculate percentage against total recorded days (or at least 1 to avoid division by zero)
        const persen =
          schoolDays > 0 ? Math.round((hadir / schoolDays) * 100) : 0;

        return {
          id: s.id,
          nama: s.nama,
          nisn: s.nisn || "-",
          kelas: s.kelas || "-",
          hadir,
          sakit,
          izin,
          alpha,
          total,
          persen,
        };
      });
  }, [dataSiswa, selectedKelas, absensiData, selectedBulan, selectedTahun]);

  const chartData = useMemo(
    () => [
      {
        name: "Hadir",
        value: rekapData.reduce((s, r) => s + r.hadir, 0),
        fill: "#10b981",
      },
      {
        name: "Sakit",
        value: rekapData.reduce((s, r) => s + r.sakit, 0),
        fill: "#f59e0b",
      },
      {
        name: "Izin",
        value: rekapData.reduce((s, r) => s + r.izin, 0),
        fill: "#60a5fa",
      },
      {
        name: "Alpha",
        value: rekapData.reduce((s, r) => s + r.alpha, 0),
        fill: "#f43f5e",
      },
    ],
    [rekapData],
  );

  const avgPersen =
    rekapData.length > 0
      ? Math.round(
          rekapData.reduce((s, r) => s + r.persen, 0) / rekapData.length,
        )
      : 0;

  const handleExport = () => {
    const rows = rekapData.map((r, i) => ({
      No: i + 1,
      Nama: r.nama,
      NISN: r.nisn,
      Kelas: r.kelas,
      Hadir: r.hadir,
      Sakit: r.sakit,
      Izin: r.izin,
      Alpha: r.alpha,
      Total: r.total,
      "%": `${r.persen}%`,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Rekap ${BULAN[selectedBulan]}`);
    XLSX.writeFile(
      wb,
      `Rekap_Absensi_${BULAN[selectedBulan]}_${selectedTahun}.xlsx`,
    );
    toast.success("Rekap berhasil diunduh");
  };

  const pag = usePagination(rekapData);

  return (
    <PageShell>
      <PageHeader
        icon={<BarChart3 className="w-6 h-6 text-emerald-400" />}
        title="Rekap Absensi"
        subtitle={`${SCHOOL.nama} — ${BULAN[selectedBulan]} ${selectedTahun}`}
        gradient="linear-gradient(135deg, #001a0e 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(16,185,129,0.28)"
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(Number(e.target.value))}
                className="h-9 appearance-none rounded-xl px-3 pr-8 text-[12px] font-semibold text-white/70 outline-none"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {BULAN.map((b, i) => (
                  <option key={b} value={i}>
                    {b}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="h-9 appearance-none rounded-xl px-3 pr-8 text-[12px] font-semibold text-white/70 outline-none"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <option value="all">Semua Kelas</option>
                {KUMPULAN_KELAS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>
            <button
              onClick={handleExport}
              className="h-9 px-4 rounded-xl text-[12px] font-bold flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-all"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor
            </button>
          </div>
        }
      />

      <StatCards
        items={[
          { label: "Siswa", value: rekapData.length, color: "#8b5cf6" },
          {
            label: "Rata-rata Hadir",
            value: `${avgPersen}%`,
            color: "#10b981",
          },
          {
            label: "Total Sakit",
            value: rekapData.reduce((s, r) => s + r.sakit, 0),
            color: "#f59e0b",
          },
          {
            label: "Total Alpha",
            value: rekapData.reduce((s, r) => s + r.alpha, 0),
            color: "#f43f5e",
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <PageCard noPad>
            <PageCardHeader
              title="Rekap per Siswa"
              subtitle="H=Hadir · S=Sakit · I=Izin · A=Alpha"
              icon={<BarChart3 className="w-4 h-4" />}
            />
            <>
              <AuroraTable
                headers={[
                  "No",
                  "Nama",
                  "Kelas",
                  "H",
                  "S",
                  "I",
                  "A",
                  "Kehadiran",
                ]}
                loading={isLoading}
              >
                {pag.paginated.map((r, idx) => (
                  <ATRow key={r.id}>
                    <ATCell>
                      <span className="text-[11px] text-white/20 font-bold">
                        {(pag.page - 1) * pag.perPage + idx + 1}
                      </span>
                    </ATCell>
                    <ATCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          {getFotoPublic(
                            dataSiswa.find((s) => s.id === r.id)?.foto_url,
                          ) ? (
                            <img
                              src={
                                getFotoPublic(
                                  dataSiswa.find((s) => s.id === r.id)
                                    ?.foto_url,
                                )!
                              }
                              alt={r.nama}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-black text-white/20">
                              {r.nama.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-white/70 leading-tight">
                            {r.nama}
                          </p>
                          <p className="text-[9px] text-white/20 font-mono mt-0.5">
                            {r.nisn}
                          </p>
                        </div>
                      </div>
                    </ATCell>
                    <ATCell>
                      <span className="text-[11px] text-white/40">
                        {r.kelas}
                      </span>
                    </ATCell>
                    <ATCell>
                      <span className="text-[12px] font-bold text-emerald-400">
                        {r.hadir}
                      </span>
                    </ATCell>
                    <ATCell>
                      <span className="text-[12px] font-bold text-amber-400">
                        {r.sakit}
                      </span>
                    </ATCell>
                    <ATCell>
                      <span className="text-[12px] font-bold text-blue-400">
                        {r.izin}
                      </span>
                    </ATCell>
                    <ATCell>
                      <span className="text-[12px] font-bold text-red-400">
                        {r.alpha}
                      </span>
                    </ATCell>
                    <ATCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-16 h-2 rounded-full overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${r.persen}%`,
                              background:
                                r.persen >= 90
                                  ? "#10b981"
                                  : r.persen >= 75
                                    ? "#f59e0b"
                                    : "#f43f5e",
                            }}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-black ${r.persen >= 90 ? "text-emerald-400" : r.persen >= 75 ? "text-amber-400" : "text-red-400"}`}
                        >
                          {r.persen}%
                        </span>
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
          </PageCard>
        </div>
        <div className="lg:col-span-4">
          <PageCard>
            <PageCardHeader
              title="Distribusi Status"
              icon={<BarChart3 className="w-4 h-4" />}
            />
            <div className="pt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" barSize={18}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    fontSize={11}
                    tick={{ fill: "rgba(255,255,255,0.35)" }}
                    width={45}
                  />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div
                          className="rounded-xl px-3 py-2 shadow-xl"
                          style={{
                            background: "#0a0e1a",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <p className="text-xs font-bold text-white/80">
                            {payload[0].payload.name}: {payload[0].value}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {chartData.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PageCard>
        </div>
      </div>
    </PageShell>
  );
}
