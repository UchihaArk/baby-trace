import { BabyShell } from "@/components/baby/baby-shell";

export default async function BabyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return <BabyShell name={name}>{children}</BabyShell>;
}
