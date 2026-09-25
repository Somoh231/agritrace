import { ImageResponse } from "next/og";

export const alt = "AgriVault Data — agricultural systems, technology and advisory";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card: navy field, contour lines, the corporate mark and positioning line. No programme or ministry marks. */
export default function OpenGraphImage() {
  const contours = Array.from({ length: 12 }, (_, i) => {
    const y = 40 + i * 50;
    let d = `M0 ${y}`;
    for (let x = 0; x <= 1200; x += 40) d += ` L${x} ${(y + 14 * Math.sin(x / 170 + i * 0.6) + 6 * Math.sin(x / 61 - i)).toFixed(1)}`;
    return d;
  });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #07152D 0%, #0B2E1A 100%)",
          color: "#F7F7F2",
          position: "relative",
        }}
      >
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
          {contours.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#9AA7B8" strokeOpacity={0.1} strokeWidth={1.2} />
          ))}
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 100 100">
            <path d="M6 92L50 6L94 92" fill="none" stroke="#F7F7F2" strokeWidth={8} />
            <path d="M21 92L50 35.3L79 92" fill="none" stroke="#F7F7F2" strokeWidth={8} />
            <path d="M36 92L50 64.6L64 92Z" fill="#0FA36B" />
          </svg>
          <div style={{ display: "flex", fontSize: 36, letterSpacing: -1 }}>
            <span style={{ fontWeight: 700 }}>AgriVault</span>
            <span style={{ marginLeft: 10, opacity: 0.6 }}>Data</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, letterSpacing: 4, color: "#C7A56A", textTransform: "uppercase" }}>
            Agricultural systems · Technology · Advisory
          </div>
          <div style={{ fontSize: 68, lineHeight: 1.04, letterSpacing: -2.5, marginTop: 22, maxWidth: 900 }}>
            Building the systems behind stronger agricultural institutions.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
