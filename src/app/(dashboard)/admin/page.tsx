import Link from "next/link";

export const dynamic = "force-dynamic";

type AdminLink = { label: string; href: string; hint: string };
type AdminGroup = { label: string; links: AdminLink[] };

const GROUPS: AdminGroup[] = [
  {
    label: "Access & roles",
    links: [
      { label: "Users & roles", href: "/admin/users", hint: "Accounts, roles, and activation" },
      { label: "Permissions", href: "/admin/governance", hint: "Role governance and policy" },
      { label: "Organizations", href: "/admin/organizations", hint: "Institutions and partners" },
    ],
  },
  {
    label: "Oversight & compliance",
    links: [
      { label: "Compliance", href: "/compliance", hint: "Compliance posture and tooling" },
      { label: "Audit logs", href: "/compliance/audit-log", hint: "Immutable activity trail" },
      { label: "Activity", href: "/activity", hint: "Recent system activity" },
    ],
  },
  {
    label: "System",
    links: [
      { label: "System diagnostics", href: "/admin/system", hint: "Environment and health checks" },
      { label: "Data integrations", href: "/admin/integrations", hint: "External data connections" },
      { label: "Import & pipelines", href: "/admin/import", hint: "Bulk import and pipelines" },
      { label: "Settings", href: "/admin/settings", hint: "Platform configuration" },
    ],
  },
  {
    label: "Insights & content",
    links: [
      { label: "Reports center", href: "/admin/reports", hint: "Administrative reports" },
      { label: "Analytics", href: "/admin/analytics", hint: "Usage and adoption analytics" },
      { label: "Content", href: "/admin/content", hint: "Marketing and site content" },
      { label: "Capabilities", href: "/admin/capabilities", hint: "Feature capability matrix" },
      { label: "API docs", href: "/admin/api-docs", hint: "Integration reference" },
      { label: "Launch readiness", href: "/admin/launch-readiness", hint: "Go-live checklist" },
      { label: "Demo inquiries", href: "/admin/demo-inquiries", hint: "Inbound demo requests" },
    ],
  },
];

export default function AdminHubPage() {
  return (
    <div className="max-w-6xl space-y-6">
      <header className="border-b border-gray-200 pb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-700">Administration</div>
        <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-gray-900">Administration hub</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-gray-600">
          Every administrative console in one place. Core areas also appear in the sidebar; everything
          else lives here to keep navigation focused.
        </p>
      </header>

      {GROUPS.map((group) => (
        <section key={group.label} className="space-y-2.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">{group.label}</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl border border-gray-200 bg-white px-4 py-3.5 transition hover:border-emerald-500/50 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-gray-900">{link.label}</div>
                    <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{link.hint}</p>
                  </div>
                  <span className="font-mono text-[13px] text-emerald-600 transition group-hover:translate-x-0.5">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
