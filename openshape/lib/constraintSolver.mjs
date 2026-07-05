// Iterative 2D sketch constraint solver for OpenShape.
//
// A lightweight geometric constraint solver based on position/angle projection
// (relaxation). It adjusts free point coordinates so a set of geometric
// relations - coincident, horizontal, vertical, parallel, perpendicular, equal
// length, and distance/dimension - are satisfied. Points flagged `fixed` never
// move, anchoring the sketch.
//
// This module is intentionally dependency-free (plain [x, y] math) so it can be
// unit-tested in isolation and reused by the geometry layer.

const EPS = 1e-9;

const rotateAround = (p, pivot, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const dx = p.x - pivot.x;
  const dy = p.y - pivot.y;
  p.x = pivot.x + dx * c - dy * s;
  p.y = pivot.y + dx * s + dy * c;
};

// Rotate a line (defined by two point objects) by `angle` about a pivot that
// respects fixed endpoints (rotate about a fixed endpoint, else the midpoint).
const rotateLine = (p1, p2, angle) => {
  if (p1.fixed && p2.fixed) return;
  let pivot;
  if (p1.fixed) pivot = { x: p1.x, y: p1.y };
  else if (p2.fixed) pivot = { x: p2.x, y: p2.y };
  else pivot = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  if (!p1.fixed) rotateAround(p1, pivot, angle);
  if (!p2.fixed) rotateAround(p2, pivot, angle);
};

const lineAngle = (p1, p2) => Math.atan2(p2.y - p1.y, p2.x - p1.x);
const lineLength = (p1, p2) => Math.hypot(p2.x - p1.x, p2.y - p1.y);

// Wrap an angle to (-limit, limit].
const wrap = (a, limit) => {
  const period = 2 * limit;
  let r = a % period;
  if (r > limit) r -= period;
  if (r <= -limit) r += period;
  return r;
};

// Move a coordinate of two points toward a shared target, respecting fixed.
const equalizeCoord = (p1, p2, axis, relax) => {
  const f1 = p1.fixed;
  const f2 = p2.fixed;
  if (f1 && f2) return;
  let target;
  if (f1) target = p1[axis];
  else if (f2) target = p2[axis];
  else target = (p1[axis] + p2[axis]) / 2;
  if (!f1) p1[axis] += (target - p1[axis]) * relax;
  if (!f2) p2[axis] += (target - p2[axis]) * relax;
};

// Set the distance between two points to `target`, moving along the line.
const applyDistance = (p1, p2, target, relax) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let len = Math.hypot(dx, dy);
  let ux;
  let uy;
  if (len < EPS) {
    ux = 1;
    uy = 0;
    len = 0;
  } else {
    ux = dx / len;
    uy = dy / len;
  }
  const diff = (target - len) * relax;
  if (p1.fixed && p2.fixed) return;
  if (p1.fixed) {
    p2.x = p1.x + ux * (len + diff);
    p2.y = p1.y + uy * (len + diff);
  } else if (p2.fixed) {
    p1.x = p2.x - ux * (len + diff);
    p1.y = p2.y - uy * (len + diff);
  } else {
    const half = diff / 2;
    p1.x -= ux * half;
    p1.y -= uy * half;
    p2.x += ux * half;
    p2.y += uy * half;
  }
};

// Rotate two lines toward a target relative angle (0 for parallel, PI/2 for
// perpendicular), treating lines as undirected.
const applyAngle = (a1, a2, b1, b2, targetRel, relax) => {
  const ang1 = lineAngle(a1, a2);
  const ang2 = lineAngle(b1, b2);
  // Current signed relative angle folded to (-PI/2, PI/2] (undirected lines).
  const rel = wrap(ang2 - ang1, Math.PI / 2);
  const target = wrap(targetRel, Math.PI / 2);
  const err = wrap(rel - target, Math.PI / 2);
  // Distribute the correction between the two lines.
  rotateLine(a1, a2, +err / 2 * relax);
  rotateLine(b1, b2, -err / 2 * relax);
};

export function solveConstraints(inputPoints, constraints, options = {}) {
  const iterations = options.iterations || 400;
  const relax = options.relax || 0.5;

  // Working copy keyed by id.
  const pts = new Map();
  for (const p of inputPoints) {
    pts.set(p.id, { id: p.id, x: p.x, y: p.y, fixed: !!p.fixed });
  }

  const P = (id) => pts.get(id);

  for (let iter = 0; iter < iterations; iter++) {
    for (const c of constraints) {
      switch (c.type) {
        case 'coincident': {
          const a = P(c.a);
          const b = P(c.b);
          if (!a || !b) break;
          equalizeCoord(a, b, 'x', relax);
          equalizeCoord(a, b, 'y', relax);
          break;
        }
        case 'horizontal': {
          const [i, j] = c.line;
          const a = P(i);
          const b = P(j);
          if (a && b) equalizeCoord(a, b, 'y', relax);
          break;
        }
        case 'vertical': {
          const [i, j] = c.line;
          const a = P(i);
          const b = P(j);
          if (a && b) equalizeCoord(a, b, 'x', relax);
          break;
        }
        case 'distance':
        case 'length': {
          const [i, j] = c.line;
          const a = P(i);
          const b = P(j);
          if (a && b && typeof c.value === 'number') applyDistance(a, b, c.value, relax);
          break;
        }
        case 'equal': {
          const a1 = P(c.line1[0]);
          const a2 = P(c.line1[1]);
          const b1 = P(c.line2[0]);
          const b2 = P(c.line2[1]);
          if (a1 && a2 && b1 && b2) {
            const avg = (lineLength(a1, a2) + lineLength(b1, b2)) / 2;
            applyDistance(a1, a2, avg, relax);
            applyDistance(b1, b2, avg, relax);
          }
          break;
        }
        case 'parallel': {
          const a1 = P(c.line1[0]);
          const a2 = P(c.line1[1]);
          const b1 = P(c.line2[0]);
          const b2 = P(c.line2[1]);
          if (a1 && a2 && b1 && b2) applyAngle(a1, a2, b1, b2, 0, relax);
          break;
        }
        case 'perpendicular': {
          const a1 = P(c.line1[0]);
          const a2 = P(c.line1[1]);
          const b1 = P(c.line2[0]);
          const b2 = P(c.line2[1]);
          if (a1 && a2 && b1 && b2) applyAngle(a1, a2, b1, b2, Math.PI / 2, relax);
          break;
        }
        default:
          break;
      }
    }
  }

  const result = new Map();
  for (const [id, p] of pts) {
    result.set(id, { x: p.x, y: p.y });
  }
  return result;
}

// Measure the residual error of a constraint set (for diagnostics/tests).
export function constraintError(inputPoints, constraints) {
  const pts = new Map();
  for (const p of inputPoints) pts.set(p.id, p);
  const P = (id) => pts.get(id);
  let err = 0;
  for (const c of constraints) {
    switch (c.type) {
      case 'coincident': {
        const a = P(c.a);
        const b = P(c.b);
        err += (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        break;
      }
      case 'horizontal': {
        const a = P(c.line[0]);
        const b = P(c.line[1]);
        err += (a.y - b.y) ** 2;
        break;
      }
      case 'vertical': {
        const a = P(c.line[0]);
        const b = P(c.line[1]);
        err += (a.x - b.x) ** 2;
        break;
      }
      case 'distance':
      case 'length': {
        const a = P(c.line[0]);
        const b = P(c.line[1]);
        err += (lineLength(a, b) - c.value) ** 2;
        break;
      }
      case 'equal': {
        const l1 = lineLength(P(c.line1[0]), P(c.line1[1]));
        const l2 = lineLength(P(c.line2[0]), P(c.line2[1]));
        err += (l1 - l2) ** 2;
        break;
      }
      case 'parallel': {
        const a1 = P(c.line1[0]);
        const a2 = P(c.line1[1]);
        const b1 = P(c.line2[0]);
        const b2 = P(c.line2[1]);
        const rel = wrap(lineAngle(b1, b2) - lineAngle(a1, a2), Math.PI / 2);
        err += rel ** 2;
        break;
      }
      case 'perpendicular': {
        const a1 = P(c.line1[0]);
        const a2 = P(c.line1[1]);
        const b1 = P(c.line2[0]);
        const b2 = P(c.line2[1]);
        const rel = wrap(lineAngle(b1, b2) - lineAngle(a1, a2) - Math.PI / 2, Math.PI / 2);
        err += rel ** 2;
        break;
      }
      default:
        break;
    }
  }
  return err;
}
