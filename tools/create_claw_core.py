"""Build the original Claw Core sculpture, loop, GLB, and poster in Blender.

Run: blender --background --factory-startup --python tools/create_claw_core.py
"""
import bpy
import math
import os
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "assets", "claw-core.blend")
WEB = os.path.join(ROOT, "public", "models")
os.makedirs(os.path.dirname(SOURCE), exist_ok=True)
os.makedirs(WEB, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 289
scene.render.fps = 24


def material(name, color, metal=0.0, rough=.35, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    p = mat.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rough
    p.inputs["Emission Color"].default_value = (*color, 1)
    p.inputs["Emission Strength"].default_value = emission
    return mat


alloy = material("Brushed titanium", (.38, .42, .47), .88, .26)
edge = material("Machined platinum edges", (.72, .76, .81), .94, .22)
dark = material("Graphite ceramic", (.028, .036, .049), .65, .3)
coral = material("Coral enamel", (.94, .105, .105), .48, .27)
signal = material("Coral light channels", (1, .13, .105), .2, .24, 2.8)
core_mat = material("Warm energy crystal", (1, .19, .115), .42, .22, .65)
root = bpy.data.objects.new("Claw_Core", None)
scene.collection.objects.link(root)
root.empty_display_type = 'CIRCLE'


def finish(obj, mat, parent=root, bevel=.035, smooth=True):
    obj.data.materials.append(mat)
    obj.parent = parent
    if bevel:
        mod = obj.modifiers.new("Machined bevel", 'BEVEL')
        mod.width = bevel
        mod.segments = 3
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
        if bevel:
            obj.modifiers.new("Weighted corner normals", 'WEIGHTED_NORMAL')
    return obj


def cylinder(name, radius, depth, location, mat, parent=root, vertices=48, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth)
    obj = bpy.context.object
    obj.name = name
    obj.location = location
    obj.rotation_euler = rotation
    return finish(obj, mat, parent, min(.025, depth / 5))


def torus(name, radius, tube, location, mat, parent=root, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=80, minor_segments=10, major_radius=radius, minor_radius=tube)
    obj = bpy.context.object
    obj.name = name
    obj.location = location
    obj.rotation_euler = rotation
    return finish(obj, mat, parent, 0)


def box(name, location, scale, mat, parent=root, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.object
    obj.name = name
    obj.location = location
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, parent, bevel)


def blade(name, outline, thickness, mat, parent, y=0, bevel=.035):
    n = len(outline)
    verts = [(x, y - thickness / 2, z) for x, z in outline] + [(x, y + thickness / 2, z) for x, z in outline]
    faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    faces.extend((i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return finish(obj, mat, parent, bevel)


# Three independent articulated fingers surround a common energy source.
shape = [(1.04, -1.05), (1.51, -.8), (1.76, -.15), (1.61, .69), (1.12, 1.34),
         (.55, 1.57), (.33, 1.43), (.91, 1.12), (1.26, .54), (1.29, -.06),
         (1.08, -.57), (.83, -.76)]
panel = [(1.13, -.65), (1.48, -.44), (1.55, .15), (1.37, .66),
         (1.17, .83), (1.37, .22), (1.29, -.28)]
light_path = [(1.10, -.60), (1.24, -.06), (1.21, .48), (.90, 1.03),
              (.53, 1.26), (.56, 1.31), (.96, 1.08), (1.28, .52),
              (1.32, -.06), (1.18, -.64)]
pivots = []
for i in range(3):
    angle = i * math.tau / 3
    pivot = bpy.data.objects.new(f"Finger_{i + 1}_hinge", None)
    scene.collection.objects.link(pivot)
    pivot.parent = root
    pivot.location = (1.05 * math.cos(angle), 1.05 * math.sin(angle), -1)
    pivot.rotation_euler = (0, 0, angle)
    pivots.append(pivot)
    local = lambda points: [(x - 1.05, z + 1) for x, z in points]
    blade(f"Finger_{i + 1}_titanium_shell", local(shape), .28, alloy, pivot, bevel=.055)
    for side in [-1, 1]:
        blade(f"Finger_{i + 1}_ceramic_panel_{side}", local(panel), .018, dark, pivot, y=side * .15, bevel=.018)
        blade(f"Finger_{i + 1}_light_rail_{side}", local(light_path), .018, signal, pivot, y=side * .153, bevel=.012)
        cylinder(f"Finger_{i + 1}_hinge_disc_{side}", .22, .08, (0, side * .20, .05), dark, pivot, rotation=(math.pi / 2, 0, 0))
        cylinder(f"Finger_{i + 1}_hinge_cap_{side}", .145, .09, (0, side * .245, .05), edge, pivot, rotation=(math.pi / 2, 0, 0))
        cylinder(f"Finger_{i + 1}_hinge_center_{side}", .052, .095, (0, side * .255, .05), coral, pivot, vertices=12, rotation=(math.pi / 2, 0, 0))
        for j, (r, z) in enumerate([(1.47, -.27), (1.39, .48), (.96, 1.20)]):
            cylinder(f"Finger_{i + 1}_fastener_{side}_{j}", .026, .018, (r - 1.05, side * .157, z + 1), edge, pivot, vertices=8, rotation=(math.pi / 2, 0, 0))
    tip = box(f"Finger_{i + 1}_coral_tip", (-.52, 0, 2.39), (.25, .33, .11), coral, pivot, .025)
    tip.rotation_euler.y = -.48

# Open, machined lower collar with small ribs and three mounting blocks.
torus("Lower titanium collar", 1.04, .105, (0, 0, -1.04), alloy)
torus("Lower polished rim", 1.04, .025, (0, 0, -.91), edge)
torus("Lower signal ring", .94, .025, (0, 0, -1.09), signal)
for i in range(24):
    a = i * math.tau / 24
    rib = box(f"Collar radial rib {i:02}", (1.025 * math.cos(a), 1.025 * math.sin(a), -1.045), (.14, .055, .16), dark, bevel=.01)
    rib.rotation_euler.z = a
for i in range(3):
    a = i * math.tau / 3
    mount = box(f"Hinge mount {i + 1}", (.92 * math.cos(a), .92 * math.sin(a), -1.04), (.36, .45, .2), dark)
    mount.rotation_euler.z = a

# The faceted core, floating inside a slowly turning gyroscopic cage.
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=.57, location=(0, 0, .14))
core = bpy.context.object
core.name = "Shared_energy_crystal"
finish(core, core_mat, bevel=.012, smooth=False)
gyro = bpy.data.objects.new("Gyroscopic_cage", None)
scene.collection.objects.link(gyro)
gyro.parent = root
gyro.location.z = .14
torus("Gyro outer ring", .79, .038, (0, 0, 0), edge, gyro, rotation=(.48, .35, 0))
torus("Gyro offset ring", .72, .026, (0, 0, 0), dark, gyro, rotation=(1.18, -.40, .8))
for i in range(3):
    a = i * math.tau / 3
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=.065)
    node = bpy.context.object
    node.name = f"Gyro signal node {i + 1}"
    node.location = (.79 * math.cos(a), .79 * math.sin(a), 0)
    finish(node, signal, gyro, 0)

# One seamless twelve-second loop, baked to a single GLB scene animation.
for frame in range(1, 290, 6):
    t = (frame - 1) / 288
    phase = math.tau * t
    root.rotation_euler = (.06 * math.sin(phase), .04 * math.cos(phase), phase)
    root.location.z = .085 * math.sin(phase * 2)
    root.keyframe_insert(data_path="rotation_euler", frame=frame)
    root.keyframe_insert(data_path="location", frame=frame)
    for i, pivot in enumerate(pivots):
        pivot.rotation_euler.y = -.08 + .15 * (.5 - .5 * math.cos(phase * 2 + i * math.tau / 3))
        pivot.keyframe_insert(data_path="rotation_euler", frame=frame)
    gyro.rotation_euler = (.35 + phase, .2 * math.sin(phase), -phase * 2)
    gyro.keyframe_insert(data_path="rotation_euler", frame=frame)
    core.rotation_euler = (.18, phase, -phase)
    core.scale = (1 + .035 * math.sin(phase * 4),) * 3
    core.keyframe_insert(data_path="rotation_euler", frame=frame)
    core.keyframe_insert(data_path="scale", frame=frame)

scene.frame_set(1)
# Studio lighting and camera are retained in the editable Blender source, not the GLB.
world = bpy.data.worlds.new("Dark studio")
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.055, .065, .085, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .35


def area(name, location, energy, color, size):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.color = color
    data.shape = 'DISK'
    data.size = size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((0, 0, 0)) - obj.location).to_track_quat('-Z', 'Y').to_euler()


area("Large softbox", (3, -4, 6), 1500, (.88, .93, 1), 5)
area("Coral rim", (-4, 1, 2), 1100, (1, .23, .16), 3)
area("Cool edge", (2, 4, 3), 1800, (.7, .83, 1), 4)
area("Front reflection", (1, -6, .5), 500, (1, .9, .82), 3)
camera_data = bpy.data.cameras.new("Product camera")
camera = bpy.data.objects.new("Product camera", camera_data)
scene.collection.objects.link(camera)
camera.location = (5.5, -7.5, 4.5)
camera.rotation_euler = (Vector((0, 0, .12)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 4.9
scene.camera = camera
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 800
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
scene.render.filepath = os.path.join(WEB, 'claw-core-poster.png')

# Keep an informative view ready when the .blend is opened interactively.
for screen in bpy.data.screens:
    for space in screen.areas:
        if space.type == 'VIEW_3D':
            space.spaces.active.region_3d.view_distance = 7
            space.spaces.active.region_3d.view_location = (0, 0, .1)
            space.spaces.active.shading.type = 'MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=SOURCE)
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for obj in root.children_recursive:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root
args = dict(filepath=os.path.join(WEB, 'claw-core.glb'), export_format='GLB', use_selection=True,
            export_animations=True, export_force_sampling=True, export_frame_range=True,
            export_apply=True, export_cameras=False, export_lights=False)
props = bpy.ops.export_scene.gltf.get_rna_type().properties
if 'export_animation_mode' in props and 'SCENE' in props['export_animation_mode'].enum_items.keys():
    args['export_animation_mode'] = 'SCENE'
bpy.ops.export_scene.gltf(**args)
bpy.ops.render.render(write_still=True)
print('CLAW_CORE_COMPLETE', SOURCE)
