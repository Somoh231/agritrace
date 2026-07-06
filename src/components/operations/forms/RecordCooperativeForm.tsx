"use client";

import * as React from "react";

import { AlertCard, EnterpriseFormActions, EnterpriseFormField, EnterpriseFormSection } from "@/components/enterprise";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RecordCooperativeForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [county, setCounty] = React.useState("");
  const [district, setDistrict] = React.useState("");
  const [clan, setClan] = React.useState("");
  const [license, setLicense] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [taxId, setTaxId] = React.useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !county.trim()) {
      setError("Cooperative name and county are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("organizations").insert({
        name: name.trim(),
        type: "cooperative",
        county: county.trim(),
        country: "Liberia",
        license_number: license.trim() || null,
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
      } as any);
      if (insErr) throw insErr;
      await supabase.from("audit_log").insert({
        user_id: user?.id ?? null,
        action: "COOPERATIVE_CREATED",
        table_name: "organizations",
        new_values: {
          name,
          county,
          district: district.trim() || null,
          clan: clan.trim() || null,
          tax_id: taxId.trim() || null,
        },
      } as any);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {error ? (
        <AlertCard tone="danger" title="Could not register cooperative">
          {error}
        </AlertCard>
      ) : null}

      <EnterpriseFormSection title="Cooperative identity" description="Legal name and ministry registration identifiers.">
        <EnterpriseFormField id="coop-name" label="Cooperative name" required>
          <input id="coop-name" required value={name} onChange={(e) => setName(e.target.value)} className="av-input" placeholder="e.g. Nimba Highlands Cooperative" />
        </EnterpriseFormField>
        <EnterpriseFormField
          id="coop-license"
          label="Cooperative registration / license number"
          helper="Ministry-issued cooperative registration or business license."
        >
          <input id="coop-license" value={license} onChange={(e) => setLicense(e.target.value)} className="av-input" placeholder="e.g. COOP-LR-2024-0042" />
        </EnterpriseFormField>
        <EnterpriseFormField id="coop-tax" label="Tax identification number (TIN)" hint="Stored in audit metadata until dedicated column is provisioned.">
          <input id="coop-tax" value={taxId} onChange={(e) => setTaxId(e.target.value)} className="av-input" placeholder="Optional" />
        </EnterpriseFormField>
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Location" description="County and community anchors for DAO routing.">
        <div className="grid gap-4 sm:grid-cols-2">
          <EnterpriseFormField id="coop-county" label="County" required>
            <input id="coop-county" required value={county} onChange={(e) => setCounty(e.target.value)} className="av-input" placeholder="e.g. Nimba" />
          </EnterpriseFormField>
          <EnterpriseFormField id="coop-district" label="District" hint="Recorded in audit metadata for pilot routing.">
            <input id="coop-district" value={district} onChange={(e) => setDistrict(e.target.value)} className="av-input" placeholder="e.g. Sanniquellie-Mahn" />
          </EnterpriseFormField>
        </div>
        <EnterpriseFormField id="coop-clan" label="Clan / community" hint="Town, clan, or community name for field officer context.">
          <input id="coop-clan" value={clan} onChange={(e) => setClan(e.target.value)} className="av-input" placeholder="e.g. Gblor Clan" />
        </EnterpriseFormField>
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Primary contact" description="Officer or chairperson reachable for verification.">
        <div className="grid gap-4 sm:grid-cols-2">
          <EnterpriseFormField id="coop-contact" label="Contact person">
            <input id="coop-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} className="av-input" placeholder="Full name" />
          </EnterpriseFormField>
          <EnterpriseFormField id="coop-phone" label="Phone number" helper="Liberia format: +231 …">
            <input id="coop-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="av-input" placeholder="+231 77 000 0000" />
          </EnterpriseFormField>
        </div>
      </EnterpriseFormSection>

      <EnterpriseFormActions onCancel={onCancel} submitLabel="Register cooperative" saving={saving} />
    </form>
  );
}
