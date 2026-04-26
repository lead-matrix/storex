'use client';
import React from 'react';

// Approximate lat/lng to SVG coordinates (Mercator-ish, 800x400 viewBox)
function latLngToXY(lat: number, lng: number): [number, number] {
  const x = ((lng + 180) / 360) * 800;
  const y = ((90 - lat) / 180) * 400;
  return [x, y];
}

// Country code → approx lat/lng center
const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [38, -97], GB: [54, -2], DE: [51, 10], FR: [46, 2], JP: [36, 138],
  CN: [35, 105], IN: [22, 78], CA: [56, -96], AU: [-25, 133], BR: [-14, -51],
  RU: [60, 100], KR: [36, 128], IT: [42, 12], ES: [40, -3], MX: [23, -102],
  ID: [-5, 120], NL: [52, 5], SA: [24, 45], TR: [39, 35], SE: [62, 15],
  PL: [52, 20], AR: [-34, -64], ZA: [-29, 25], NG: [9, 8], EG: [27, 30],
  PK: [30, 69], BD: [24, 90], TH: [15, 101], VN: [16, 108], MY: [3, 109],
  PH: [13, 122], AE: [24, 54], NO: [62, 10], DK: [56, 10], FI: [61, 26],
  CH: [47, 8], AT: [47, 14], BE: [50, 4], PT: [39, -8], GR: [39, 22],
  HU: [47, 19], CZ: [50, 15], RO: [46, 25], UA: [49, 32], IL: [31, 35],
  SG: [1, 104], HK: [22, 114], NZ: [-41, 174], CL: [-35, -71], CO: [4, -74],
  PE: [-10, -75], VE: [8, -66], IR: [32, 53], IQ: [33, 44], KW: [29, 48],
  QA: [25, 51], BH: [26, 50], OM: [21, 57], JO: [31, 37], LB: [34, 36],
  MA: [32, -5], TN: [34, 9], DZ: [28, 3], LY: [25, 17], GH: [8, -1],
  KE: [-1, 38], TZ: [-6, 35], ET: [9, 39], SD: [15, 30], UG: [1, 32],
  SN: [14, -14], CI: [8, -5], CM: [6, 12], AO: [-11, 17], MZ: [-18, 35],
  ZW: [-20, 30], ZM: [-15, 28], MG: [-20, 47], MW: [-13, 34], BF: [12, -2],
  LO: [0, 0], XX: [0, 0],
};

interface CountryDot {
  country: string;
  country_code: string;
  count: number;
}

interface WorldMapProps {
  countries: CountryDot[];
  maxCount: number;
}

// Simplified world continent paths (lightweight SVG)
const WORLD_PATH = `
M 70,160 L 80,155 L 95,150 L 110,148 L 120,145 L 130,150 L 140,155 L 145,165 
L 140,175 L 130,180 L 120,178 L 110,175 L 100,178 L 90,180 L 80,175 L 72,168 Z
M 130,148 L 145,140 L 160,135 L 175,132 L 190,135 L 200,140 L 210,148 L 215,158
L 210,168 L 200,172 L 190,175 L 180,172 L 170,175 L 160,178 L 150,175 L 140,170
L 132,162 Z
M 200,200 L 215,195 L 230,195 L 240,200 L 245,210 L 250,225 L 245,240 
L 235,250 L 225,255 L 215,252 L 205,245 L 200,235 L 198,220 Z
M 300,120 L 330,110 L 365,105 L 400,108 L 430,115 L 455,125 L 465,140
L 460,155 L 450,165 L 435,170 L 415,168 L 395,165 L 370,162 L 345,160
L 320,158 L 302,150 L 295,138 Z
M 400,165 L 420,160 L 440,162 L 455,170 L 460,183 L 455,198 L 445,210
L 430,218 L 415,220 L 400,215 L 388,205 L 385,192 L 390,178 Z
M 455,130 L 500,118 L 545,115 L 590,120 L 625,130 L 650,142 L 660,155
L 655,170 L 640,180 L 620,185 L 595,182 L 565,178 L 535,175 L 505,175
L 475,172 L 455,162 L 447,148 Z
M 570,170 L 600,165 L 630,168 L 650,178 L 660,192 L 658,208 L 648,220
L 632,228 L 615,230 L 598,225 L 584,215 L 575,202 L 570,188 Z
M 620,230 L 650,225 L 680,228 L 705,238 L 715,252 L 712,268 L 700,278
L 682,282 L 662,280 L 644,272 L 632,260 L 624,245 Z
M 640,155 L 680,142 L 720,138 L 755,142 L 780,152 L 790,165 L 785,180
L 770,188 L 750,190 L 728,188 L 705,185 L 682,182 L 660,178 L 645,168 Z
`;

export default function WorldMap({ countries, maxCount }: WorldMapProps) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '50%' }}>
      <div className="absolute inset-0">
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full"
          style={{ background: 'transparent' }}
        >
          {/* Grid lines */}
          {[100, 200, 300].map(y => (
            <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          ))}
          {[200, 400, 600].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="400" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          ))}

          {/* Continent blobs — subtle background shapes */}
          {/* North America */}
          <ellipse cx="170" cy="155" rx="90" ry="60" fill="rgba(255,255,255,0.04)" />
          {/* South America */}
          <ellipse cx="225" cy="255" rx="50" ry="70" fill="rgba(255,255,255,0.04)" />
          {/* Europe */}
          <ellipse cx="400" cy="140" rx="60" ry="45" fill="rgba(255,255,255,0.04)" />
          {/* Africa */}
          <ellipse cx="415" cy="230" rx="55" ry="75" fill="rgba(255,255,255,0.04)" />
          {/* Asia */}
          <ellipse cx="580" cy="155" rx="130" ry="80" fill="rgba(255,255,255,0.04)" />
          {/* Oceania */}
          <ellipse cx="685" cy="280" rx="55" ry="35" fill="rgba(255,255,255,0.04)" />

          {/* Country dots */}
          {countries.map((c) => {
            const coords = COUNTRY_COORDS[c.country_code];
            if (!coords) return null;
            const [x, y] = latLngToXY(coords[0], coords[1]);
            const normalized = Math.min(c.count / Math.max(maxCount, 1), 1);
            const radius = 4 + normalized * 16;
            const opacity = 0.4 + normalized * 0.6;

            return (
              <g key={c.country_code}>
                {/* Pulse ring */}
                <circle
                  cx={x} cy={y} r={radius + 4}
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="0.8"
                  opacity={opacity * 0.4}
                />
                {/* Main dot */}
                <circle
                  cx={x} cy={y} r={radius}
                  fill="#D4AF37"
                  opacity={opacity}
                />
                {/* Tooltip on hover via title */}
                <title>{c.country}: {c.count} visitors</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
