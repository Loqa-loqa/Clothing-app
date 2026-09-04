// Parametric SVG body silhouette — deforms based on a "shape" object so the
// user can preview roughly how their own body proportions look, and outfits
// can be laid over it. No external assets, pure SVG shapes.
//
// Drawn in a relaxed "contrapposto" fashion-croquis pose (weight on one leg,
// hip/shoulder counter-tilt, one hand resting on the hip, a bent relaxed
// leg) instead of a stiff straight-on stance, so it reads more like a model
// sketch than a static mannequin.
//
// Supports a front and back view (see the `view` prop) so the profile screen
// can offer a front/back toggle. Both views share the exact same viewBox and
// key y-coordinates as before, so anything anchored on top of the front view
// (like the Outfit Builder's clothing overlays) keeps lining up correctly.
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
// Returns key landmark positions and widths (in the same 240x560 viewBox
// coordinate space the SVG uses) for a given body shape, after applying the
// same height-driven scale transform the silhouette itself uses. Used by the
// Outfit Builder to position clothing photos so they actually track the
// body's proportions (wider hips push the bottoms overlay wider, etc.)
// instead of sitting in a fixed box regardless of the sliders.
export function getPoseMetrics(shape) {
  const s = mergeBodyShape(shape);
  const scale = 0.75 + ((clamp(s.heightCm, 140, 200) - 140) / 60) * 0.5;

  const shoulderW = 78 * (1 + s.shoulders * 0.3) * (1 + s.build * 0.12);
  const chestW = 70 * (1 + s.chest * 0.3) * (1 + s.build * 0.15);
  const waistW = 54 * (1 + s.waist * 0.35) * (1 + s.build * 0.18);
  const hipW = 72 * (1 + s.hips * 0.3) * (1 + s.build * 0.16);

  const cx = 120;
  const yHeadTop = 20, yShoulder = 96, yChest = 150, yWaist = 210, yHip = 250, yFeet = 540;
  // Same pivot transform as the SVG: translate(cx yFeet) scale(scale) translate(-cx -yFeet)
  const ty = (y) => yFeet + scale * (y - yFeet);

  return {
    cx,
    scale,
    yHeadTop: ty(yHeadTop),
    yShoulder: ty(yShoulder),
    yChest: ty(yChest),
    yWaist: ty(yWaist),
    yHip: ty(yHip),
    yFeet,
    shoulderW: shoulderW * scale,
    chestW: chestW * scale,
    waistW: waistW * scale,
    hipW: hipW * scale,
  };
}
// A tapered capsule/limb segment from (xTop,yTop,wTop) to (xBottom,yBottom,wBottom),
// with rounded caps — reads as a soft tapered limb instead of a blocky rectangle.
// Supports xTop !== xBottom so limbs can bend/angle, not just go straight down.
function limbPath(xTop, yTop, wTop, xBottom, yBottom, wBottom) {
  const rTop = wTop / 2;
  const rBottom = wBottom / 2;
  const dx = xBottom - xTop;
  const dy = yBottom - yTop;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Perpendicular unit vector, used to offset the two sides of the limb.
  const px = -dy / len;
  const py = dx / len;
  return `
    M ${xTop - px * rTop} ${yTop - py * rTop}
    A ${rTop} ${rTop} 0 1 1 ${xTop + px * rTop} ${yTop + py * rTop}
    L ${xBottom + px * rBottom} ${yBottom + py * rBottom}
    A ${rBottom} ${rBottom} 0 1 1 ${xBottom - px * rBottom} ${yBottom - py * rBottom}
    Z
  `;
}

export default function BodySilhouette({ shape, style, showGroundLine = true, view = "front" }) {
  const s = mergeBodyShape(shape);
  const isBack = view === "back";
  const scale = 0.75 + ((clamp(s.heightCm, 140, 200) - 140) / 60) * 0.5;

  const shoulderW = 78 * (1 + s.shoulders * 0.3) * (1 + s.build * 0.12);
  const chestW = 70 * (1 + s.chest * 0.3) * (1 + s.build * 0.15);
  const waistW = 54 * (1 + s.waist * 0.35) * (1 + s.build * 0.18);
  const hipW = 72 * (1 + s.hips * 0.3) * (1 + s.build * 0.16);
  const armW = 15 * (1 + s.arms * 0.35) * (1 + s.build * 0.1);
  const legW = 27 * (1 + s.legs * 0.3) * (1 + s.build * 0.12);

  const cx = 120;
  const yHeadTop = 20, yHeadBottom = 74, yNeckBottom = 92, yShoulder = 96,
    yChest = 150, yWaist = 210, yHip = 250, yFeet = 540;
  const armLen = 210;
  const legLen = yFeet - yHip;

  // --- Contrapposto pose: weight on the right leg (viewer's right), left
  // leg relaxed and bent at the knee. Hips tilt one way, shoulders tilt the
  // other, head tilts gently for balance. ---
  const hipDrop = 9;
  const shoulderDrop = 5;
  const yHipR = yHip - hipDrop;   // weight-bearing side, hip rides up
  const yHipL = yHip + hipDrop;   // relaxed side, hip drops
  const yShoulderR = yShoulder + shoulderDrop; // weight side, shoulder dips
  const yShoulderL = yShoulder - shoulderDrop; // relaxed side, shoulder lifts
  const headTilt = -6;

  const torsoPath = `
    M ${cx - shoulderW / 2} ${yShoulderL}
    C ${cx - shoulderW / 2 - 4} ${yShoulderL + 20}, ${cx - chestW / 2 - 4} ${yChest - 20}, ${cx - chestW / 2} ${yChest}
    C ${cx - chestW / 2 - 3} ${yChest + 22}, ${cx - waistW / 2 - 3} ${yWaist - 18}, ${cx - waistW / 2} ${yWaist}
    L ${cx + waistW / 2} ${yWaist}
    C ${cx + waistW / 2 + 3} ${yWaist - 18}, ${cx + chestW / 2 + 3} ${yChest + 22}, ${cx + chestW / 2} ${yChest}
    C ${cx + chestW / 2 + 4} ${yChest - 20}, ${cx + shoulderW / 2 + 4} ${yShoulderR + 20}, ${cx + shoulderW / 2} ${yShoulderR}
    Z
  `;

  // Note: the hip shape itself stays level (yHip) — only the legs attach at
  // slightly different heights underneath it (see yHipL/yHipR below), which
  // reads as a hip tilt without cutting the pelvis silhouette at an angle.
  const hipPath = `
    M ${cx - waistW / 2} ${yWaist}
    C ${cx - waistW / 2 - 6} ${yWaist + 16}, ${cx - hipW / 2 - 2} ${yHip - 22}, ${cx - hipW / 2} ${yHip}
    L ${cx + hipW / 2} ${yHip}
    C ${cx + hipW / 2 + 2} ${yHip - 22}, ${cx + waistW / 2 + 6} ${yWaist + 16}, ${cx + waistW / 2} ${yWaist}
    Z
  `;

  const legCenterOffset = hipW / 4.4;
  const legTopW = legW;
  const legBottomW = legW * 0.58;

  // Right leg: straight, weight-bearing.
  const legRX = cx + legCenterOffset;

  // Left leg: relaxed, bent at the knee, foot stepped outward.
  const legLX = cx - legCenterOffset;
  const kneeX = legLX - 12;
  const kneeY = yHipL + legLen * 0.46;
  const ankleX = legLX - 24;
  const ankleY = yFeet - 6;
  const kneeW = legW * 0.72;

  const armTopW = armW;
  const armBottomW = armW * 0.62;

  // Left arm: relaxed, hangs straight, drifts slightly outward.
  const armLX = cx - shoulderW / 2 - armTopW / 2 + 5;
  const armLHandX = armLX - 6;
  const armLHandY = yShoulderL + 6 + armLen;

  // Right arm: bent gently at the elbow, hand resting near the hip — kept
  // close to the torso silhouette so it reads as resting against the body
  // rather than floating away from it.
  const armRX = cx + shoulderW / 2 + armTopW / 2 - 5;
  const elbowX = armRX - 1;
  const elbowY = yShoulderR + 6 + armLen * 0.52;
  const elbowW = armW * 0.8;
  const handX = cx + hipW / 2 - 6;
  const handY = yWaist + 32;
  const handW = armW * 0.6;

  const fill = COLORS.primaryLight;
  const stroke = COLORS.primary;
  const lineStroke = COLORS.primaryDark;

  const avgShoulder = (yShoulderL + yShoulderR) / 2;
  const avgHip = (yHipL + yHipR) / 2;

  return (
    <svg viewBox="0 0 240 560" style={style} width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
      {showGroundLine && (
        <line x1={26} y1={yFeet + 8} x2={214} y2={yFeet + 8} stroke={COLORS.border} strokeWidth="1.5" />
      )}
      <g transform={`translate(${cx} ${yFeet}) scale(${scale}) translate(${-cx} ${-yFeet})`}>
        <line x1={cx} y1={yHeadTop + 6} x2={cx} y2={yFeet} stroke={COLORS.border} strokeWidth="1" strokeDasharray="2 4" />

        {/* Right leg — straight, weight-bearing */}
        <path
          d={limbPath(legRX, yHipR - 6, legTopW, legRX, yFeet, legBottomW)}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />
        <ellipse cx={legRX} cy={yFeet + 3} rx={legBottomW / 2 + 2} ry={5} fill={fill} stroke={stroke} strokeWidth="1" />

        {/* Left leg — relaxed, bent knee, foot kicked outward */}
        <path
          d={limbPath(legLX, yHipL - 6, legTopW, kneeX, kneeY, kneeW)}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />
        <path
          d={limbPath(kneeX, kneeY, kneeW, ankleX, ankleY, legBottomW)}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />
        <circle cx={kneeX} cy={kneeY} r={kneeW / 2 - 1} fill={fill} stroke={stroke} strokeWidth="1" />
        <ellipse cx={ankleX} cy={ankleY + 5} rx={legBottomW / 2 + 2} ry={5} fill={fill} stroke={stroke} strokeWidth="1" />

        <path d={hipPath} fill={fill} stroke={stroke} strokeWidth="1.2" />
        {isBack ? (
          <>
            <path
              d={`M ${cx - hipW / 4} ${yWaist + 8} Q ${cx - hipW / 6} ${(yWaist + avgHip) / 2} ${cx - hipW / 5} ${yHipL - 6}`}
              fill="none"
              stroke={lineStroke}
              strokeWidth="1"
              opacity="0.5"
            />
            <path
              d={`M ${cx + hipW / 4} ${yWaist + 8} Q ${cx + hipW / 6} ${(yWaist + avgHip) / 2} ${cx + hipW / 5} ${yHipR - 6}`}
              fill="none"
              stroke={lineStroke}
              strokeWidth="1"
              opacity="0.5"
            />
          </>
        ) : null}

        {/* Left arm — relaxed, straight */}
        <path
          d={limbPath(armLX, yShoulderL + 6, armTopW, armLHandX, armLHandY, armBottomW)}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />
        <ellipse cx={armLHandX} cy={armLHandY} rx={armBottomW / 2 + 1.5} ry={7} fill={fill} stroke={stroke} strokeWidth="1" />

        {/* Right arm — bent, hand on hip */}
        <path
          d={limbPath(armRX, yShoulderR + 6, armTopW, elbowX, elbowY, elbowW)}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />
        <path
          d={limbPath(elbowX, elbowY, elbowW, handX, handY, handW)}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />
        <circle cx={elbowX} cy={elbowY} r={elbowW / 2 - 1} fill={fill} stroke={stroke} strokeWidth="1" />
        <ellipse cx={handX} cy={handY} rx={handW / 2 + 1.5} ry={6} fill={fill} stroke={stroke} strokeWidth="1" />

        <path d={torsoPath} fill={fill} stroke={stroke} strokeWidth="1.2" />

        {isBack ? (
          <>
            <path
              d={`M ${cx} ${avgShoulder + 14} Q ${cx - (avgHip - avgShoulder) * 0.08} ${(avgShoulder + yWaist) / 2} ${cx} ${yWaist - 10}`}
              fill="none"
              stroke={lineStroke} strokeWidth="1" opacity="0.45"
            />
            <path
              d={`M ${cx - chestW / 3} ${avgShoulder + 20} Q ${cx - 6} ${avgShoulder + 34} ${cx - chestW / 5} ${yChest - 6}`}
              fill="none" stroke={lineStroke} strokeWidth="1" opacity="0.4"
            />
            <path
              d={`M ${cx + chestW / 3} ${avgShoulder + 20} Q ${cx + 6} ${avgShoulder + 34} ${cx + chestW / 5} ${yChest - 6}`}
              fill="none" stroke={lineStroke} strokeWidth="1" opacity="0.4"
            />
          </>
        ) : (
          <>
            <path
              d={`M ${cx - shoulderW / 4} ${yShoulderL + 10} Q ${cx - 10} ${yShoulderL + 4} ${cx - 2} ${yShoulderL + 14}`}
              fill="none" stroke={lineStroke} strokeWidth="1" opacity="0.45"
            />
            <path
              d={`M ${cx + shoulderW / 4} ${yShoulderR + 10} Q ${cx + 10} ${yShoulderR + 4} ${cx + 2} ${yShoulderR + 14}`}
              fill="none" stroke={lineStroke} strokeWidth="1" opacity="0.45"
            />
            <ellipse cx={cx - chestW / 4} cy={yChest - 6} rx={9} ry={7} fill="none" stroke={lineStroke} strokeWidth="1" opacity="0.4" />
            <ellipse cx={cx + chestW / 4} cy={yChest - 6} rx={9} ry={7} fill="none" stroke={lineStroke} strokeWidth="1" opacity="0.4" />
          </>
        )}

        <g transform={`rotate(${headTilt} ${cx} ${yNeckBottom})`}>
          <rect
            x={cx - 11}
            y={yHeadBottom - 4}
            width={22}
            height={yNeckBottom - yHeadBottom + 4}
            rx={6}
            fill={fill}
            stroke={stroke}
            strokeWidth="1.2"
          />

          <ellipse
            cx={cx}
            cy={(yHeadTop + yHeadBottom) / 2}
            rx={24}
            ry={(yHeadBottom - yHeadTop) / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth="1.2"
          />
          <ellipse cx={cx - 25} cy={(yHeadTop + yHeadBottom) / 2 + 6} rx={3.5} ry={6} fill={fill} stroke={stroke} strokeWidth="1" />
          <ellipse cx={cx + 25} cy={(yHeadTop + yHeadBottom) / 2 + 6} rx={3.5} ry={6} fill={fill} stroke={stroke} strokeWidth="1" />
          {!isBack && (
            <line
              x1={cx} y1={yHeadTop + 6} x2={cx} y2={yHeadBottom - 4}
              stroke={lineStroke} strokeWidth="1" opacity="0.35"
            />
          )}
        </g>
      </g>
    </svg>
  );
}
