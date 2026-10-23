# Claw Core

An original mechanical sculpture authored in Blender 5.2 for the Claw Syndicate hero.

- Editable scene: `claw-core.blend`.
- Reproducible authoring script: `../tools/create_claw_core.py`.
- Web model: `../public/models/claw-core.glb`.
- Transparent rendered fallback: `../public/models/claw-core-poster.png`.

The 12-second loop contains a rotating, floating assembly, three separately articulated fingers, a gyroscopic cage, and a pulsing faceted core. The web model has approximately 36,268 triangles and no external texture or decoder dependencies. Studio lights and the product camera are retained in the Blender scene; the browser supplies its own lighting.

Regenerate from the repository root:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python tools/create_claw_core.py
```

The script replaces only its generated model, scene, and poster outputs. Blender backup files are ignored by Git.
