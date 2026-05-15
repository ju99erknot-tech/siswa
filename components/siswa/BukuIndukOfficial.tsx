"use client";

import React, { forwardRef } from "react";
import type { Siswa, Pengaturan } from "@/types";
import { formatTanggal } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";

interface Props {
  siswa: Siswa | null;
  pengaturan: Pengaturan | null;
}

export const BukuIndukOfficial = forwardRef<HTMLDivElement, Props>(
  ({ siswa, pengaturan }, ref) => {
    const config = useSchoolConfig();
    if (!siswa) return null;

    const LabelValue = ({
      label,
      value,
      dots = true,
    }: {
      label: string;
      value: any;
      dots?: boolean;
    }) => (
      <div className="flex items-start gap-2 mb-1.5 leading-relaxed text-[13px]">
        <div className="w-[200px] flex-shrink-0">{label}</div>
        <div className="flex-shrink-0">{dots ? ":" : ""}</div>
        <div className="flex-1 font-medium border-b border-dotted border-black/30 min-h-[1.2rem]">
          {value || "-"}
        </div>
      </div>
    );

    const SectionTitle = ({ title, num }: { title: string; num: string }) => (
      <div className="font-bold mt-6 mb-3 uppercase text-[14px] flex gap-2 border-b-2 border-black pb-0.5">
        <span>{num}.</span>
        <span>{title}</span>
      </div>
    );

    return (
      <div
        ref={ref}
        className="bg-white p-[20mm] text-black font-serif min-h-screen"
        style={{ width: "210mm" }}
      >
        {/* HEADER KOP */}
        {pengaturan?.kop_surat_url ? (
          <div className="w-full mb-8">
            <img
              src={pengaturan.kop_surat_url}
              alt="Kop Surat"
              className="w-full h-auto object-contain"
            />
          </div>
        ) : (
          <div className="flex items-center gap-6 border-b-4 border-black pb-4 mb-8">
            {pengaturan?.logo_url ? (
              <img
                src={pengaturan.logo_url}
                alt="Logo"
                className="w-20 h-20 object-contain"
              />
            ) : (
              <div className="w-20 h-20 bg-slate-100 border border-black flex items-center justify-center text-[10px] text-center">
                LOGO
                <br />
                SEKOLAH
              </div>
            )}
            <div className="flex-1 text-center">
              <h1 className="text-[18px] font-bold uppercase leading-tight">
                Pemerintah Kabupaten Sukabumi
              </h1>
              <h1 className="text-[22px] font-black uppercase leading-tight">
                {config.namaSekolah}
              </h1>
              <p className="text-[12px] mt-1">{config.alamatSekolah}</p>
              <p className="text-[12px] italic">
                NPSN: {pengaturan?.npsn || "-"}
              </p>
            </div>
          </div>
        )}

        {/* JUDUL DOKUMEN */}
        <div className="text-center mb-8">
          <h2 className="text-[18px] font-bold underline uppercase tracking-widest">
            LEMBAR BUKU INDUK PESERTA DIDIK
          </h2>
          <p className="text-[12px] mt-1 font-sans">
            NOMOR INDUK SISWA NASIONAL (NISN):{" "}
            <span className="font-bold">{siswa.nisn}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-1">
          {/* SECTION A: KETERANGAN DIRI SISWA */}
          <SectionTitle num="I" title="KETERANGAN TENTANG DIRI SISWA" />
          <LabelValue label="1. Nama Lengkap" value={siswa.nama} />
          <LabelValue label="2. Nama Panggilan" value="-" />
          <LabelValue
            label="3. Jenis Kelamin"
            value={siswa.jk === "L" ? "Laki-laki" : "Perempuan"}
          />
          <LabelValue
            label="4. Tempat dan Tanggal Lahir"
            value={`${siswa.tempat_lahir || "-"}, ${siswa.tanggal_lahir ? formatTanggal(siswa.tanggal_lahir) : "-"}`}
          />
          <LabelValue label="5. Agama" value={siswa.agama} />
          <LabelValue label="6. Kewarganegaraan" value="Indonesia" />
          <LabelValue label="7. Anak ke berapa" value={siswa.anak_ke} />
          <LabelValue
            label="8. Jumlah Saudara Kandung"
            value={siswa.jml_saudara}
          />
          <LabelValue label="9. Jumlah Saudara Tiri" value="-" />
          <LabelValue label="10. Jumlah Saudara Angkat" value="-" />
          <LabelValue label="11. Anak Yatim / Piatu / Yatim Piatu" value="-" />
          <LabelValue
            label="12. Bahasa sehari-hari di rumah"
            value="Bahasa Indonesia"
          />

          {/* SECTION B: KETERANGAN TEMPAT TINGGAL */}
          <SectionTitle num="II" title="KETERANGAN TEMPAT TINGGAL" />
          <LabelValue label="13. Alamat Lengkap" value={siswa.alamat} />
          <LabelValue label="14. Nomor Telepon / WA" value={siswa.no_wa} />
          <LabelValue label="15. Tinggal Dengan" value={siswa.jenis_tinggal} />
          <LabelValue
            label="16. Jarak Tempat Tinggal ke Sekolah"
            value={siswa.jarak_rumah}
          />
          <LabelValue
            label="17. Alat Transportasi ke Sekolah"
            value={siswa.alat_transportasi}
          />

          {/* SECTION C: KETERANGAN KESEHATAN */}
          <SectionTitle num="III" title="KETERANGAN KESEHATAN" />
          <LabelValue label="18. Golongan Darah" value={siswa.gol_darah} />
          <LabelValue
            label="19. Penyakit yang pernah diderita"
            value={siswa.penyakit_khusus}
          />
          <LabelValue
            label="20. Kelainan Jasmani"
            value={siswa.kebutuhan_khusus}
          />
          <LabelValue
            label="21. Berat / Tinggi Badan"
            value={`${siswa.berat_badan || "-"} kg / ${siswa.tinggi_badan || "-"} cm`}
          />

          {/* SECTION D: KETERANGAN PENDIDIKAN */}
          <SectionTitle num="IV" title="KETERANGAN PENDIDIKAN" />
          <LabelValue label="22. Asal Sekolah" value={siswa.asal_sekolah} />
          <LabelValue
            label="23. Tanggal Diterima di Sekolah ini"
            value={siswa.tahun_masuk}
          />
          <LabelValue label="24. Di Kelas" value={siswa.kelas} />
          <LabelValue
            label="25. No. Ijazah / SKHUN"
            value={`${siswa.no_ijazah || "-"} / ${siswa.skhun || "-"}`}
          />
        </div>

        {/* PAGE BREAK (Simulation) */}
        <div className="my-10 border-t border-dashed border-gray-200" />

        {/* SECTION E: KETERANGAN ORANG TUA */}
        <SectionTitle num="V" title="KETERANGAN TENTANG ORANG TUA KANDUNG" />
        <div className="grid grid-cols-2 gap-x-8">
          <div>
            <p className="font-bold underline text-[12px] mb-2">
              A. AYAH KANDUNG
            </p>
            <LabelValue label="26. Nama" value={siswa.nama_ayah} />
            <LabelValue label="27. NIK" value={siswa.nik_ayah} />
            <LabelValue
              label="28. Tahun Lahir"
              value={siswa.tahun_lahir_ayah}
            />
            <LabelValue label="29. Pendidikan" value={siswa.pendidikan_ayah} />
            <LabelValue label="30. Pekerjaan" value={siswa.pekerjaan_ayah} />
            <LabelValue
              label="31. Penghasilan"
              value={siswa.penghasilan_ayah}
            />
          </div>
          <div>
            <p className="font-bold underline text-[12px] mb-2">
              B. IBU KANDUNG
            </p>
            <LabelValue label="32. Nama" value={siswa.nama_ibu} />
            <LabelValue label="33. NIK" value={siswa.nik_ibu} />
            <LabelValue label="34. Tahun Lahir" value={siswa.tahun_lahir_ibu} />
            <LabelValue label="35. Pendidikan" value={siswa.pendidikan_ibu} />
            <LabelValue label="36. Pekerjaan" value={siswa.pekerjaan_ibu} />
            <LabelValue label="37. Penghasilan" value={siswa.penghasilan_ibu} />
          </div>
        </div>

        {/* SECTION F: WALI */}
        {siswa.nama_wali && (
          <>
            <SectionTitle num="VI" title="KETERANGAN TENTANG WALI" />
            <LabelValue label="38. Nama Wali" value={siswa.nama_wali} />
            <LabelValue label="39. NIK Wali" value={siswa.nik_wali} />
            <LabelValue label="40. Pekerjaan" value={siswa.pekerjaan_wali} />
            <LabelValue label="41. Alamat Wali" value="-" />
          </>
        )}

        {/* FOOTER PENGESAHAN */}
        <div className="mt-16 flex justify-between items-end">
          {/* Photo Box */}
          <div className="w-[30mm] h-[40mm] border border-gray-300 flex flex-col items-center justify-center text-[9px] text-gray-400 text-center relative mb-4">
            {siswa.foto_url ? (
              <img
                src={siswa.foto_url}
                alt="Foto"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                PAS FOTO
                <br />3 X 4
              </>
            )}
            <div className="absolute -bottom-5 left-0 right-0 text-[8px] font-sans italic text-gray-400 text-center">
              Cap Tiga Jari
            </div>
          </div>

          {/* Signature */}
          <div className="text-center min-w-[250px] text-[13px] relative">
            <p>
              {config.kotaSekolah},{" "}
              {format(new Date(), "dd MMMM yyyy", { locale: idLocale })}
            </p>
            <p className="mt-1">Kepala Sekolah,</p>

            <div className="relative h-16 w-full flex justify-center -mb-4">
              {pengaturan?.ttd_url && (
                <img
                  src={pengaturan.ttd_url}
                  alt="TTD"
                  className="absolute z-10 w-40 h-auto object-contain opacity-80"
                  style={{ top: "5px" }}
                />
              )}
              {pengaturan?.stempel_url && (
                <img
                  src={pengaturan.stempel_url}
                  alt="Stempel"
                  className="absolute z-30 w-32 h-auto object-contain"
                  style={{
                    mixBlendMode: "multiply",
                    top: "-10px",
                    left: "10px",
                  }}
                />
              )}
            </div>

            <p className="font-bold underline uppercase relative z-30">
              {config.namaKepsek}
            </p>
            <p className="relative z-30">NIP. {config.nipKepsek}</p>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            body {
              background: white !important;
              padding: 0 !important;
            }
            .font-serif {
              font-family: "Times New Roman", Times, serif !important;
            }
          }
        `}</style>
      </div>
    );
  },
);

BukuIndukOfficial.displayName = "BukuIndukOfficial";
