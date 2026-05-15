"use client";

import { useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Eye,
  Trash2,
  Check,
  User,
  MessageCircle,
  X,
  Send,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import type { Siswa } from "@/types";

interface SiswaTableProps {
  data: Siswa[];
  onDelete?: (id: string, nama: string) => void;
  onDeleteBulk?: (ids: string[]) => void;
}

export default function SiswaTable({
  data,
  onDelete,
  onDeleteBulk,
}: SiswaTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // WA Blast State
  const [showWaModal, setShowWaModal] = useState(false);
  const [waMessage, setWaMessage] = useState(
    "Halo Bapak/Ibu Wali Murid dari [NAMA],\n\nKami menginformasikan bahwa...",
  );

  const columns = useMemo<ColumnDef<Siswa>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="accent-violet-500 w-4 h-4 rounded"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="accent-violet-500 w-4 h-4 rounded"
          />
        ),
        size: 40,
      },
      {
        accessorKey: "nama",
        header: "Nama Siswa",
        cell: ({ row }) => {
          const studentId = row.original.id || row.original.nisn;
          const hasError = imageErrors.has(studentId);

          const handleImageError = () => {
            setImageErrors((prev) => new Set(prev).add(studentId));
          };

          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {row.original.foto_url && !hasError ? (
                  <img
                    src={row.original.foto_url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <User className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">
                  {row.original.nama}
                </div>
                <div className="text-[10px] text-slate-500">
                  NISN: {row.original.nisn}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "nisn",
        header: "NISN",
        cell: ({ getValue }) => (
          <span className="text-xs font-mono text-cyan-300">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "jk",
        header: "JK",
        cell: ({ getValue }) => {
          const jk = getValue() as string;
          return (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${jk === "L" ? "bg-blue-500/15 text-blue-400" : "bg-pink-500/15 text-pink-400"}`}
            >
              {jk}
            </span>
          );
        },
        size: 60,
      },
      {
        accessorKey: "kelas",
        header: "Kelas",
        cell: ({ row }) => (
          <span className="text-sm text-slate-300">
            {row.original.kelas || "-"}
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: "tempat_lahir",
        header: "Tempat Lahir",
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-400 truncate max-w-[120px] block">
            {(getValue() as string) || "-"}
          </span>
        ),
      },
      {
        accessorKey: "no_wa",
        header: "No. WA",
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-400 font-mono">
            {(getValue() as string) || "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {row.original.no_wa && row.original.no_wa !== "-" && (
              <a
                href={`https://wa.me/${row.original.no_wa.replace(/^0/, "62")}?text=Halo%20Bapak/Ibu%20Wali%20Murid%20dari%20${row.original.nama},%20`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                title="Kirim Pesan WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            {row.original.alamat && (
              <div className="relative group/map">
                <button
                  className="p-1.5 rounded-lg text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                  title="Lihat Peta Lokasi"
                >
                  <MapPin className="w-4 h-4" />
                </button>
                {/* Map Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 w-48 p-3 rounded-xl bg-slate-800 border border-slate-700 shadow-xl opacity-0 invisible group-hover/map:opacity-100 group-hover/map:visible transition-all z-50">
                  <div className="text-xs font-bold text-white mb-1">
                    Alamat
                  </div>
                  <div className="text-[10px] text-slate-300 leading-relaxed">
                    {row.original.alamat}
                  </div>
                  <div className="absolute -bottom-1 right-2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 transform rotate-45"></div>
                </div>
              </div>
            )}
            <Link
              href={`/siswa/${row.original.id}`}
              className="p-1.5 rounded-lg text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" />
            </Link>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Hapus "${row.original.nama}"?`))
                    onDelete(row.original.id, row.original.nama);
                }}
                className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Hapus Siswa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
        size: 80,
      },
    ],
    [onDelete],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((r) => r.original.id);

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && onDeleteBulk && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 flex items-center justify-between"
        >
          <span className="text-sm text-violet-300 font-bold flex items-center gap-2">
            <Check className="w-4 h-4" /> {selectedIds.length} siswa dipilih
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWaModal(true)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Blast WA
            </button>
            <button
              onClick={() => {
                if (confirm(`Hapus ${selectedIds.length} siswa terpilih?`)) {
                  onDeleteBulk(selectedIds);
                  setRowSelection({});
                }
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              Hapus {selectedIds.length} Siswa
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="card-obsidian overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-obsidian">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="cursor-pointer select-none hover:text-white transition-colors"
                      onClick={h.column.getToggleSortingHandler()}
                      style={{
                        width: h.getSize() !== 150 ? h.getSize() : undefined,
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getCanSort() &&
                          h.id !== "select" &&
                          h.id !== "actions" && (
                            <ArrowUpDown className="w-3 h-3 text-slate-600" />
                          )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-16 text-white/40"
                  >
                    Tidak ada data yang cocok
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <span className="text-xs text-slate-500">
            Hal. {table.getState().pagination.pageIndex + 1} dari{" "}
            {table.getPageCount()} · {data.length} siswa
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 disabled:opacity-30 transition-all"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 disabled:opacity-30 transition-all"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Blast Modal */}
      {showWaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWaModal(false)}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{
              background: "#0d1221",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-emerald-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">
                    WhatsApp Blast
                  </h2>
                  <p className="text-xs text-white/50">
                    Kirim pesan ke {selectedIds.length} wali murid terpilih
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWaModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
              <div>
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">
                  Template Pesan
                </label>
                <div className="mb-2 flex gap-2">
                  {["[NAMA]", "[KELAS]", "[NISN]"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setWaMessage((prev) => prev + tag)}
                      className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <textarea
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full h-32 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.9)",
                  }}
                  placeholder="Ketik pesan disini..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3 block border-b border-white/5 pb-2">
                  Daftar Penerima (
                  {
                    table
                      .getSelectedRowModel()
                      .rows.filter(
                        (r) => r.original.no_wa && r.original.no_wa !== "-",
                      ).length
                  }{" "}
                  Valid)
                </label>
                <div className="space-y-2">
                  {table.getSelectedRowModel().rows.map((row) => {
                    const s = row.original;
                    const isValidWA = s.no_wa && s.no_wa !== "-";
                    const finalMsg = encodeURIComponent(
                      waMessage
                        .replace(/\[NAMA\]/g, s.nama)
                        .replace(/\[KELAS\]/g, s.kelas || "-")
                        .replace(/\[NISN\]/g, s.nisn),
                    );
                    const waLink = isValidWA
                      ? `https://wa.me/${s.no_wa!.replace(/^0/, "62")}?text=${finalMsg}`
                      : "#";

                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isValidWA ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                          >
                            {isValidWA ? <Check size={14} /> : <X size={14} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white/90">
                              {s.nama}
                            </p>
                            <p className="text-xs text-white/40 font-mono">
                              {isValidWA ? s.no_wa : "Tidak ada nomor WA"}
                            </p>
                          </div>
                        </div>
                        {isValidWA && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white flex items-center gap-2 transition-colors"
                          >
                            <Send size={12} /> Kirim
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
              <button
                onClick={() => setShowWaModal(false)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white/50 hover:text-white transition-all"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
