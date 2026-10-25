"""Gera a criança da história 3D com o MakeHuman (extensão MPFB do Blender) e salva child.blend.

Uso (ver README.md): blender -b --python build_child.py -- '{"out": "saida"}'
Os valores padrão abaixo reproduzem o modelo publicado em public/models/crianca.glb.
"""
import bpy, sys, json, os, math
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
cfg = json.loads(argv[0]) if argv else {}
OUT = cfg.get("out", "saida")
os.makedirs(OUT, exist_ok=True)

from bl_ext.user_default.mpfb.services.humanservice import HumanService

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

info = HumanService._create_default_human_info_dict()
info["phenotype"] = {
    # menino de ~11 anos (age 0,1875) com 1,48 m (height 0,61)
    "gender": cfg.get("gender", 1.0), "age": cfg.get("age", 0.1875), "muscle": cfg.get("muscle", 0.5),
    "weight": cfg.get("weight", 0.45), "proportions": cfg.get("proportions", 0.5), "height": cfg.get("height", 0.61),
    "cupsize": 0.5, "firmness": 0.5,
    "race": cfg.get("race", {"asian": 0.15, "caucasian": 0.5, "african": 0.35}),
}
info["rig"] = "game_engine"
info["eyes"] = "high-poly.mhclo"
info["eyebrows"] = cfg.get("eyebrows", "eyebrow001.mhclo")
info["eyelashes"] = cfg.get("eyelashes", "eyelashes01.mhclo")
info["hair"] = cfg.get("hair", "short01.mhclo")
info["clothes"] = cfg.get("clothes", ["namuhekam_male_polo_shirt.mhclo", "cortu_cargo_pants.mhclo"])
info["skin_mhmat"] = cfg.get("skin", "young_caucasian_male.mhmat")
info["skin_material_type"] = "GAMEENGINE"
info["eyes_material_type"] = "MAKESKIN"
info["name"] = "child"
# leve sorriso
info["targets"] = cfg.get("targets", [{"target": "mouth-corner-puller", "value": 0.3}])

settings = HumanService.get_default_deserialization_settings()
settings["subdiv_levels"] = 0
settings["override_clothes_model"] = "GAMEENGINE"
settings["override_eyes_model"] = "GAMEENGINE"
basemesh = HumanService.deserialize_from_dict(info, settings)

rig = basemesh.parent
print("RIG", rig.name if rig else None)

from bl_ext.user_default.mpfb.entities.clothes.mhclo import Mhclo
from bl_ext.user_default.mpfb.services.clothesservice import ClothesService
from bl_ext.user_default.mpfb.services.assetservice import AssetService
# Pele sob a roupa: usa os grupos de deleção (conservadores) de peças CC0 equivalentes, já que a polo e a calça não têm
DELETE_FROM = [["elvs_crude_t-shirt_male.mhclo", "Delete.namuhekam_male_polo_shirt"], ["cortu_jeans_shorts.mhclo", "Delete.cortu_cargo_pants"]]
for frag, name in cfg.get("delete_from", DELETE_FROM):
    mh = Mhclo(); mh.load(AssetService.find_asset_absolute_path(frag, "clothes"))
    ClothesService.update_delete_group(mh, basemesh, delete_group_name=name)
    print("DELGROUP", name, len(mh.delverts or []))

# Bermuda: corta a calça logo acima do joelho e devolve as canelas à malha do corpo (grupo de deleção da calça)
cut = cfg.get("cut", 0.06)
if cut is not None:
    knee = (rig.matrix_world @ rig.data.bones["calf_l"].head_local).z
    zc = knee + cut
    print("KNEE", round(knee, 4), "CUT", round(zc, 4))
    import bmesh
    for o in bpy.data.objects:
        if o.type == "MESH" and "pants" in o.name:
            bm = bmesh.new(); bm.from_mesh(o.data)
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if (o.matrix_world @ v.co).z < zc], context="VERTS")
            bm.to_mesh(o.data); bm.free()
            g = basemesh.vertex_groups.get("Delete." + o.name.split(".", 1)[1])
            if g:
                ids = [v.index for v in basemesh.data.vertices if (basemesh.matrix_world @ v.co).z < zc - cfg.get("margin", 0.03)]
                g.remove(ids)
                print("UNDELETE", g.name, len(ids))

# Calça por dentro da polo: em cada altura coberta pela polo, o raio da calça (a partir do eixo do tronco) fica
# `tuck` m menor que o da polo na mesma direção (raio lançado do eixo contra a polo)
tuck = cfg.get("tuck", 0.008)
if tuck:
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    polo = next(o for o in bpy.data.objects if o.type == "MESH" and "polo" in o.name)
    pants = next(o for o in bpy.data.objects if o.type == "MESH" and "pants" in o.name)
    tree = BVHTree.FromObject(polo, bpy.context.evaluated_depsgraph_get())
    hem = min(v.co.z for v in polo.data.vertices)
    cy = cfg.get("axis_y", -0.01)
    moved = 0
    for v in pants.data.vertices:
        if v.co.z < hem - 0.01:
            continue
        c = Vector((0.0, cy, v.co.z))
        r = v.co - c
        rl = r.length
        if rl < 1e-4:
            continue
        hit = tree.ray_cast(c, r / rl, 1.0)
        if hit[0] is None:
            continue
        rp = (hit[0] - c).length
        if rl > rp - tuck:
            v.co = c + r * ((rp - tuck) / rl)
            moved += 1
    print("TUCK hem", round(hem, 4), "moved", moved)
dg = bpy.context.evaluated_depsgraph_get()
def bbox(o):
    e = o.evaluated_get(dg); m = e.to_mesh()
    zs = [ (o.matrix_world @ v.co) for v in m.vertices ]
    r = (min(p.x for p in zs), max(p.x for p in zs), min(p.y for p in zs), max(p.y for p in zs), min(p.z for p in zs), max(p.z for p in zs), len(m.vertices), len(m.polygons))
    e.to_mesh_clear(); return r
for o in bpy.data.objects:
    if o.type == "MESH":
        print("MESH", o.name, [round(x, 3) for x in bbox(o)[:6]], bbox(o)[6:], [m.type for m in o.modifiers], [s.material.name if s.material else None for s in o.material_slots])
# Pálpebras: morph "olhos" (fechar os dois olhos) no corpo e nos cílios, para o teste de equilíbrio e as piscadas
if cfg.get("blink", True):
    import bl_ext.user_default.mpfb as mpfb_pkg
    from bl_ext.user_default.mpfb.services.targetservice import TargetService
    units = os.path.join(os.path.dirname(mpfb_pkg.__file__), "data", "targets", "expression", "units", "caucasian")
    keys = [TargetService.load_target(basemesh, os.path.join(units, f"eye-{s}-closure.target.gz"), weight=0.0, name=f"fecha-{s}") for s in ("left", "right")]
    lashes = next(o for o in bpy.data.objects if o.type == "MESH" and "eyelash" in o.name)
    def lash_coords(w):
        for k in keys:
            k.value = w
        ClothesService.fit_clothes_to_human(lashes, basemesh, set_parent=False)
        return [v.co.copy() for v in lashes.data.vertices]
    closed = lash_coords(1.0)
    opened = lash_coords(0.0)
    for v, c in zip(lashes.data.vertices, opened):
        v.co = c
    lashes.shape_key_add(name="Basis")
    sk = lashes.shape_key_add(name="olhos")
    for d, c in zip(sk.data, closed):
        d.co = c
    print("BLINK lashes", len(closed), "max move", round(max((a - b).length for a, b in zip(closed, opened)), 4))

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "child.blend"))
