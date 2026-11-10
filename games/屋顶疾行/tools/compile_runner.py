"""Prepare the licensed CC0 mesh data; no upstream runtime code is used.

Bake a fixed athletic body, combine garments onto its skeleton, and retain
only buffers used by geometry, images, skeletons and animation clips.
"""
from pathlib import Path
import copy, json, struct, hashlib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets' / 'character-source'

def read_glb(path):
    raw = path.read_bytes()
    size = struct.unpack_from('<I', raw, 12)[0]
    return json.loads(raw[20:20+size]), raw[28+size:]

DTYPES = {5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
WIDTH = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}

def array(doc, binary, index, normalized=True):
    accessor = doc['accessors'][index]
    dtype = np.dtype(DTYPES[accessor['componentType']])
    width, count = WIDTH[accessor['type']], accessor['count']
    result = np.zeros((count,width), dtype=dtype)
    if 'bufferView' in accessor:
        view = doc['bufferViews'][accessor['bufferView']]
        offset = view.get('byteOffset',0) + accessor.get('byteOffset',0)
        stride = view.get('byteStride',dtype.itemsize*width)
        result[:] = np.ndarray((count,width), dtype=dtype, buffer=binary,
                               offset=offset, strides=(stride,dtype.itemsize))
    sparse = accessor.get('sparse')
    if sparse:
        indices=sparse['indices']; values=sparse['values']
        iv=doc['bufferViews'][indices['bufferView']]
        vv=doc['bufferViews'][values['bufferView']]
        ids=np.frombuffer(binary,dtype=DTYPES[indices['componentType']],count=sparse['count'],offset=iv.get('byteOffset',0)+indices.get('byteOffset',0))
        vals=np.frombuffer(binary,dtype=dtype,count=sparse['count']*width,offset=vv.get('byteOffset',0)+values.get('byteOffset',0)).reshape(-1,width)
        result[ids]=vals
    if normalized and accessor.get('normalized'):
        result=result.astype(np.float32)
        info=np.iinfo(dtype)
        result=np.maximum(-1,result/info.max) if info.min<0 else result/info.max
    return result

docs=[]
for name in ['base_body_anim','clothing_hoodie','clothing_jeans','clothing_shoes','hair_short02']:
    doc,binary=read_glb(SOURCE/(name+'.glb'))
    docs.append((name,doc,binary))

master=copy.deepcopy(docs[0][1])
master['buffers']=[{'byteLength':0}]
master['accessors']=[];master['bufferViews']=[];master['images']=[]
master['textures']=[];master['samplers']=[];master['materials']=[];master['meshes']=[]
master.pop('extensionsUsed',None);master.pop('extensionsRequired',None)
binary_out=bytearray()

def add_view(payload,target=None):
    while len(binary_out)%4: binary_out.append(0)
    view={'buffer':0,'byteOffset':len(binary_out),'byteLength':len(payload)}
    if target: view['target']=target
    index=len(master['bufferViews']);master['bufferViews'].append(view)
    binary_out.extend(payload)
    return index

def add_array(values,type_name,component_type=5126,target=None):
    values=np.asarray(values,dtype=DTYPES[component_type])
    acc={'bufferView':add_view(values.tobytes(),target),'componentType':component_type,
         'count':len(values),'type':type_name}
    if type_name!='MAT4' and len(values):
        acc['min']=values.min(axis=0).tolist();acc['max']=values.max(axis=0).tolist()
    index=len(master['accessors']);master['accessors'].append(acc)
    return index

report=[]
for source_index,(name,doc,binary) in enumerate(docs):
    acc_map={}
    def copy_acc(index):
        if index not in acc_map:
            a=doc['accessors'][index];ctype=a['componentType']
            vals=array(doc,binary,index)
            if a.get('normalized'):ctype=5126
            acc_map[index]=add_array(vals,a['type'],ctype)
        return acc_map[index]
    image_shift=len(master['images']);sampler_shift=len(master['samplers'])
    texture_shift=len(master['textures']);material_shift=len(master['materials'])
    for image in doc.get('images',[]):
        new=copy.deepcopy(image)
        v=doc['bufferViews'][image['bufferView']]
        start=v.get('byteOffset',0)
        new['bufferView']=add_view(binary[start:start+v['byteLength']])
        master['images'].append(new)
    master['samplers']+=copy.deepcopy(doc.get('samplers',[]))
    for texture in doc.get('textures',[]):
        new=copy.deepcopy(texture);new['source']+=image_shift
        if 'sampler' in new:new['sampler']+=sampler_shift
        master['textures'].append(new)
    for material in doc.get('materials',[]):
        new=copy.deepcopy(material);new.pop('extras',None)
        def texture_refs(value):
            if isinstance(value,dict):
                for key,item in value.items():
                    if key=='index':value[key]=item+texture_shift
                    else:texture_refs(item)
            elif isinstance(value,list):
                for item in value:texture_refs(item)
        texture_refs(new);master['materials'].append(new)
    for mesh_index,mesh in enumerate(doc['meshes']):
        result={'name':mesh['name'],'primitives':[]}
        targets=mesh.get('extras',{}).get('targetNames',[])
        for primitive in mesh['primitives']:
            p=copy.deepcopy(primitive);p.pop('targets',None)
            attrs={}
            for key,index in primitive['attributes'].items():
                if key not in ['POSITION','NORMAL','TEXCOORD_0','JOINTS_0','WEIGHTS_0']:continue
                if key in ['POSITION','NORMAL']:
                    values=array(doc,binary,index).astype(np.float32)
                    for morph,weight in [('gender_male',.85),('muscle_max',.12),('corr_gender_male__muscle_max',.102)]:
                        if morph not in targets:continue
                        delta=primitive.get('targets',[])[targets.index(morph)].get(key)
                        if delta is not None:values+=array(doc,binary,delta)*weight
                    if key=='NORMAL':values/=np.maximum(np.linalg.norm(values,axis=1,keepdims=True),1e-7)
                    attrs[key]=add_array(values,'VEC3',target=34962)
                else:attrs[key]=copy_acc(index)
            p['attributes']=attrs
            indices=array(doc,binary,primitive['indices'],False).reshape(-1,3)
            if name=='base_body_anim' and mesh['name']=='base':
                # Only head/neck and hands are visible in this fully clothed runner.
                joints=array(doc,binary,primitive['attributes']['JOINTS_0'],False)
                weights=array(doc,binary,primitive['attributes']['WEIGHTS_0'])
                names=[doc['nodes'][j]['name'] for j in doc['skins'][0]['joints']]
                exposed=np.array([n in ['head','neck_01'] or 'hand_' in n or any(s in n for s in ['index_','middle_','ring_','pinky_','thumb_']) for n in names])
                keep=(exposed[joints]*weights).sum(axis=1)>.12
                indices=indices[np.any(keep[indices],axis=1)]
            p['indices']=add_array(indices.reshape(-1,1),'SCALAR',5123,target=34963)
            if 'material' in p:p['material']+=material_shift
            result['primitives'].append(p)
        target_mesh=len(master['meshes']);master['meshes'].append(result)
        if source_index==0:
            for node in master['nodes']:
                if node.get('mesh')==mesh_index:node['mesh']=target_mesh;node.pop('weights',None)
        else:
            node_index=len(master['nodes'])
            master['nodes'].append({'name':mesh['name'],'mesh':target_mesh,'skin':0})
            master['nodes'][59]['children'].append(node_index)
        report.append({'mesh':mesh['name'],'triangles':sum(master['accessors'][p['indices']]['count']//3 for p in result['primitives'])})
    if source_index==0:
        for skin in master['skins']:skin['inverseBindMatrices']=copy_acc(skin['inverseBindMatrices'])
        for animation in master.get('animations',[]):
            for sampler in animation['samplers']:
                sampler['input']=copy_acc(sampler['input']);sampler['output']=copy_acc(sampler['output'])

master['nodes'][59]['scale']=[1.055,1.055,1.055]
master['asset']['copyright']='CC0-1.0 mesh/garment data: MakeHuman system assets, Kasper Olesen CharacterCreator. Locally baked/combined for Rooftop Flow. See assets/ATTRIBUTION.md.'
master['buffers'][0]['byteLength']=len(binary_out)
json_out=json.dumps(master,separators=(',',':')).encode()
json_out+=b' '*((-len(json_out))%4);binary_out+=b'\0'*((-len(binary_out))%4)
result=struct.pack('<III',0x46546c67,2,28+len(json_out)+len(binary_out))+struct.pack('<II',len(json_out),0x4e4f534a)+json_out+struct.pack('<II',len(binary_out),0x004e4942)+binary_out
output=ROOT/'assets'/'runner.glb';output.write_bytes(result)
report={'file':'assets/runner.glb','bytes':len(result),'sha256':hashlib.sha256(result).hexdigest(),'meshes':report,'triangles':sum(x['triangles'] for x in report),'morphTargetsAtRuntime':0,'bones':53,'animations':[a['name'] for a in master['animations']]}
(ROOT/'assets'/'runner-build.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
