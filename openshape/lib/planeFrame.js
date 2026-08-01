// Plane frame utilities for OpenShape.
//
// A "frame" rigorously defines a plane in 3D space as an origin plus an
// orthonormal basis: `u` and `v` span the plane (the sketch's local 2D X and Y
// axes) and `w` is the plane normal (the extrusion direction). The standard
// base planes (xy/yz/xz) are just special cases of a frame, which lets the rest
// of the app treat every plane - base, offset, or fully arbitrary - uniformly.
//
// Vectors are plain [x, y, z] arrays so this module has no THREE/JSCAD deps and
// can be used from both the geometry layer and the viewer.

export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
export const length = (a) => Math.hypot(a[0], a[1], a[2]);
export const normalize = (a) => {
  const l = length(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Frame for a standard base plane, optionally offset along its normal.
export const basePlaneFrame = (plane = 'xy', offset = 0) => {
  switch (plane) {
    case 'yz':
      return { origin: [offset, 0, 0], u: [0, 1, 0], v: [0, 0, 1], w: [1, 0, 0] };
    case 'xz':
      return { origin: [0, offset, 0], u: [1, 0, 0], v: [0, 0, 1], w: [0, 1, 0] };
    case 'xy':
    case 'custom':
    default:
      return { origin: [0, 0, offset], u: [1, 0, 0], v: [0, 1, 0], w: [0, 0, 1] };
  }
};

// Build an orthonormal frame from an origin and a normal vector. An optional
// reference direction seeds the in-plane `u` axis; otherwise a stable one is
// chosen automatically.
export const frameFromNormal = (origin = [0, 0, 0], normal = [0, 0, 1], ref = null) => {
  const w = normalize(normal);
  let r = ref;
  if (!r) {
    // Avoid a reference that is (nearly) parallel to the normal.
    r = Math.abs(w[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  }
  let u = cross(r, w);
  if (length(u) < 1e-6) {
    u = cross([1, 0, 0], w);
  }
  u = normalize(u);
  const v = normalize(cross(w, u));
  return { origin: [origin[0], origin[1], origin[2]], u, v, w };
};

// Return a copy of a frame translated along its normal by `distance`.
export const offsetFrame = (frame, distance = 0) => ({
  origin: add(frame.origin, scale(frame.w, distance)),
  u: [...frame.u],
  v: [...frame.v],
  w: [...frame.w]
});

// Column-major 4x4 matrix that maps a local point (a, b, t) to world space:
//   world = origin + a*u + b*v + t*w
// Suitable for JSCAD `transforms.transform`.
export const frameMatrix = (frame) => [
  frame.u[0], frame.u[1], frame.u[2], 0,
  frame.v[0], frame.v[1], frame.v[2], 0,
  frame.w[0], frame.w[1], frame.w[2], 0,
  frame.origin[0], frame.origin[1], frame.origin[2], 1
];

// Map a sketch-local 2D point [a, b] to a world 3D point.
export const to3D = (frame, p2) =>
  add(frame.origin, add(scale(frame.u, p2[0]), scale(frame.v, p2[1])));

// Map a world 3D point to sketch-local 2D coordinates on the frame.
export const to2D = (frame, p3) => {
  const d = sub(p3, frame.origin);
  return [dot(d, frame.u), dot(d, frame.v)];
};
