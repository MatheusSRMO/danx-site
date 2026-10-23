import * as THREE from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

/** Contorno no plano x/z. O raio em planta independe da espessura da chapa. */
export function roundedOutline(w: number, d: number, r: number) {
  const s = new THREE.Shape();
  const x = w / 2, z = d / 2;
  r = Math.min(r, x, z);
  s.moveTo(-x + r, -z);
  s.lineTo(x - r, -z);
  s.absarc(x - r, -z + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x, z - r);
  s.absarc(x - r, z - r, r, 0, Math.PI / 2, false);
  s.lineTo(-x + r, z);
  s.absarc(-x + r, z - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-x, -z + r);
  s.absarc(-x + r, -z + r, r, Math.PI, Math.PI * 1.5, false);
  s.closePath();
  return s;
}

/** Superfície superior em y=0, espessura para baixo; dimensões incluem o bisel. */
export function slabGeometry(w: number, d: number, r: number, h: number, bevel = 0.001) {
  const g = new THREE.ExtrudeGeometry(roundedOutline(w - 2 * bevel, d - 2 * bevel, r - bevel), {
    depth: h - 2 * bevel,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 12,
  });
  g.rotateX(Math.PI / 2);
  g.translate(0, -bevel, 0);
  // Normais analíticas evitam faixas verticais nos cantos arredondados do alumínio.
  const p = g.getAttribute("position"), n = g.getAttribute("normal");
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const ny = y > -bevel ? (y + bevel) / bevel : y < -h + bevel ? (y + h - bevel) / bevel : 0;
    const vertical = THREE.MathUtils.clamp(ny, -1, 1);
    const horizontal = Math.sqrt(1 - vertical * vertical);
    const x = p.getX(i), z = p.getZ(i);
    const nx = x - THREE.MathUtils.clamp(x, -w / 2 + r, w / 2 - r);
    const nz = z - THREE.MathUtils.clamp(z, -d / 2 + r, d / 2 - r);
    const length = Math.hypot(nx, nz) || 1;
    n.setXYZ(i, nx / length * horizontal, vertical, nz / length * horizontal);
  }
  return g;
}

/** Moldura vazada sob o vidro: o centro deixa aparecer o tampo através da chapa. */
export function roundedFrameGeometry(w: number, d: number, r: number, border: number, h: number) {
  const shape = roundedOutline(w, d, r);
  shape.holes.push(new THREE.Path(roundedOutline(w - 2 * border, d - 2 * border, r - border).getPoints(12)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 12 });
  g.rotateX(Math.PI / 2);
  return g;
}

/** Cavidade cega por baixo: mantém o tampo inteiro e as dimensões externas da placa. */
export function sensorPlateGeometry(
  w: number, d: number, r: number, h: number, bevel: number,
  sensorZ: number, recessDepth: number, through = false,
) {
  const slab = slabGeometry(w, d, r, h, bevel);
  const p = slab.getAttribute("position"), n = slab.getAttribute("normal");
  const positions: number[][] = [[], []], normals: number[][] = [[], []];
  for (const group of slab.groups) {
    const material = group.materialIndex ?? 0;
    for (let i = group.start; i < group.start + group.count; i += 3) {
      if ([0, 1, 2].every((j) => Math.abs(p.getY(i + j) + h) < 1e-6)) continue;
      // A chapa inferior é vazada; o teto da cavidade pertence só à placa principal.
      if (through && [0, 1, 2].every((j) => Math.abs(p.getY(i + j)) < 1e-6)) continue;
      for (let j = i; j < i + 3; j++) {
        positions[material].push(p.getX(j), p.getY(j), p.getZ(j));
        normals[material].push(n.getX(j), n.getY(j), n.getZ(j));
      }
    }
  }
  const contour = roundedOutline(w - 2 * bevel, d - 2 * bevel, r - bevel).getPoints(12);
  contour.pop();
  const radius = 0.0145, segments = 48;
  const hole = Array.from({ length: segments }, (_, i) => {
    const a = -i / segments * Math.PI * 2;
    return new THREE.Vector2(Math.cos(a) * radius, sensorZ + Math.sin(a) * radius);
  });
  const points = [...contour, ...hole];
  for (const face of THREE.ShapeUtils.triangulateShape(contour, [hole])) {
    for (const i of face) {
      positions[0].push(points[i].x, -h, points[i].y);
      normals[0].push(0, -1, 0);
    }
  }
  const ceiling = through ? 0 : -h + recessDepth;
  for (let i = 0; i < segments; i++) {
    const a = hole[i], b = hole[(i + 1) % segments];
    for (const [point, y] of [[a, -h], [a, ceiling], [b, -h], [b, -h], [a, ceiling], [b, ceiling]] as const) {
      positions[0].push(point.x, y, point.y);
      normals[0].push(-point.x / radius, 0, -(point.y - sensorZ) / radius);
    }
    if (!through) {
      for (const point of [a, new THREE.Vector2(0, sensorZ), b]) {
        positions[0].push(point.x, ceiling, point.y);
        normals[0].push(0, -1, 0);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions.flat(), 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals.flat(), 3));
  g.addGroup(0, positions[0].length / 3, 0);
  g.addGroup(positions[0].length / 3, positions[1].length / 3, 1);
  slab.dispose();
  return g;
}

/** Mantém as faces ópticas planas, suavizando apenas os biséis e o perímetro. */
function flatPlateNormals(g: THREE.BufferGeometry, h: number) {
  const smooth = toCreasedNormals(g, Math.PI / 3);
  const p = smooth.getAttribute("position"), n = smooth.getAttribute("normal");
  for (let i = 0; i < p.count; i++) {
    if (Math.abs(p.getY(i)) < 1e-6) n.setXYZ(i, 0, 1, 0);
    else if (Math.abs(p.getY(i) + h) < 1e-6) n.setXYZ(i, 0, -1, 0);
  }
  return smooth;
}

/** Dedos: ponta elíptica junto à torre. Calcanhar: meia-elipse, corte reto junto aos dedos. */
export function electrodeGeometry(w: number, d: number, heel: boolean) {
  const b = 0.0004;
  const x = w / 2 - b, z = d / 2 - b;
  const s = new THREE.Shape();
  if (heel) {
    s.moveTo(-x, -z);
    s.lineTo(x, -z);
    s.bezierCurveTo(x, -z + d * 0.55228475, x * 0.55228475, z, 0, z);
    s.bezierCurveTo(-x * 0.55228475, z, -x, -z + d * 0.55228475, -x, -z);
  } else {
    const shoulder = -z + d * 0.30;
    s.moveTo(-x, z);
    s.lineTo(-x, shoulder);
    s.bezierCurveTo(-x, shoulder - d * 0.30 * 0.55228475, -x * 0.55228475, -z, 0, -z);
    s.bezierCurveTo(x * 0.55228475, -z, x, shoulder - d * 0.30 * 0.55228475, x, shoulder);
    s.lineTo(x, z);
    s.lineTo(-x, z);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.0012, bevelEnabled: true, bevelSize: b, bevelThickness: b,
    bevelSegments: 2, curveSegments: 20,
  });
  g.rotateX(Math.PI / 2);
  g.translate(0, -b, 0);
  return flatPlateNormals(g, 0.002);
}

/** Cunha trapezoidal: faces planas e arestas com raio de 2 mm, inclusive nos ombros. */
export function fairingGeometry(baseY: number, topWidth: number) {
  const radius = 0.002, height = 0.038;
  // O núcleo recuado recebe faces, cilindros nas arestas e esferas nos vértices.
  // Assim, os biséis não suavizam as normais das faces grandes nem mudam o envelope.
  const vertices: THREE.Vector3[] = [];
  for (let y = 0; y < 2; y++) {
    const halfWidth = (y ? topWidth : 0.478) / 2 - radius;
    const back = (y ? -0.067 : -0.145) + radius;
    const front = (y ? 0.042 : 0.120) - radius;
    for (let z = 0; z < 2; z++) for (let x = 0; x < 2; x++) {
      vertices.push(new THREE.Vector3(x ? halfWidth : -halfWidth,
        baseY + (y ? height - radius : radius), z ? front : back));
    }
  }
  const faces = [
    { ids: [0, 2, 6, 4], material: 1 }, // alumínio nas duas pontas
    { ids: [1, 5, 7, 3], material: 1 },
    { ids: [0, 4, 5, 1], material: 0 }, // bronze: traseira, frente, fundo e topo
    { ids: [2, 3, 7, 6], material: 0 },
    { ids: [0, 1, 3, 2], material: 0 },
    { ids: [4, 6, 7, 5], material: 0 },
  ].map((f) => {
    const [a, b, c] = f.ids.map((i) => vertices[i]);
    const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    return { ...f, normal };
  });
  const positions: number[][] = [[], []], normals: number[][] = [[], []];
  const triangle = (points: THREE.Vector3[], ns: THREE.Vector3[], material: number) => {
    const cross = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
    const order = cross.dot(ns[0]) < 0 ? [0, 2, 1] : [0, 1, 2];
    for (const i of order) {
      positions[material].push(points[i].x, points[i].y, points[i].z);
      normals[material].push(ns[i].x, ns[i].y, ns[i].z);
    }
  };
  const offset = (vertex: THREE.Vector3, normal: THREE.Vector3) => vertex.clone().addScaledVector(normal, radius);
  for (const f of faces) {
    const p = f.ids.map((i) => offset(vertices[i], f.normal));
    triangle([p[0], p[1], p[2]], [f.normal, f.normal, f.normal], f.material);
    triangle([p[0], p[2], p[3]], [f.normal, f.normal, f.normal], f.material);
  }
  const segments = 6;
  for (let i = 0; i < faces.length; i++) for (let j = i + 1; j < faces.length; j++) {
    const a = faces[i], b = faces[j];
    const edge = a.ids.filter((id) => b.ids.includes(id));
    if (edge.length !== 2) continue;
    const [v0, v1] = edge.map((id) => vertices[id]);
    for (let k = 0; k < segments; k++) {
      const n0 = a.normal.clone().lerp(b.normal, k / segments).normalize();
      const n1 = a.normal.clone().lerp(b.normal, (k + 1) / segments).normalize();
      const p = [offset(v0, n0), offset(v1, n0), offset(v0, n1), offset(v1, n1)];
      const material = k < segments / 2 ? a.material : b.material;
      triangle([p[0], p[1], p[2]], [n0, n0, n1], material);
      triangle([p[1], p[3], p[2]], [n0, n1, n1], material);
    }
  }
  for (let i = 0; i < vertices.length; i++) {
    const adjacent = faces.filter((f) => f.ids.includes(i));
    const [a, b, c] = adjacent.map((f) => f.normal);
    const normalAt = (u: number, v: number) => a.clone().multiplyScalar(1 - (u + v) / segments)
      .addScaledVector(b, u / segments).addScaledVector(c, v / segments).normalize();
    const patch = (ns: THREE.Vector3[]) => {
      const middle = ns[0].clone().add(ns[1]).add(ns[2]).normalize();
      const closest = adjacent.reduce((best, face) => face.normal.dot(middle) > best.normal.dot(middle) ? face : best);
      triangle(ns.map((n) => offset(vertices[i], n)), ns, closest.material);
    };
    for (let u = 0; u < segments; u++) for (let v = 0; v < segments - u; v++) {
      patch([normalAt(u, v), normalAt(u + 1, v), normalAt(u, v + 1)]);
      if (u + v < segments - 1) patch([normalAt(u + 1, v), normalAt(u + 1, v + 1), normalAt(u, v + 1)]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions.flat(), 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals.flat(), 3));
  g.addGroup(0, positions[0].length / 3, 0);
  g.addGroup(positions[0].length / 3, positions[1].length / 3, 1);
  return g;
}

/** Seção lateral contínua; o degrau traseiro tem uma pequena rampa de concordância. */
export function towerBodyGeometry(w: number, bottom: number, top: number, step: number) {
  const s = new THREE.Shape();
  s.moveTo(0.025, bottom + 0.004);
  s.lineTo(0.025, top - 0.004);
  s.lineTo(-0.035, top - 0.004);
  s.lineTo(-0.035, step + 0.024);
  s.quadraticCurveTo(-0.035, step + 0.018, -0.043, step + 0.013);
  s.lineTo(-0.059, step);
  s.lineTo(-0.059, bottom + 0.004);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: w - 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004,
    bevelSegments: 3, curveSegments: 10,
  });
  g.rotateY(-Math.PI / 2);
  g.translate(w / 2 - 0.004, 0, 0);
  return toCreasedNormals(g, Math.PI / 3);
}

/** Tubo circular: montante paralelo, cotovelo tangente e trecho reto com pequena queda frontal. */
export function canopyBarGeometry(
  side: number,
  c: { x: number; z: number; diameter: number; rise: number; top: number; r: number; plateZ0: number; pitch: number },
  bottom: number,
) {
  const start = bottom - 0.025;
  const pitchAngle = Math.atan(c.pitch);
  // Pontos e tangentes analíticos, incluindo exatamente o ápice de 2,100 m.
  const path: { y: number; z: number; ty: number; tz: number }[] = [];
  for (let i = 0; i <= 12; i++) {
    path.push({ y: THREE.MathUtils.lerp(start, c.rise, i / 12), z: c.z, ty: 1, tz: 0 });
  }
  const arcPoint = (a: number) => ({
    y: c.rise + Math.sin(a) * c.r, z: c.z + c.r * (1 - Math.cos(a)),
    ty: Math.cos(a), tz: Math.sin(a),
  });
  for (let i = 1; i <= 48; i++) path.push(arcPoint(i / 48 * Math.PI / 2));
  const end = arcPoint(Math.PI / 2 + pitchAngle);
  if (pitchAngle !== 0) path.push(end);
  for (let i = 1; i <= 24; i++) {
    const z = THREE.MathUtils.lerp(end.z, c.plateZ0 + 0.035, i / 24);
    path.push({ y: end.y - (z - end.z) * c.pitch, z, ty: end.ty, tz: end.tz });
  }
  const section = Array.from({ length: 24 }, (_, i) => {
    const a = i / 24 * Math.PI * 2;
    return new THREE.Vector2(Math.cos(a) * c.diameter / 2, Math.sin(a) * c.diameter / 2);
  });
  const count = section.length, steps = path.length - 1;
  const positions: number[] = [], indices: number[] = [];
  for (let j = 0; j <= steps; j++) {
    const p = path[j];
    for (const q of section) {
      positions.push(side * c.x + q.x, p.y - q.y * p.tz, p.z + q.y * p.ty);
    }
    if (j < steps) for (let i = 0; i < count; i++) {
      const a = j * count + i, b = j * count + (i + 1) % count;
      indices.push(a, a + count, b, b, a + count, b + count);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
