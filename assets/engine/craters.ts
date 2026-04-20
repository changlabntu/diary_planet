import { applyMat3, sphericalToCartesian, type Mat3, type Vec3 } from './rotationMatrix';

export interface CraterDef {
  phi: number;
  theta: number;
  r: number;
}

export interface ProjectedCrater {
  screenX: number;
  screenY: number;
  radiusSquashed: number;
  radiusFull: number;
  radialAngle: number;
  facing: number;
  z: number;
}

export const CRATER_DEFS: CraterDef[] = [
  { phi: 0.3,  theta: 1.2,  r: 0.12 },
  { phi: -0.5, theta: 0.9,  r: 0.08 },
  { phi: 1.0,  theta: 1.5,  r: 0.10 },
  { phi: -1.2, theta: 1.1,  r: 0.06 },
  { phi: 0.7,  theta: 0.6,  r: 0.09 },
  { phi: -0.3, theta: 1.8,  r: 0.07 },
  { phi: 1.5,  theta: 1.0,  r: 0.11 },
  { phi: -1.0, theta: 1.4,  r: 0.05 },
  { phi: 0.0,  theta: 0.5,  r: 0.08 },
  { phi: 2.0,  theta: 1.3,  r: 0.07 },
  { phi: -1.8, theta: 0.8,  r: 0.09 },
  { phi: 0.5,  theta: 2.0,  r: 0.06 },
  { phi: -0.8, theta: 0.4,  r: 0.10 },
  { phi: 1.3,  theta: 1.8,  r: 0.05 },
  { phi: -2.2, theta: 1.2,  r: 0.08 },
  { phi: 0.9,  theta: 0.3,  r: 0.06 },
  { phi: -0.1, theta: 1.6,  r: 0.13 },
  { phi: 2.5,  theta: 1.1,  r: 0.07 },
  { phi: -1.5, theta: 1.7,  r: 0.04 },
  { phi: 0.4,  theta: 2.5,  r: 0.06 },
];

const BASE_POSITIONS: Vec3[] = CRATER_DEFS.map((c) =>
  sphericalToCartesian(c.phi, c.theta),
);

export function projectCraters(
  matrix: Mat3,
  centerX: number,
  centerY: number,
  moonR: number,
): ProjectedCrater[] {
  const result: ProjectedCrater[] = [];

  for (let i = 0; i < BASE_POSITIONS.length; i++) {
    const rotated = applyMat3(matrix, BASE_POSITIONS[i]);

    if (rotated.z < -0.05) continue;

    const screenX = centerX + rotated.x * moonR;
    const screenY = centerY - rotated.y * moonR;
    const facing = Math.max(rotated.z, 0.05);
    const radialAngle = Math.atan2(screenY - centerY, screenX - centerX);
    const scale = moonR;
    const r = CRATER_DEFS[i].r;

    result.push({
      screenX,
      screenY,
      radiusSquashed: r * scale * facing,
      radiusFull: r * scale,
      radialAngle,
      facing,
      z: rotated.z,
    });
  }

  result.sort((a, b) => a.z - b.z);
  return result;
}
