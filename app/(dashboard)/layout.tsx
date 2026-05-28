import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { Sidebar } from "../../components/layout/Sidebar";
import { Header } from "../../components/layout/Header";
import { DynamicIsland } from "../../components/shared/DynamicIsland";
import { GlobalModals } from "../../components/shared/GlobalModals";
import { ZenModeManager } from "../../components/shared/ZenModeManager";
import { KeyboardShortcutsOverlay } from "../../components/shared/KeyboardShortcutsOverlay";
import { PageTransition } from "../../components/shared/PageTransition";
import { MobileBottomNav } from "../../components/layout/MobileBottomNav";
import {
  LazyCommandPalette as CommandPalette,
  LazyVoiceCommandEngine as VoiceCommandEngine,
  LazyWhatsAppBlast as WhatsAppBlast,
  LazyAIChat as AIChat,
} from "../../components/shared/LazyComponents";
import StoreInitializer from "../../components/StoreInitializer";
import { PageLoadingBar } from "../../components/shared/PageLoadingBar";
import { AccentInitializer } from "../../components/shared/AccentColorPicker";
import type { AppUser, Pengaturan } from "../../types";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function resolveRole(email: string): "admin" | "guru" | "orangtua" {
  if (ADMIN_EMAILS.includes(email)) return "admin";
  if (email.endsWith("@admin.sd.belajar.id")) return "admin";
  if (email.endsWith("@guru.sd.belajar.id")) return "guru";
  return "orangtua";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) redirect("/login");

  const email = authUser.email ?? "";
  const meta = authUser.user_metadata ?? {};

  const user: AppUser = {
    id: authUser.id,
    email,
    name:
      meta.full_name ||
      meta.name ||
      email.split("@")[0].replace(/[._]/g, " ") ||
      "Pengguna",
    avatar: meta.avatar_url || meta.picture || undefined,
    role: resolveRole(email),
  };

  let pengaturan: Pengaturan | null = null;
  try {
    const { data } = await supabase
      .from("pengaturan")
      .select("*")
      .limit(1)
      .single();
    if (data) pengaturan = data as Pengaturan;
  } catch {
    /* ignore */
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#050811" }}
    >
      <StoreInitializer user={user} pengaturan={pengaturan} />
      <ZenModeManager />
      <KeyboardShortcutsOverlay />
      <CommandPalette />
      <GlobalModals />
      <VoiceCommandEngine />
      <DynamicIsland />
      <AIChat />
      <PageLoadingBar />
      <AccentInitializer />

      {/* Sidebar */}
      <Sidebar user={user} pengaturan={pengaturan} />

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll relative pb-20 lg:pb-0">
          {/* Ambient background decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.06]"
              style={{
                background:
                  "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
                filter: "blur(80px)",
              }}
            />
            <div
              className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-[0.05]"
              style={{
                background:
                  "radial-gradient(circle, #22d3ee 0%, transparent 70%)",
                filter: "blur(100px)",
              }}
            />
          </div>

          {/* Page content — each page manages its own padding */}
          <div className="relative z-10">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
