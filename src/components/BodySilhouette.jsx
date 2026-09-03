/ Parametric SVG body silhouette — deforms based on a "shape" object so the
// user can preview roughly how their own body proportions look, and outfits
// can be laid over it. No external assets, pure SVG shapes.
import { COLORS } from "../shared.js";

export const DEFAULT_BODY_SHAPE = {
  heightCm: 170,
  build: 0,       // -1 (slank) .. 1 (stevig) — overall scale
  shoulders: 0,   // -0.3 .. 0.3
  chest: 0,
  waist: 0,
  hips: 0,
  arms: 0,
  legs: 0,
};

export function mergeBodyShape(bodyShape) {
  return { ...DEFAULT_BODY_SHAPE, ...(bodyShape || {}) };
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export default function BodySilhouette({ shape, style, showGroundLine = true }) {
  const s = mergeBodyShape(shape);
  const scale = 0.75 + ((clamp(s.heightCm, 140, 200) - 140) / 60) * 0.5;

  const shoulderW = 78 * (1 + s.shoulders * 0.3) * (1 + s.build * 0.12);
  const chestW = 70 * (1 + s.chest * 0.3) * (1 + s.build * 0.15);
  const waistW = 54 * (1 + s.waist * 0.35) * (1 + s.build * 0.18);
  const hipW = 72 * (1 + s.hips * 0.3) * (1 + s.build * 0.16);
  const armW = 17 * (1 + s.arms * 0.35) * (1 + s.build * 0.1);
  const legW = 30 * (1 + s.legs * 0.3) * (1 + s.build * 0.12);

  const cx = 120;
  const yHeadTop = 20, yHeadBottom = 74, yNeckBottom = 92, yShoulder = 96,
    yChest = 150, yWaist = 210, yHip = 250, yFeet = 540;
  const legGap = 8;
  const legLen = yFeet - yHip;

  const torsoPath = `
    M ${cx - shoulderW / 2} ${yShoulder}
    C ${cx - shoulderW / 2 - 4} ${yShoulder + 20}, ${cx - chestW / 2 - 4} ${yChest - 20}, ${cx - chestW / 2} ${yChest}
    L ${cx - waistW / 2} ${yWaist}
    L ${cx + waistW / 2} ${yWaist}
    L ${cx + chestW / 2} ${yChest}
    C ${cx + chestW / 2 + 4} ${yChest - 20}, ${cx + shoulderW / 2 + 4} ${yShoulder + 20}, ${cx + shoulderW / 2} ${yShoulder}
    Z
  `;

  const hipPath = `
    M ${cx - waistW / 2} ${yWaist}
    L ${cx - hipW / 2} ${yHip}
    L ${cx + hipW / 2} ${yHip}
    L ${cx + waistW / 2} ${yWaist}
    Z
  `;

  const fill = COLORS.primaryLight;
  const stroke = COLORS.primary;

  return (
    <svg viewBox="0 0 240 560" style={style} width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
      {showGroundLine && (
        <line x1={26} y1={yFeet + 8} x2={214} y2={yFeet + 8} stroke={COLORS.border} strokeWidth="1.5" />
      )}
      <g transform={`translate(${cx} ${yFeet}) scale(${scale}) translate(${-cx} ${-yFeet})`}>
        <rect
          x={cx - hipW / 2}
          y={yHip - 4}
          width={legW}
          height={legLen}
          rx={legW / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />
        <rect
          x={cx + hipW / 2 - legW}
          y={yHip - 4}
          width={legW}
          height={legLen}
          rx={legW / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />

        <path d={hipPath} fill={fill} stroke={stroke} strokeWidth="1.2" />

        <rect
          x={cx - shoulderW / 2 - armW + 4}
          y={yShoulder + 4}
          width={armW}
          height={210}
          rx={armW / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />
        <rect
          x={cx + shoulderW / 2 - 4}
          y={yShoulder + 4}
          width={armW}
          height={210}
          rx={armW / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />

        <path d={torsoPath} fill={fill} stroke={stroke} strokeWidth="1.2" />

        <rect
          x={cx - 12}
          y={yHeadBottom - 4}
          width={24}
          height={yNeckBottom - yHeadBottom + 4}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />

        <ellipse
          cx={cx}
          cy={(yHeadTop + yHeadBottom) / 2}
          rx={26}
          ry={(yHeadBottom - yHeadTop) / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />
      </g>
    </svg>
  );
}
