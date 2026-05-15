export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  // Standalone layout for public verification — no sidebar, no header
  return <>{children}</>;
}
