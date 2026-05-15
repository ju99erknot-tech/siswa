"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useSiswa } from "@/hooks/useSiswa";

const COLORS_PIE = ["#3b82f6", "#ec4899"];

// Defined outside the component to prevent Recharts from remounting on every re-render
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="card-obsidian border border-white/[0.04] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs font-bold text-white mb-1">Kelas {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-[11px]" style={{ color: p.color }}>
          {p.dataKey === "L" ? "♂ Laki-laki" : "♀ Perempuan"}:{" "}
          <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function SiswaChart() {
  const { data: dataSiswa } = useSiswa();

  // Data per kelas
  const perKelas = useMemo(() => {
    const listKelas = Array.from(new Set(dataSiswa.map((s) => s.kelas)))
      .filter(Boolean)
      .sort();
    return listKelas
      .map((k) => {
        const siswaKelas = dataSiswa.filter((s) => s.kelas === k);
        return {
          kelas: k,
          total: siswaKelas.length,
          L: siswaKelas.filter((s) => s.jk === "L").length,
          P: siswaKelas.filter((s) => s.jk === "P").length,
        };
      })
      .filter((d) => d.total > 0);
  }, [dataSiswa]);

  // JK ratio
  const jkData = useMemo(() => {
    const L = dataSiswa.filter((s) => s.jk === "L").length;
    const P = dataSiswa.filter((s) => s.jk === "P").length;
    return [
      { name: "Laki-laki", value: L },
      { name: "Perempuan", value: P },
    ];
  }, [dataSiswa]);

  if (dataSiswa.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        Belum ada data siswa untuk ditampilkan dalam chart
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bar Chart — Siswa per Kelas */}
      <div className="lg:col-span-2 card-obsidian p-5">
        <h3 className="text-sm font-bold text-white mb-4">
          Jumlah Siswa per Kelas
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={perKelas} barGap={4}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="kelas"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="L"
              stackId="a"
              fill="#3b82f6"
              radius={[0, 0, 0, 0]}
              name="Laki-laki"
            />
            <Bar
              dataKey="P"
              stackId="a"
              fill="#ec4899"
              radius={[4, 4, 0, 0]}
              name="Perempuan"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart — Rasio JK */}
      <div className="card-obsidian p-5">
        <h3 className="text-sm font-bold text-white mb-4">
          Rasio Jenis Kelamin
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={jkData}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {jkData.map((_, i) => (
                <Cell key={i} fill={COLORS_PIE[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(13,18,33,0.8)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
              formatter={(value: string) => (
                <span className="text-slate-400 text-xs font-medium">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-2">
          <span className="text-2xl font-black text-white">
            {dataSiswa.length}
          </span>
          <span className="text-xs text-slate-500 ml-1.5">Total Siswa</span>
        </div>
      </div>
    </div>
  );
}
