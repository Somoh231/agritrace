import DemoGuideClient from "@/components/marketing/DemoGuideClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function hasBackendConnection(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && anonKey);
}

export default function DemoPage() {
  if (!hasBackendConnection()) {
    redirect("/platform-preview");
  }
  return <DemoGuideClient />;
}

