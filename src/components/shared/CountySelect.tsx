import * as React from "react";

import { PILOT_COUNTIES } from "@/lib/utils/pilot-config";
import { LIBERIA_COUNTIES } from "@/lib/utils/liberia";

export default function CountySelect({
  value,
  onChange,
  allCounties = false,
  allowAllOption = true,
  className = "h-10 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]",
}: {
  value: string;
  onChange: (value: string) => void;
  allCounties?: boolean;
  allowAllOption?: boolean;
  className?: string;
}) {
  const counties = allCounties ? (LIBERIA_COUNTIES as readonly string[]) : (PILOT_COUNTIES as readonly string[]);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      {allowAllOption ? <option value="">All</option> : null}
      {counties.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

