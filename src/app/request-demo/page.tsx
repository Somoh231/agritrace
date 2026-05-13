import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";
import PublicSiteShell from "@/components/agrivault/site/PublicSiteShell";
import RequestDemoForm from "@/components/marketing/RequestDemoForm";

export const dynamic = "force-dynamic";

export default function RequestDemoPage() {
  return (
    <PublicSiteShell>
      <PublicNav />
      <main className="page agrivault-html-main flex-1 py-10 sm:py-14">
        <div className="container max-w-lg">
          <RequestDemoForm />
        </div>
      </main>
      <PublicFooter />
    </PublicSiteShell>
  );
}
