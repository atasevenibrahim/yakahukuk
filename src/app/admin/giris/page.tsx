import type { Metadata } from "next";
import { checkResetToken } from "./actions";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Yönetici girişi — YAKA Hukuk",
  robots: { index: false, follow: false },
};

export default async function AdminGirisPage({
  searchParams,
}: {
  searchParams: Promise<{ resetToken?: string }>;
}) {
  const { resetToken } = await searchParams;
  const validToken = resetToken ? await checkResetToken(resetToken) : false;

  return <AdminLoginForm initialResetToken={validToken ? resetToken : undefined} />;
}
