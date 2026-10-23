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

/** Carenagem de uma peça: o perfil côncavo chega tangente ao tampo. */
export function fairingGeometry(baseY: number, topWidth: number) {
  const positions: number[] = [], indices: number[] = [];
  const rings = 24;
  let count = 0;
  const sides: boolean[] = [];
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    const w = THREE.MathUtils.lerp(topWidth, 0.478, t * t);
    const back = THREE.MathUtils.lerp(-0.067, -0.145, t);
    const front = THREE.MathUtils.lerp(0.050, 0.120, t);
    const u = Math.max(0, (t - 0.7) / 0.3);
    const profile = t <= 0.7 ? 1 - t : 0.3 * (1 - u) ** 2 * (1 + u);
    const y = baseY + 0.070 * profile;
    const outline = roundedOutline(w, front - back, 0.008 + 0.01 * t).getPoints(10);
    outline.pop();
    count = outline.length;
    outline.forEach((p, i) => {
      positions.push(p.x, y, p.y + (front + back) / 2);
      if (j === 0) {
        const q = outline[(i + 1) % count];
        sides.push(Math.abs(q.y - p.y) > Math.abs(q.x - p.x));
      }
    });
  }
  const g = new THREE.BufferGeometry();
  for (let material = 0; material < 2; material++) {
    const first = indices.length;
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < count; i++) {
        if (Number(sides[i]) !== material) continue;
        const a = j * count + i, b = j * count + (i + 1) % count;
        const c = a + count, d = b + count;
        indices.push(a, b, c, b, d, c);
      }
    }
    g.addGroup(first, indices.length - first, material);
  }
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
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
