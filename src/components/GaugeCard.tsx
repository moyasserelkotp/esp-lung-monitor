"use client";

interface GaugeCardProps {
  title: string;
  subtitle: string;
  value: number;
  min: number;
  max: number;
  target: number;
  unit: string;
  color?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
}

function describeArc(
  cx: number, cy: number, r: number,
  startDeg: number, endDeg: number
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const GAUGE_START_DEG = 135;
const GAUGE_TOTAL_DEG = 270;

export default function GaugeCard({
  title, subtitle, value, min, max, target, unit, color = "var(--cyan-primary)",
  warningThreshold, criticalThreshold,
}: GaugeCardProps) {
  const cx = 80, cy = 80, rTrack = 58;

  const clamped = Math.min(max, Math.max(min, value));
  const fraction = (clamped - min) / (max - min);
  const fillDeg = fraction * GAUGE_TOTAL_DEG;

  const endDeg = GAUGE_START_DEG + fillDeg;
  const valuePath = describeArc(cx, cy, rTrack, GAUGE_START_DEG, endDeg < GAUGE_START_DEG + 1 ? GAUGE_START_DEG + 1 : endDeg);

  let gaugeColor = color;
  if (criticalThreshold !== undefined && value > criticalThreshold) {
    gaugeColor = "var(--red-primary)";
  } else if (warningThreshold !== undefined && value > warningThreshold) {
    gaugeColor = "var(--orange-primary)";
  }

  const targetFrac = (target - min) / (max - min);
  const targetDeg  = GAUGE_START_DEG + targetFrac * GAUGE_TOTAL_DEG;
  const tickToRad  = (targetDeg * Math.PI) / 180;
  const t1x = cx + (rTrack - 8) * Math.cos(tickToRad);
  const t1y = cy + (rTrack - 8) * Math.sin(tickToRad);
  const t2x = cx + (rTrack + 8) * Math.cos(tickToRad);
  const t2y = cy + (rTrack + 8) * Math.sin(tickToRad);

  const displayValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);

  return (
    <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{title}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{subtitle}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '160px', aspectRatio: "160/130", position: "relative" }}>
          <svg
            viewBox={`0 0 ${cx * 2} ${cy + 40}`}
            width="100%" height="100%"
            style={{ overflow: "visible" }}
            aria-label={`${title}: ${displayValue} ${unit}`}
            role="img"
          >
            {/* Background track */}
            <path
              d={describeArc(cx, cy, rTrack, GAUGE_START_DEG, GAUGE_START_DEG + GAUGE_TOTAL_DEG)}
              fill="none"
              stroke="var(--border)"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Value fill arc */}
            <path
              d={describeArc(cx, cy, rTrack, GAUGE_START_DEG, GAUGE_START_DEG + GAUGE_TOTAL_DEG)}
              fill="none"
              stroke={gaugeColor}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={rTrack * Math.PI * (GAUGE_TOTAL_DEG / 180)}
              strokeDashoffset={(1 - Math.max(0.001, fraction)) * (rTrack * Math.PI * (GAUGE_TOTAL_DEG / 180))}
              style={{ 
                filter: `drop-shadow(0 0 6px ${gaugeColor}60)`,
                transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s ease'
              }}
            />

            {/* Target tick */}
            <line
              x1={t1x} y1={t1y} x2={t2x} y2={t2y}
              stroke="var(--text-primary)"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 2px rgba(255,255,255,0.8))" }}
            />
            {/* Small diamond/triangle marker for target */}
            <circle
              cx={t2x + (t2x - t1x)*0.2} cy={t2y + (t2y - t1y)*0.2}
              r="3.5"
              fill="var(--text-primary)"
            />

            {/* Center value */}
            <text x={cx} y={cy + 6} textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--text-primary)" style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-1px" }}>
              {displayValue}
            </text>
            <text x={cx} y={cy + 22} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-muted)" style={{ fontFamily: "Inter, sans-serif" }}>
              {unit}
            </text>
          </svg>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 12px', marginTop: '-10px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-disabled)' }}>{min}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-disabled)' }}>{max}</span>
        </div>
      </div>
    </div>
  );
}
