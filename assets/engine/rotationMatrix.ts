/** 3×3 matrix as flat 9-element row-major array */
export type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number,
];

export type Vec3 = { x: number; y: number; z: number };

export const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function mulMat3(a: Mat3, b: Mat3): Mat3 {
  return [
    a[0]*b[0] + a[1]*b[3] + a[2]*b[6],
    a[0]*b[1] + a[1]*b[4] + a[2]*b[7],
    a[0]*b[2] + a[1]*b[5] + a[2]*b[8],

    a[3]*b[0] + a[4]*b[3] + a[5]*b[6],
    a[3]*b[1] + a[4]*b[4] + a[5]*b[7],
    a[3]*b[2] + a[4]*b[5] + a[5]*b[8],

    a[6]*b[0] + a[7]*b[3] + a[8]*b[6],
    a[6]*b[1] + a[7]*b[4] + a[8]*b[7],
    a[6]*b[2] + a[7]*b[5] + a[8]*b[8],
  ];
}

export function applyMat3(m: Mat3, v: Vec3): Vec3 {
  return {
    x: m[0]*v.x + m[1]*v.y + m[2]*v.z,
    y: m[3]*v.x + m[4]*v.y + m[5]*v.z,
    z: m[6]*v.x + m[7]*v.y + m[8]*v.z,
  };
}

export function makeRotX(angle: number): Mat3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}

export function makeRotY(angle: number): Mat3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

export function applyDragRotation(
  current: Mat3,
  dx: number,
  dy: number,
  sensitivity: number,
): Mat3 {
  const ry = makeRotY(dx * sensitivity);
  const rx = makeRotX(dy * sensitivity);
  return mulMat3(ry, mulMat3(rx, current));
}

export function sphericalToCartesian(phi: number, theta: number): Vec3 {
  return {
    x: Math.sin(theta) * Math.cos(phi),
    y: Math.cos(theta),
    z: Math.sin(theta) * Math.sin(phi),
  };
}
