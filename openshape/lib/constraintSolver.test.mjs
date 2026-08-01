import { solveConstraints, constraintError } from './constraintSolver.mjs';

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
  if (!cond) failures++;
};

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angleBetween = (a1, a2, b1, b2) => {
  const t1 = Math.atan2(a2.y - a1.y, a2.x - a1.x);
  const t2 = Math.atan2(b2.y - b1.y, b2.x - b1.x);
  let d = (t2 - t1) * 180 / Math.PI;
  d = ((d % 180) + 180) % 180; // undirected, [0,180)
  return d > 90 ? 180 - d : d; // [0,90]
};

// Scenario: an L-shape. A fixed at origin. Line AB horizontal + length 10.
// Line BC perpendicular to AB + length 6.
{
  const points = [
    { id: 'A', x: 0, y: 0, fixed: true },
    { id: 'B', x: 9, y: 2 },   // roughly right of A
    { id: 'C', x: 11, y: 7 }   // roughly up from B
  ];
  const constraints = [
    { type: 'horizontal', line: ['A', 'B'] },
    { type: 'distance', line: ['A', 'B'], value: 10 },
    { type: 'perpendicular', line1: ['A', 'B'], line2: ['B', 'C'] },
    { type: 'distance', line: ['B', 'C'], value: 6 }
  ];
  const solved = solveConstraints(points, constraints, { iterations: 800, relax: 0.5 });
  const A = { ...solved.get('A'), id: 'A' };
  const B = { ...solved.get('B'), id: 'B' };
  const C = { ...solved.get('C'), id: 'C' };

  check('A stays fixed at origin', dist(A, { x: 0, y: 0 }) < 1e-6, JSON.stringify(A));
  check('AB is horizontal', Math.abs(A.y - B.y) < 1e-3, `dy=${(A.y - B.y).toFixed(4)}`);
  check('AB length == 10', Math.abs(dist(A, B) - 10) < 1e-3, `len=${dist(A, B).toFixed(4)}`);
  check('BC length == 6', Math.abs(dist(B, C) - 6) < 1e-3, `len=${dist(B, C).toFixed(4)}`);
  const ang = angleBetween(A, B, B, C);
  check('AB perpendicular to BC (~90deg)', Math.abs(ang - 90) < 0.5, `angle=${ang.toFixed(3)}`);

  const resid = constraintError([A, B, C], constraints);
  check('residual error near zero', resid < 1e-4, `err=${resid.toExponential(2)}`);
}

// Scenario: parallel + equal.
{
  const points = [
    { id: 'A', x: 0, y: 0, fixed: true },
    { id: 'B', x: 10, y: 0, fixed: true },
    { id: 'C', x: 1, y: 5 },
    { id: 'D', x: 8, y: 6 }
  ];
  const constraints = [
    { type: 'parallel', line1: ['A', 'B'], line2: ['C', 'D'] },
    { type: 'equal', line1: ['A', 'B'], line2: ['C', 'D'] }
  ];
  const solved = solveConstraints(points, constraints, { iterations: 800, relax: 0.5 });
  const A = solved.get('A');
  const B = solved.get('B');
  const C = solved.get('C');
  const D = solved.get('D');
  const ang = angleBetween(A, B, C, D);
  check('CD parallel to AB (~0deg)', ang < 0.5, `angle=${ang.toFixed(3)}`);
  check('CD length == AB length (10)', Math.abs(dist(C, D) - dist(A, B)) < 1e-2, `AB=${dist(A, B).toFixed(3)} CD=${dist(C, D).toFixed(3)}`);
}

// Scenario: coincident merges two points.
{
  const points = [
    { id: 'A', x: 0, y: 0, fixed: true },
    { id: 'B', x: 3, y: 4 }
  ];
  const constraints = [{ type: 'coincident', a: 'A', b: 'B' }];
  const solved = solveConstraints(points, constraints, { iterations: 200, relax: 1 });
  check('B coincident with fixed A', dist(solved.get('A'), solved.get('B')) < 1e-6);
}

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
