"use client";

import * as React from "react";

import { AlertCard, EnterpriseFormActions, EnterpriseFormField, EnterpriseFormSection } from "@/components/enterprise";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RecordWarehouseForm({
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
  const [ministryCode, setMinistryCode] = React.useState("");
  const [managerName, setManagerName] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [threshold, setThreshold] = React.useState("15");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !county.trim()) {
      setError("Warehouse name and county are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("warehouses").insert({
        name: name.trim(),
        county: county.trim(),
        latitude: lat.trim() ? Number(lat) : null,
        longitude: lng.trim() ? Number(lng) : null,
        low_stock_threshold_pct: threshold.trim() ? Number(threshold) : 15,
        ministry_code: ministryCode.trim() || null,
        manager_name: managerName.trim() || null,
      } as any);
      if (insErr) throw insErr;
      await supabase.from("audit_log").insert({
        user_id: user?.id ?? null,
        action: "WAREHOUSE_CREATED",
        table_name: "warehouses",
        new_values: { name, county, district: district.trim() || null, ministry_code: ministryCode.trim() || null },
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
        <AlertCard tone="danger" title="Could not save warehouse">
          {error}
        </AlertCard>
      ) : null}

      <EnterpriseFormSection title="Warehouse identity" description="National hub name and ministry warehouse code.">
        <EnterpriseFormField id="wh-name" label="Warehouse name" required>
          <input id="wh-name" required value={name} onChange={(e) => setName(e.target.value)} className="av-input" placeholder="e.g. Bong Central Storage" />
        </EnterpriseFormField>
        <EnterpriseFormField
          id="wh-code"
          label="Warehouse code"
          helper="Ministry logistics code (e.g. BON-CENTRAL). Leave blank for auto-assignment."
        >
          <input id="wh-code" value={ministryCode} onChange={(e) => setMinistryCode(e.target.value)} className="av-input font-mono text-[12px]" placeholder="e.g. BON-CENTRAL" />
        </EnterpriseFormField>
        <EnterpriseFormField id="wh-manager" label="Warehouse manager / contact person">
          <input id="wh-manager" value={managerName} onChange={(e) => setManagerName(e.target.value)} className="av-input" placeholder="Officer or storekeeper name" />
        </EnterpriseFormField>
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Location" description="County anchor and GPS coordinates for routing.">
        <div className="grid gap-4 sm:grid-cols-2">
          <EnterpriseFormField id="wh-county" label="County" required>
            <input id="wh-county" required value={county} onChange={(e) => setCounty(e.target.value)} className="av-input" placeholder="County name" />
          </EnterpriseFormField>
          <EnterpriseFormField id="wh-district" label="District" hint="Recorded in audit metadata until warehouse district column is provisioned.">
            <input id="wh-district" value={district} onChange={(e) => setDistrict(e.target.value)} className="av-input" placeholder="e.g. Gbarnga" />
          </EnterpriseFormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <EnterpriseFormField id="wh-lat" label="GPS latitude">
            <input id="wh-lat" value={lat} onChange={(e) => setLat(e.target.value)} className="av-input font-mono text-[12px]" placeholder="6.3000" />
          </EnterpriseFormField>
          <EnterpriseFormField id="wh-lng" label="GPS longitude">
            <input id="wh-lng" value={lng} onChange={(e) => setLng(e.target.value)} className="av-input font-mono text-[12px]" placeholder="-10.8000" />
          </EnterpriseFormField>
        </div>
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Stock policy">
        <EnterpriseFormField id="wh-threshold" label="Low-stock threshold (%)" helper="Alert when stock falls below this percentage of capacity.">
          <input id="wh-threshold" type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="av-input" />
        </EnterpriseFormField>
      </EnterpriseFormSection>

      <EnterpriseFormActions onCancel={onCancel} submitLabel="Create warehouse" saving={saving} />
    </form>
  );
}
