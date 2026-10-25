"""Abre child.blend, assa as shape keys (menos o morph das pálpebras), exporta child.glb e, se pedido, renderiza prévias.

Uso: blender -b saida/child.blend --python export_render.py -- '{"out": "saida", "render": false}'
"""
import bpy, sys, json, os, math
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:]
cfg = json.loads(argv[0])
OUT = cfg["out"]
import numpy as np
import bmesh

def bake_keep(o, prefix, name):
    """Assa todas as shape keys, menos as que começam com `prefix`, que viram um único morph `name`."""
    keys = o.data.shape_keys.key_blocks
    n = len(o.data.vertices)
    B = np.empty(n * 3); keys[0].data.foreach_get("co", B)
    D = np.zeros(n * 3)
    for k in keys:
        if k.name.startswith(prefix):
            K = np.empty(n * 3); k.data.foreach_get("co", K); D += K - B
            k.value = 0.0
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
    base = np.empty(n * 3); o.data.vertices.foreach_get("co", base)
    o.shape_key_add(name="Basis")
    o.shape_key_add(name=name).data.foreach_set("co", base + D)

def apply_masks(o):
    """Aplica os modificadores MASK apagando vértices com bmesh (preserva as shape keys)."""
    gi = {g.name: g.index for g in o.vertex_groups}
    drop = set()
    for m in [m for m in o.modifiers if m.type == "MASK"]:
        idx = gi.get(m.vertex_group)
        members = {v.index for v in o.data.vertices if any(g.group == idx and g.weight > m.threshold for g in v.groups)}
        drop |= members if m.invert_vertex_group else (set(range(len(o.data.vertices))) - members)
        o.modifiers.remove(m)
    bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[bm.verts[i] for i in drop], context="VERTS")
    bm.to_mesh(o.data); bm.free()
    print("MASKED", o.name, len(drop))

for o in bpy.data.objects:
    if o.type != "MESH":
        continue
    sk = o.data.shape_keys
    if sk and any(k.name.startswith("fecha-") for k in sk.key_blocks):
        bake_keep(o, "fecha-", "olhos")
        apply_masks(o)
    elif sk and "olhos" in sk.key_blocks:
        pass
    elif sk:
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
for o in bpy.data.objects:
    print("MAT", o.name, [ (s.material.name, [n.type for n in s.material.node_tree.nodes]) for s in o.material_slots if s.material])
if cfg.get("export", True):
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "child.glb"), export_format="GLB", export_apply=True,
                              export_skins=True, export_animations=False, export_morph=True, export_morph_normal=False,
                              export_image_format=cfg.get("img", "AUTO"))
if cfg.get("render", True):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"; sc.cycles.samples = 24; sc.cycles.device = "CPU"
    sc.render.resolution_x, sc.render.resolution_y = 600, 900
    world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.75, 0.77, 0.8, 1); world.node_tree.nodes["Background"].inputs[1].default_value = 0.9
    sun = bpy.data.lights.new("sun", "SUN"); sun.energy = 3.5; so = bpy.data.objects.new("sun", sun); sc.collection.objects.link(so); so.rotation_euler = (math.radians(50), 0, math.radians(-30))
    cam = bpy.data.cameras.new("cam"); cam.lens = 85; co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co); sc.camera = co
    views = cfg.get("views", [["front", 0, 0.72, 6.2], ["side", 90, 0.72, 6.2], ["face", 20, 1.2, 1.6], ["q34", 35, 0.72, 6.2]])
    sc.render.resolution_x, sc.render.resolution_y = cfg.get("res", [600, 900])
    for name, az, tz, dist in views:
        a = math.radians(az)
        co.location = Vector((math.sin(a) * dist * -1 * -1, -math.cos(a) * dist, tz + 0.05))
        d = Vector((0, 0, tz)) - co.location
        co.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        sc.render.filepath = os.path.join(OUT, f"r-{name}.png")
        bpy.ops.render.render(write_still=True)
