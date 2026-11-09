"""Bake real FBX takes into the model's rest skeleton; exclude calibration takes."""
import bpy,pathlib,json
from mathutils import Matrix,Vector
root=pathlib.Path('D:/Loopit素材/沙盒游戏/末日街区素材库/packs/animated-characters-survivors')
base=pathlib.Path(__file__).resolve().parent
out=base/'assets'/'characters';out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps=24
bpy.ops.import_scene.fbx(filepath=str(root/'Model'/'characterMedium.fbx'))
original=list(bpy.context.scene.objects);rig=next(o for o in original if o.type=='ARMATURE');mesh=next(o for o in original if o.type=='MESH')
bones=sorted(rig.data.bones,key=lambda b:len(b.parent_recursive))
sampled={}
for filename,label in [('idle','Idle'),('run','Run')]:
 before=set(bpy.data.actions);before_objects=set(bpy.context.scene.objects)
 bpy.ops.import_scene.fbx(filepath=str(root/'Animations'/(filename+'.fbx')))
 other=list(set(bpy.context.scene.objects)-before_objects);source=next(o for o in other if o.type=='ARMATURE')
 action=next(a for a in bpy.data.actions if a not in before and a.name.rsplit('|',1)[-1].lower()==filename)
 source.animation_data.action=action
 source.animation_data.action_slot=action.slots[0]
 first,last=map(int,action.frame_range);frames=[];anchor=None
 for frame in range(first,last+1):
  bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
  hip=source.pose.bones['Hips'].matrix.translation
  if anchor is None:anchor=hip.copy()
  offset=Vector((hip.x-anchor.x,hip.y-anchor.y,0))
  desired={b.name:source.pose.bones[b.name].matrix.copy() for b in bones}
  for m in desired.values():m.translation-=offset
  basis={}
  for b in bones:
   relative_rest=b.parent.matrix_local.inverted()@b.matrix_local if b.parent else b.matrix_local
   parent_pose=desired[b.parent.name] if b.parent else Matrix.Identity(4)
   basis[b.name]=relative_rest.inverted()@parent_pose.inverted()@desired[b.name]
  frames.append(basis)
 sampled[label]=frames
 for o in other:bpy.data.objects.remove(o,do_unlink=True)
clips={}
for label,frames in [('Idle',sampled['Idle']),('Walk',sampled['Run']),('Run',sampled['Run'])]:
 rig.animation_data_create();rig.animation_data.action=None
 action=bpy.data.actions.new(label);slot=action.slots.new('OBJECT',rig.name);rig.animation_data.action=action;rig.animation_data.action_slot=slot;action.use_fake_user=True
 count=len(frames);report=[]
 for index,poses in enumerate(frames):
  frame=index+1;bpy.context.scene.frame_set(frame)
  for b in bones:
   pb=rig.pose.bones[b.name];pb.rotation_mode='QUATERNION'
   pos,rot,scale=poses[b.name].decompose()
   if label=='Walk':
    ip,iq,isc=sampled['Idle'][round(index/(count-1)*(len(sampled['Idle'])-1))][b.name].decompose()
    pos=ip.lerp(pos,.58);rot=iq.slerp(rot,.58);scale=isc.lerp(scale,.58)
   pb.location=pos;pb.rotation_quaternion=rot;pb.scale=scale
   for channel in ['location','rotation_quaternion','scale']:pb.keyframe_insert(data_path=channel,frame=frame,group=b.name)
  bpy.context.view_layer.update()
  report.append({n:[round(v,4) for v in rig.pose.bones[n].head] for n in ['Head','LeftFoot','RightFoot']})
 clips[label]=action
 (out/(label.lower()+'-pose-audit.json')).write_text(json.dumps(report),encoding='utf8')
rig.animation_data.action=None
for name,action in clips.items():
 track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action)
 strip.action_slot=action.slots[0]
 strip.action_frame_start=action.frame_range[0];strip.action_frame_end=action.frame_range[1]
 if name=='Walk':strip.scale=1.35
for skin in ['survivorMaleB','survivorFemaleA','zombieA','zombieC']:
 mat=bpy.data.materials.new(skin);mat.use_nodes=True;bsdf=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');bsdf.inputs['Roughness'].default_value=.95
 tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(root/'Skins'/(skin+'.png')),check_existing=True);mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
 mesh.data.materials.clear();mesh.data.materials.append(mat)
 bpy.ops.export_scene.gltf(filepath=str(out/(skin+'.glb')),export_format='GLB',export_animation_mode='NLA_TRACKS',export_skins=True)
print('BAKED_REAL_TAKES',[(k,len(v)) for k,v in sampled.items()],flush=True)
