// Otimiza o GLB da criança: materiais (opaco/recorte), texturas WebP menores, malha quantizada + meshopt.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, prune, quantize, reorder, textureCompress, meshopt, weld } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import sharp from "sharp";

const [, , src, dst, cfgJson] = process.argv;
const cfg = JSON.parse(cfgJson || "{}");
await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(src);
const root = doc.getRoot();

// Materiais: corpo/roupa/olhos opacos; cabelo, sobrancelha e cílios com recorte de alfa
const SIZE = { body: 1024, polo: 1024, pants: 512, hair: 1024, eye: 256, brow: 256, lash: 256, ...(cfg.size || {}) };
const kind = (n) => (/body/.test(n) ? "body" : /polo/.test(n) ? "polo" : /pants/.test(n) ? "pants" : /eyebrow/.test(n) ? "brow" : /eyelash/.test(n) ? "lash" : /high-poly|eye/.test(n) ? "eye" : /short|hair/.test(n) ? "hair" : "other");
for (const m of root.listMaterials()) {
  const k = kind(m.getName());
  m.setName(k);
  if (["brow", "lash", "hair", "eye"].includes(k)) { m.setAlphaMode("MASK"); m.setAlphaCutoff(k === "hair" ? 0.4 : 0.3); m.setDoubleSided(k !== "eye"); }
  else { m.setAlphaMode("OPAQUE"); m.setDoubleSided(k === "polo" || k === "pants"); }
  m.setMetallicFactor(0);
  m.setRoughnessFactor(k === "eye" ? 0.25 : k === "hair" ? 0.7 : 0.85);
  for (const t of [m.getBaseColorTexture(), m.getNormalTexture()]) if (t) t.setName(k + (t === m.getNormalTexture() ? "-n" : ""));
  if (cfg.dropNormals && m.getNormalTexture()) m.setNormalTexture(null);
}
for (const mesh of root.listMeshes()) mesh.setName(mesh.listPrimitives()[0].getMaterial()?.getName() || mesh.getName());
await doc.transform(dedup(), prune());
// Texturas: redimensiona por tipo e converte para WebP
for (const t of root.listTextures()) {
  const base = t.getName().replace(/-n$/, "");
  const s = Math.round((SIZE[base] || 512) * (t.getName().endsWith("-n") ? 0.5 : 1));
  const img = sharp(Buffer.from(t.getImage())).resize(s, s, { fit: "fill" });
  const hasAlpha = ["hair", "brow", "lash", "eye"].includes(base);
  const out = await (hasAlpha ? img.webp({ quality: 88, alphaQuality: 90 }) : img.removeAlpha().webp({ quality: base === "body" ? 90 : 82 })).toBuffer();
  t.setImage(new Uint8Array(out)).setMimeType("image/webp");
  if (t.getURI()) t.setURI(t.getName() + ".webp");
}
await doc.transform(weld(), reorder({ encoder: MeshoptEncoder }), quantize(), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
await io.write(dst, doc);
for (const t of root.listTextures()) console.log("TEX", t.getName(), t.getImage().byteLength);
