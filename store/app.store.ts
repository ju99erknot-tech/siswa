"use client";
import { create } from "zustand";
import type {
  Siswa,
  MutasiMasuk,
  MutasiKeluar,
  Prestasi,
  Alumni,
  PIP,
  UKS,
  Izin,
  Eskul,
  Jurnal,
  Rapor,
  CatatanRapor,
  Pengumuman,
  Agenda,
  Survei,
  Akreditasi,
  AppUser,
  Pengaturan,
  Guru,
  MasterKelas,
} from "@/types";

interface TableFilterState {
  search: string;
  tahun: string;
  bulan: string;
  kelas: string;
  tingkat?: string;
}

const defaultTableFilter: TableFilterState = {
  search: "",
  tahun: "all",
  bulan: "all",
  kelas: "all",
};

interface AppState {
  // ── Auth ─────────────────────────────────────────────────
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;

  // ── Data ─────────────────────────────────────────────────
  dataSiswa: Siswa[];
  dataMutasiMasuk: MutasiMasuk[];
  dataMutasiKeluar: MutasiKeluar[];
  dataPrestasi: Prestasi[];
  dataAlumni: Alumni[];
  dataPIP: PIP[];
  dataUKS: UKS[];
  dataIzin: Izin[];
  dataEskul: Eskul[];
  dataJurnal: Jurnal[];
  dataRapor: Rapor[];
  dataCatatanRapor: CatatanRapor[];
  dataPengumuman: Pengumuman[];
  dataAgenda: Agenda[];
  dataSurvei: Survei[];
  dataAkreditasi: Akreditasi[];
  dataGuru: Guru[];
  dataKelas: MasterKelas[];
  pengaturan: Pengaturan | null;
  stagingData: Record<string, unknown>[];

  setDataSiswa: (d: Siswa[]) => void;
  setDataMutasiMasuk: (d: MutasiMasuk[]) => void;
  setDataMutasiKeluar: (d: MutasiKeluar[]) => void;
  setDataPrestasi: (d: Prestasi[]) => void;
  setDataAlumni: (d: Alumni[]) => void;
  setDataPIP: (d: PIP[]) => void;
  setDataUKS: (d: UKS[]) => void;
  setDataIzin: (d: Izin[]) => void;
  setDataEskul: (d: Eskul[]) => void;
  setDataJurnal: (d: Jurnal[]) => void;
  setDataRapor: (d: Rapor[]) => void;
  setDataCatatanRapor: (d: CatatanRapor[]) => void;
  setDataPengumuman: (d: Pengumuman[]) => void;
  setDataAgenda: (d: Agenda[]) => void;
  setDataSurvei: (d: Survei[]) => void;
  setDataAkreditasi: (d: Akreditasi[]) => void;
  setDataGuru: (d: Guru[]) => void;
  setDataKelas: (d: MasterKelas[]) => void;
  setPengaturan: (d: Pengaturan) => void;
  setStagingData: (d: Record<string, unknown>[]) => void;

  // ── UI ───────────────────────────────────────────────────
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;

  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  isFetching: boolean;
  setFetching: (v: boolean) => void;

  zenMode: boolean;
  toggleZenMode: () => void;

  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  toggleSearch: () => void;

  waBlastOpen: boolean;
  setWaBlastOpen: (v: boolean) => void;

  detailSiswa: Siswa | null;
  setDetailSiswa: (s: Siswa | null) => void;

  // ── Filters ──────────────────────────────────────────────
  filterSiswa: { kelas: string; jk: string; search: string };
  setFilterSiswa: (
    f: Partial<{ kelas: string; jk: string; search: string }>,
  ) => void;
  resetFilterSiswa: () => void;

  filterMutasi: TableFilterState;
  setFilterMutasi: (f: Partial<TableFilterState>) => void;
  resetFilterMutasi: () => void;

  filterPrestasi: TableFilterState;
  setFilterPrestasi: (f: Partial<TableFilterState>) => void;
  resetFilterPrestasi: () => void;

  filterAlumni: TableFilterState;
  setFilterAlumni: (f: Partial<TableFilterState>) => void;
  resetFilterAlumni: () => void;

  filterPIP: TableFilterState;
  setFilterPIP: (f: Partial<TableFilterState>) => void;
  resetFilterPIP: () => void;

  filterIzin: TableFilterState;
  setFilterIzin: (f: Partial<TableFilterState>) => void;
  resetFilterIzin: () => void;

  filterEskul: TableFilterState;
  setFilterEskul: (f: Partial<TableFilterState>) => void;
  resetFilterEskul: () => void;

  filterJurnal: TableFilterState;
  setFilterJurnal: (f: Partial<TableFilterState>) => void;
  resetFilterJurnal: () => void;

  // ── Selection (bulk actions) ──────────────────────────────
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelected: () => void;

  // ── Voice Command ─────────────────────────────────────────
  voiceActive: boolean;
  setVoiceActive: (v: boolean) => void;
}

const defaultFilterSiswa = { kelas: "all", jk: "all", search: "" };

export const useAppStore = create<AppState>()((set) => ({
  // Auth
  user: null,
  setUser: (u) => set({ user: u }),

  // Data
  dataSiswa: [],
  dataMutasiMasuk: [],
  dataMutasiKeluar: [],
  dataPrestasi: [],
  dataAlumni: [],
  dataPIP: [],
  dataUKS: [],
  dataIzin: [],
  dataEskul: [],
  dataJurnal: [],
  dataRapor: [],
  dataCatatanRapor: [],
  dataPengumuman: [],
  dataAgenda: [],
  dataSurvei: [],
  dataAkreditasi: [],
  dataGuru: [],
  dataKelas: [],
  pengaturan: null,
  stagingData: [],

  setDataSiswa: (d) => set({ dataSiswa: d }),
  setDataMutasiMasuk: (d) => set({ dataMutasiMasuk: d }),
  setDataMutasiKeluar: (d) => set({ dataMutasiKeluar: d }),
  setDataPrestasi: (d) => set({ dataPrestasi: d }),
  setDataAlumni: (d) => set({ dataAlumni: d }),
  setDataPIP: (d) => set({ dataPIP: d }),
  setDataUKS: (d) => set({ dataUKS: d }),
  setDataIzin: (d) => set({ dataIzin: d }),
  setDataEskul: (d) => set({ dataEskul: d }),
  setDataJurnal: (d) => set({ dataJurnal: d }),
  setDataRapor: (d) => set({ dataRapor: d }),
  setDataCatatanRapor: (d) => set({ dataCatatanRapor: d }),
  setDataPengumuman: (d) => set({ dataPengumuman: d }),
  setDataAgenda: (d) => set({ dataAgenda: d }),
  setDataSurvei: (d) => set({ dataSurvei: d }),
  setDataAkreditasi: (d) => set({ dataAkreditasi: d }),
  setDataGuru: (d) => set({ dataGuru: d }),
  setDataKelas: (d) => set({ dataKelas: d }),
  setPengaturan: (d) => set({ pengaturan: d }),
  setStagingData: (d) => set({ stagingData: d }),

  // UI
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  sidebarCollapsed: typeof window !== 'undefined' ? localStorage.getItem('sidebar_collapsed') === 'true' : false,
  toggleSidebarCollapsed: () => set((s) => {
    const next = !s.sidebarCollapsed;
    try { localStorage.setItem('sidebar_collapsed', String(next)); } catch {}
    return { sidebarCollapsed: next };
  }),
  setSidebarCollapsed: (v) => {
    try { localStorage.setItem('sidebar_collapsed', String(v)); } catch {}
    set({ sidebarCollapsed: v });
  },

  isFetching: true,
  setFetching: (v) => set({ isFetching: v }),

  zenMode: false,
  toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),

  searchOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),

  waBlastOpen: false,
  setWaBlastOpen: (v) => set({ waBlastOpen: v }),

  detailSiswa: null,
  setDetailSiswa: (s) => set({ detailSiswa: s }),

  // Filters
  filterSiswa: defaultFilterSiswa,
  setFilterSiswa: (f) =>
    set((s) => ({ filterSiswa: { ...s.filterSiswa, ...f } })),
  resetFilterSiswa: () => set({ filterSiswa: defaultFilterSiswa }),

  filterMutasi: { ...defaultTableFilter },
  setFilterMutasi: (f) =>
    set((s) => ({ filterMutasi: { ...s.filterMutasi, ...f } })),
  resetFilterMutasi: () => set({ filterMutasi: { ...defaultTableFilter } }),

  filterPrestasi: { ...defaultTableFilter },
  setFilterPrestasi: (f) =>
    set((s) => ({ filterPrestasi: { ...s.filterPrestasi, ...f } })),
  resetFilterPrestasi: () =>
    set({ filterPrestasi: { ...defaultTableFilter } }),

  filterAlumni: { ...defaultTableFilter },
  setFilterAlumni: (f) =>
    set((s) => ({ filterAlumni: { ...s.filterAlumni, ...f } })),
  resetFilterAlumni: () => set({ filterAlumni: { ...defaultTableFilter } }),

  filterPIP: { ...defaultTableFilter },
  setFilterPIP: (f) =>
    set((s) => ({ filterPIP: { ...s.filterPIP, ...f } })),
  resetFilterPIP: () => set({ filterPIP: { ...defaultTableFilter } }),

  filterIzin: { ...defaultTableFilter },
  setFilterIzin: (f) =>
    set((s) => ({ filterIzin: { ...s.filterIzin, ...f } })),
  resetFilterIzin: () => set({ filterIzin: { ...defaultTableFilter } }),

  filterEskul: { ...defaultTableFilter },
  setFilterEskul: (f) =>
    set((s) => ({ filterEskul: { ...s.filterEskul, ...f } })),
  resetFilterEskul: () => set({ filterEskul: { ...defaultTableFilter } }),

  filterJurnal: { ...defaultTableFilter },
  setFilterJurnal: (f) =>
    set((s) => ({ filterJurnal: { ...s.filterJurnal, ...f } })),
  resetFilterJurnal: () => set({ filterJurnal: { ...defaultTableFilter } }),

  // Selection
  selectedIds: new Set(),
  toggleSelected: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelected: () => set({ selectedIds: new Set() }),

  // Voice
  voiceActive: false,
  setVoiceActive: (v) => set({ voiceActive: v }),
}));
