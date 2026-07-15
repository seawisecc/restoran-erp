import { AMBIENT } from "@/lib/theme";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 sm:p-6"
      style={AMBIENT}
    >
      {children}
    </div>
  );
}
