import { redirect } from "next/navigation";

// Halaman pendaftaran kini digabung ke halaman auth geser (/login).
// Route ini dipertahankan untuk kompatibilitas tautan lama.
export default function SignupPage() {
  redirect("/login");
}
