/** Approximate relative positions for national situational map (SVG viewBox 0–320 × 0–200). */
export type LiberiaCountyPlot = {
  code: string;
  name: string;
  cx: number;
  cy: number;
  /** Base radius in SVG units */
  r: number;
};

export const LIBERIA_COUNTY_PLOTS: LiberiaCountyPlot[] = [
  { code: "MY", name: "Maryland", cx: 270, cy: 175, r: 11 },
  { code: "GK", name: "Grand Kru", cx: 248, cy: 162, r: 9 },
  { code: "RG", name: "River Gee", cx: 238, cy: 148, r: 8 },
  { code: "GG", name: "Grand Gedeh", cx: 248, cy: 118, r: 12 },
  { code: "NI", name: "Nimba", cx: 228, cy: 72, r: 18 },
  { code: "BO", name: "Bong", cx: 175, cy: 58, r: 13 },
  { code: "LO", name: "Lofa", cx: 95, cy: 52, r: 15 },
  { code: "GP", name: "Gbarpolu", cx: 72, cy: 68, r: 10 },
  { code: "GC", name: "Grand Cape Mount", cx: 48, cy: 88, r: 11 },
  { code: "BM", name: "Bomi", cx: 78, cy: 98, r: 9 },
  { code: "MG", name: "Margibi", cx: 112, cy: 102, r: 10 },
  { code: "MO", name: "Montserrado", cx: 132, cy: 112, r: 14 },
  { code: "GB", name: "Grand Bassa", cx: 178, cy: 118, r: 13 },
  { code: "RI", name: "Rivercess", cx: 178, cy: 148, r: 11 },
  { code: "SI", name: "Sinoe", cx: 212, cy: 158, r: 13 },
];
