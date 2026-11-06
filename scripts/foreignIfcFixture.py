# Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
# MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
# Dev tool: needs IfcOpenShell. Writes src/io/ifc/fixtures/foreign-room.ifc — a FOREIGN
# file (FILE_NAME by IfcOpenShell, no APK author): a 6000 x 4000 mm room of four
# extruded IfcWalls, an IfcSlab floor and one IfcAudioVisualAppliance rack as a
# SweptSolid, validated with express rules. Its meshes, as web-ifc gives them, are
# fixtures/foreign-room.meshes.json (see foreignIfc.test.ts).
#   python -I scripts/foreignIfcFixture.py src/io/ifc/fixtures/foreign-room.ifc
import sys, numpy as np, ifcopenshell, ifcopenshell.api as A, ifcopenshell.validate as V
S = ifcopenshell.schema_by_name("IFC4X3_ADD2")
for n in ("IfcWall", "IfcSlab", "IfcAudioVisualAppliance", "IfcSpace", "IfcBuildingStorey"):
    S.declaration_by_name(n)
f = A.run("project.create_file", version="IFC4X3_ADD2")
proj = A.run("root.create_entity", f, ifc_class="IfcProject", name="Foreign room")
A.run("unit.assign_unit", f)
ctx = A.run("context.add_context", f, context_type="Model")
body = A.run("context.add_context", f, context_type="Model", context_identifier="Body", target_view="MODEL_VIEW", parent=ctx)
axis = A.run("context.add_context", f, context_type="Model", context_identifier="Axis", target_view="GRAPH_VIEW", parent=ctx)
def sp(cls, name, parent):
    e = A.run("root.create_entity", f, ifc_class=cls, name=name); A.run("aggregate.assign_object", f, products=[e], relating_object=parent); return e
site = sp("IfcSite", "Site", proj); bld = sp("IfcBuilding", "Building", site); st = sp("IfcBuildingStorey", "Ground", bld)
def place(e, x, y, z=0.0, rot=0.0):
    m = np.eye(4); c, s = np.cos(rot), np.sin(rot); m[:2, :2] = [[c, -s], [s, c]]; m[:3, 3] = [x, y, z]
    A.run("geometry.edit_object_placement", f, product=e, matrix=m, is_si=False)
L, W, T, H = 6000.0, 4000.0, 200.0, 3000.0
for i, (x, y, rot, length) in enumerate([(0, 0, 0, L), (L, 0, np.pi / 2, W), (L, W, np.pi, L), (0, W, -np.pi / 2, W)]):
    w = A.run("root.create_entity", f, ifc_class="IfcWall", name=f"Wall {i + 1}")
    A.run("spatial.assign_container", f, products=[w], relating_structure=st)
    place(w, x, y, 0, rot)
    rep = A.run("geometry.add_wall_representation", f, context=body, length=length / 1000, height=H / 1000, thickness=T / 1000)
    A.run("geometry.assign_representation", f, product=w, representation=rep)
    ax = A.run("geometry.add_axis_representation", f, context=axis, axis=[(0.0, 0.0), (length / 1000, 0.0)])
    A.run("geometry.assign_representation", f, product=w, representation=ax)
slab = A.run("root.create_entity", f, ifc_class="IfcSlab", name="Floor")
A.run("spatial.assign_container", f, products=[slab], relating_structure=st)
place(slab, 0, 0, -200)
rep = A.run("geometry.add_slab_representation", f, context=body, depth=0.2, polyline=[(0.0, 0.0), (L / 1000, 0.0), (L / 1000, W / 1000), (0.0, W / 1000)])
A.run("geometry.assign_representation", f, product=slab, representation=rep)
rack = A.run("root.create_entity", f, ifc_class="IfcAudioVisualAppliance", name="Rack 1")
A.run("spatial.assign_container", f, products=[rack], relating_structure=st)
place(rack, 4500, 2500, 0, 0.3)
origin2 = f.create_entity("IfcAxis2Placement2D", Location=f.create_entity("IfcCartesianPoint", (0.0, 0.0)))
prof = f.create_entity("IfcRectangleProfileDef", ProfileType="AREA", Position=origin2, XDim=600.0, YDim=900.0)
solid = f.create_entity("IfcExtrudedAreaSolid", SweptArea=prof, ExtrudedDirection=f.create_entity("IfcDirection", (0.0, 0.0, 1.0)), Depth=2000.0, Position=f.create_entity("IfcAxis2Placement3D", Location=f.create_entity("IfcCartesianPoint", (0.0, 0.0, 0.0))))
rr = f.create_entity("IfcShapeRepresentation", ContextOfItems=body, RepresentationIdentifier="Body", RepresentationType="SweptSolid", Items=[solid])
A.run("geometry.assign_representation", f, product=rack, representation=rr)
f.write(sys.argv[1])
log = V.json_logger(); V.validate(sys.argv[1], log, express_rules=True)
print(sys.argv[1], f.schema, "validation errors", len(log.statements))
for s in log.statements[:5]: print(s)
