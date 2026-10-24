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

export type SlabHole = { w: number; d: number; r: number; cz: number };

/**
 * Chapa de contorno arredondado com raios de borda independentes em cima e embaixo e, opcionalmente, um furo de paredes
 * verticais (o bolsão do vidro). Superfície superior em y = 0, espessura para baixo. Normais analíticas: as faces
 * grandes ficam planas e os biséis e cantos variam suavemente. Dois grupos: 0 = paredes externas, 1 = tampas e furo.
 */
export function ringSlabGeometry(
  w: number, d: number, r: number, h: number, topBevel: number, bottomBevel: number, hole?: SlabHole, segs = 3,
) {
  const core = (x: number, z: number, hw: number, hd: number, cx = 0, cz = 0) => {
    const qx = THREE.MathUtils.clamp(x - cx, -hw, hw), qz = THREE.MathUtils.clamp(z - cz, -hd, hd);
    const nx = x - cx - qx, nz = z - cz - qz, len = Math.hypot(nx, nz) || 1;
    return [nx / len, nz / len] as const;
  };
  // Anéis do contorno externo, de cima para baixo: [y, recuo, ângulo da normal (0 = para cima, 90° = horizontal)]
  const profile: [number, number, number][] = [];
  if (topBevel > 0) {
    for (let i = 0; i <= segs; i++) {
      const t = (i / segs) * (Math.PI / 2);
      profile.push([-topBevel * (1 - Math.cos(t)), topBevel * (1 - Math.sin(t)), t]);
    }
  } else profile.push([0, 0, Math.PI / 2]);
  if (bottomBevel > 0) {
    for (let i = segs; i >= 0; i--) {
      const t = (i / segs) * (Math.PI / 2);
      profile.push([-h + bottomBevel * (1 - Math.cos(t)), bottomBevel * (1 - Math.sin(t)), Math.PI - t]);
    }
  } else profile.push([-h, 0, Math.PI / 2]);
  const outline = (inset: number) => roundedOutline(w - 2 * inset, d - 2 * inset, Math.max(r - inset, 0.0005)).getPoints(12);
  const rings = profile.map(([y, inset]) => outline(inset).map((p) => new THREE.Vector3(p.x, y, p.y)));
  const hw = w / 2 - r, hd = d / 2 - r;
  const positions: number[][] = [[], []], normals: number[][] = [[], []];
  const tri = (g: number, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, na: THREE.Vector3, nb: THREE.Vector3, nc: THREE.Vector3) => {
    const cross = b.clone().sub(a).cross(c.clone().sub(a));
    const flip = cross.dot(na.clone().add(nb).add(nc)) < 0;
    const order = flip ? [a, c, b] : [a, b, c], nn = flip ? [na, nc, nb] : [na, nb, nc];
    order.forEach((v, i) => { positions[g].push(v.x, v.y, v.z); normals[g].push(nn[i].x, nn[i].y, nn[i].z); });
  };
  const wallNormal = (p: THREE.Vector3, angle: number) => {
    const [nx, nz] = core(p.x, p.z, hw, hd);
    return new THREE.Vector3(nx * Math.sin(angle), Math.cos(angle), nz * Math.sin(angle));
  };
  for (let i = 0; i < rings.length - 1; i++) {
    const A = rings[i], B = rings[i + 1];
    for (let j = 0; j < A.length - 1; j++) {
      const a = A[j], b = A[j + 1], c = B[j + 1], e = B[j];
      const [na, nb, nc, ne] = [wallNormal(a, profile[i][2]), wallNormal(b, profile[i][2]), wallNormal(c, profile[i + 1][2]), wallNormal(e, profile[i + 1][2])];
      tri(0, a, b, c, na, nb, nc);
      tri(0, a, c, e, na, nc, ne);
    }
  }
  // Tampas: a de cima com o furo (se houver), a de baixo inteira
  const top = rings[0], bottom = rings[rings.length - 1];
  const holePts = hole ? roundedOutline(hole.w, hole.d, hole.r).getPoints(12).map((p) => new THREE.Vector2(p.x, p.y + hole.cz)) : [];
  const capFaces = (ring: THREE.Vector3[], holes: THREE.Vector2[][], y: number, ny: number) => {
    const contour = ring.slice(0, -1).map((p) => new THREE.Vector2(p.x, p.z));
    const holeLoops = holes.map((hp) => hp.slice(0, -1));
    const all = [...contour, ...holeLoops.flat()];
    const n = new THREE.Vector3(0, ny, 0);
    for (const f of THREE.ShapeUtils.triangulateShape(contour, holeLoops)) {
      const [a, b, c] = f.map((k) => new THREE.Vector3(all[k].x, y, all[k].y));
      tri(1, a, b, c, n, n, n);
    }
  };
  capFaces(top, hole ? [holePts] : [], top[0].y, 1);
  capFaces(bottom, [], bottom[0].y, -1);
  if (hole) {
    const loop = holePts, yTop = top[0].y, yBottom = bottom[0].y;
    const hhw = hole.w / 2 - hole.r, hhd = hole.d / 2 - hole.r;
    const inward = (p: THREE.Vector2) => {
      const [nx, nz] = core(p.x, p.y, hhw, hhd, 0, hole.cz);
      return new THREE.Vector3(-nx, 0, -nz);
    };
    for (let j = 0; j < loop.length - 1; j++) {
      const p = loop[j], q = loop[j + 1];
      const a = new THREE.Vector3(p.x, yTop, p.y), b = new THREE.Vector3(q.x, yTop, q.y);
      const c = new THREE.Vector3(q.x, yBottom, q.y), e = new THREE.Vector3(p.x, yBottom, p.y);
      tri(1, a, b, c, inward(p), inward(q), inward(q));
      tri(1, a, c, e, inward(p), inward(q), inward(p));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions.flat(), 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals.flat(), 3));
  g.addGroup(0, positions[0].length / 3, 0);
  g.addGroup(positions[0].length / 3, positions[1].length / 3, 1);
  return g;
}

/**
 * Placa do dossel: contorno retangular com raios de canto diferentes na frente (rFront, lado do sensor) e atrás
 * (rBack), bisel só nas arestas de cima e de baixo. Superfície superior em y = 0, espessura para baixo; as dimensões
 * incluem o bisel. As faces grandes ficam planas e o perímetro, suave.
 */
export function canopyPlateGeometry(w: number, d: number, rFront: number, rBack: number, h: number, bevel = 0.001) {
  const x = w / 2 - bevel, z = d / 2 - bevel;
  const rf = Math.max(Math.min(rFront - bevel, x, z), 0.0005), rb = Math.max(Math.min(rBack - bevel, x, z), 0.0005);
  const s = new THREE.Shape();
  s.moveTo(-x + rb, -z);
  s.lineTo(x - rb, -z);
  s.absarc(x - rb, -z + rb, rb, -Math.PI / 2, 0, false);
  s.lineTo(x, z - rf);
  s.absarc(x - rf, z - rf, rf, 0, Math.PI / 2, false);
  s.lineTo(-x + rf, z);
  s.absarc(-x + rf, z - rf, rf, Math.PI / 2, Math.PI, false);
  s.lineTo(-x, -z + rb);
  s.absarc(-x + rb, -z + rb, rb, Math.PI, Math.PI * 1.5, false);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: h - 2 * bevel, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 16,
  });
  g.rotateX(Math.PI / 2);
  g.translate(0, -bevel, 0);
  return flatPlateNormals(g, h);
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

/** Cunha trapezoidal de largura constante: rampa de trás curta e íngreme, rampa da frente mais longa; arestas de 2 mm. */
export type FairingSpec = {
  height: number; widthBottom: number; widthTop: number;
  backBottom: number; frontBottom: number; backTop: number; frontTop: number;
};

export function fairingGeometry(baseY: number, f: FairingSpec) {
  const radius = 0.002, height = f.height;
  // O núcleo recuado recebe faces, cilindros nas arestas e esferas nos vértices.
  // Assim, os biséis não suavizam as normais das faces grandes nem mudam o envelope.
  const vertices: THREE.Vector3[] = [];
  for (let y = 0; y < 2; y++) {
    const halfWidth = (y ? f.widthTop : f.widthBottom) / 2 - radius;
    const back = (y ? f.backTop : f.backBottom) + radius;
    const front = (y ? f.frontTop : f.frontBottom) - radius;
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

export type TowerBodySpec = {
  front: number; rear: number; rear2: number; step: number; chamfer: number;
};

/** Recua um polígono simples (sentido anti-horário em z/y) por d, interseccionando as retas deslocadas. */
function insetPolygon(pts: [number, number][], d: number) {
  const n = pts.length;
  const lines = pts.map((p, i) => {
    const q = pts[(i + 1) % n];
    const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len; // normal para a esquerda (interior, em sentido anti-horário)
    return { px: p[0] + nx * d, py: p[1] + ny * d, dx, dy };
  });
  return pts.map((_, i) => {
    const a = lines[(i + n - 1) % n], b = lines[i];
    const det = a.dx * b.dy - a.dy * b.dx;
    const t = ((b.px - a.px) * b.dy - (b.py - a.py) * b.dx) / det;
    return [a.px + a.dx * t, a.py + a.dy * t] as [number, number];
  });
}

/** Corpo de alumínio: perfil lateral (z, y) extrudado em x, com chanfro reto no degrau traseiro; medidas externas. */
export function towerBodyGeometry(w: number, bottom: number, top: number, b: TowerBodySpec) {
  const bevel = 0.004;
  const outer: [number, number][] = [
    [b.front, bottom], [b.front, top], [b.rear, top], [b.rear, b.step + b.chamfer], [b.rear2, b.step], [b.rear2, bottom],
  ];
  // Já em sentido anti-horário em (z, y): frente embaixo, frente em cima, topo, degrau, traseira embaixo.
  const inner = insetPolygon(outer, bevel);
  const s = new THREE.Shape();
  inner.forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y)));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: w - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 3, curveSegments: 10,
  });
  g.rotateY(-Math.PI / 2);
  g.translate(w / 2 - bevel, 0, 0);
  return toCreasedNormals(g, Math.PI / 3);
}

export type CanopyBarSpec = {
  x: number; z: number; wx: number; wt: number; fillet: number;
  rise: number; R: number; pitch: number; zEnd: number;
};

/** Seção retangular com filetes: pontos e normais no plano (u = x, v = normal ao eixo no plano y/z). */
function filletedSection(wx: number, wt: number, f: number, seg = 3) {
  const hx = wx / 2, hv = wt / 2;
  const pts: [number, number][] = [], nrm: [number, number][] = [];
  const corners: [number, number, number][] = [[hx - f, hv - f, 0], [-hx + f, hv - f, 90], [-hx + f, -hv + f, 180], [hx - f, -hv + f, 270]];
  for (const [cx, cv, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = THREE.MathUtils.degToRad(a0 + (90 * i) / seg);
      pts.push([cx + Math.cos(a) * f, cv + Math.sin(a) * f]);
      nrm.push([Math.cos(a), Math.sin(a)]);
    }
  }
  return { pts, nrm };
}

/**
 * Barra plana (retangular com filetes): montante reto, cotovelo circular tangente e trecho reto com queda frontal.
 * A seção gira com o eixo, então a face larga externa continua externa na curva. Normais analíticas: faces planas
 * ficam planas e só os filetes e o cotovelo variam.
 */
export function canopyBarGeometry(side: number, c: CanopyBarSpec, bottom: number) {
  const pitchAngle = Math.atan(c.pitch);
  const path: { y: number; z: number; ty: number; tz: number }[] = [];
  for (let i = 0; i <= 8; i++) path.push({ y: THREE.MathUtils.lerp(bottom, c.rise, i / 8), z: c.z, ty: 1, tz: 0 });
  const arcPoint = (a: number) => ({
    y: c.rise + Math.sin(a) * c.R, z: c.z + c.R * (1 - Math.cos(a)), ty: Math.cos(a), tz: Math.sin(a),
  });
  for (let i = 1; i <= 48; i++) path.push(arcPoint((i / 48) * (Math.PI / 2)));
  const end = arcPoint(Math.PI / 2 + pitchAngle);
  path.push(end);
  for (let i = 1; i <= 12; i++) {
    const z = THREE.MathUtils.lerp(end.z, c.zEnd, i / 12);
    path.push({ y: end.y - (z - end.z) * c.pitch, z, ty: end.ty, tz: end.tz });
  }
  const { pts, nrm } = filletedSection(c.wx, c.wt, c.fillet);
  const count = pts.length, steps = path.length - 1;
  const positions: number[] = [], normals: number[] = [], indices: number[] = [];
  for (let j = 0; j <= steps; j++) {
    const p = path[j];
    for (let i = 0; i < count; i++) {
      const [u, v] = pts[i], [nu, nv] = nrm[i];
      positions.push(side * c.x + u, p.y - v * p.tz, p.z + v * p.ty);
      normals.push(nu, -nv * p.tz, nv * p.ty);
    }
  }
  for (let j = 0; j < steps; j++) for (let i = 0; i < count; i++) {
    const a = j * count + i, b = j * count + ((i + 1) % count);
    indices.push(a, a + count, b, b, a + count, b + count);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  g.setIndex(indices);
  // Tampas nas pontas: a de baixo some dentro do corpo e a de cima dentro da placa.
  return g;
}
