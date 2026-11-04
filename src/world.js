import * as THREE from 'three';
import {stormPosition} from './levels.js';
const mats=new Map();
function material(color,flat=true){const key=color+':'+flat;if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:0.85,flatShading:flat}));return mats.get(key);}
function mesh(geometry,color,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(rt,rb,h,c,p,x=0,y=0,z=0,n=10){return mesh(new THREE.CylinderGeometry(rt,rb,h,n),c,p,x,y,z);}
function ring(radius,width,color,parent,x=0,z=0){const m=new THREE.Mesh(new THREE.RingGeometry(radius-width,radius,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.55,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,0.08,z);parent.add(m);return m;}
export class World{
 constructor(canvas){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xb9d9d2);this.scene.fog=new THREE.Fog(0xb9d9d2,75,170);
  this.camera=new THREE.OrthographicCamera(-30,30,20,-20,0.1,240);this.camera.position.set(0,43,38);this.camera.lookAt(0,0,0);this.focus=new THREE.Vector3();
  this.scene.add(new THREE.HemisphereLight(0xe3f3ff,0x25516a,2.6));const sun=new THREE.DirectionalLight(0xffe4ac,3.5);sun.position.set(-28,55,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-50,right:50,top:50,bottom:-50,near:1,far:130});sun.shadow.bias=-0.0005;this.scene.add(sun);this.sun=sun;
  this.water=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.ShaderMaterial({uniforms:{time:{value:0},base:{value:new THREE.Color(0x237f91)}},vertexShader:`varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;uniform vec3 base;varying vec3 vPos;void main(){vec2 p=vPos.xy;float a=sin(p.x*.24+p.y*.16+time*.7);float b=sin(p.y*.7-p.x*.11-time*.9);float foam=smoothstep(.98,1.,sin(p.y*1.7+sin(p.x*.5+time*.6)*.55-time*.7));float patches=sin(p.x*.065+p.y*.08)*.5+.5;vec3 c=base*(.82+patches*.18)+vec3(.06,.12,.11)*(a*.5+.5)*.3;c+=vec3(.14,.23,.22)*foam*(.35+.65*smoothstep(.1,.9,sin(p.x*.3)));gl_FragColor=vec4(c,1.);}` }));this.water.rotation.x=-Math.PI/2;this.water.position.y=-0.12;this.scene.add(this.water);
  this.root=new THREE.Group();this.scene.add(this.root);this.boat=this.createBoat();this.scene.add(this.boat);this.trails=[];const tg=new THREE.PlaneGeometry(0.12,1.5);for(let i=0;i<65;i++){const m=new THREE.Mesh(tg,new THREE.MeshBasicMaterial({color:0xc0f6e3,transparent:true,opacity:0,depthWrite:false}));m.rotation.x=-Math.PI/2;this.scene.add(m);this.trails.push({m,life:0});}this.trailIndex=0;this.trailClock=0;
  this.particles=[];this.ray=new THREE.Raycaster();this.plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);this.resize();
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h);const aspect=w/h;const span=aspect<1?27:23;this.camera.left=-span*aspect;this.camera.right=span*aspect;this.camera.top=span;this.camera.bottom=-span;this.camera.updateProjectionMatrix();}
 createBoat(){const g=new THREE.Group();const hull=mesh(new THREE.SphereGeometry(1,8,5),0xeaa25d,g,0,.45,0);hull.scale.set(.78,.5,1.55);mesh(new THREE.BoxGeometry(1.1,.18,2),0xfee8bd,g,0,.63,0);mesh(new THREE.BoxGeometry(.65,.38,.7),0x214f58,g,0,.88,.5);cylinder(.055,.07,3.3,0x4b5350,g,0,2.1,-.15,7);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,3.6,-.15,0,1.3,-.15,1.65,1.5,-.15,0,3.6,-.15,1.65,1.5,-.15,1.05,2.6,-.15],3));geo.computeVertexNormals();const sail=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xffe3a2,side:THREE.DoubleSide,roughness:1}));sail.castShadow=true;g.add(sail);this.sail=sail;
  const flag=mesh(new THREE.BoxGeometry(.7,.27,.04),0xf07259,g,.32,3.82,-.15);flag.rotation.z=-.1;
  cylinder(.23,.2,.45,0x96f9ed,g,0,1.15,-.9,6);const glow=new THREE.PointLight(0x85ffdd,4,5);glow.position.set(0,1.6,-.9);g.add(glow);return g;
 }
 island(x,z,r,seed){
  const g=new THREE.Group();g.position.set(x,0,z);this.root.add(g);ring(r+1.15,.35,0x9ce6d4,g);ring(r+.65,.65,0x71c9ba,g);
  const rock=cylinder(r*.9,r*.73,2,0x557a7c,g,0,.5,0,7);rock.rotation.y=seed;const sand=cylinder(r*.82,r*.94,.6,0xe6cf9b,g,0,1.55,0,7);sand.rotation.y=seed;const grass=cylinder(r*.67,r*.8,.28,0x719d72,g,0,1.97,0,7);grass.rotation.y=seed;
  for(let i=0;i<3;i++){const a=seed+i*2.6;const xx=Math.cos(a)*r*.43,zz=Math.sin(a)*r*.43;const stone=mesh(new THREE.DodecahedronGeometry(r*.19,0),i%2?0x557b77:0x789485,g,xx,2.2,zz);stone.scale.y=1.6;}
  if(r>3){const tree=new THREE.Group();tree.position.set(r*.14,2,0);tree.rotation.z=.15;g.add(tree);cylinder(.10,.18,2.4,0x725c40,tree,0,1.2,0,6);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leaf=mesh(new THREE.ConeGeometry(.65,2.3,4),0x3b816f,tree,Math.cos(a)*.75,2.35,Math.sin(a)*.75);leaf.rotation.z=Math.PI/2;leaf.rotation.y=-a;}}
 }
 lighthouse(x,z){
  const g=new THREE.Group();g.position.set(x,0,z);this.root.add(g);cylinder(3.4,4.3,1.4,0x667b78,g,0,.3,0,8);cylinder(3.3,3.6,.5,0xf0d7a4,g,0,1.2,0,8);cylinder(1.2,1.7,6.8,0xffe9c4,g,0,4.7,0,10);cylinder(1.34,1.43,.9,0xe8775b,g,0,4.8,0,10);cylinder(1.18,1.25,.75,0xe8775b,g,0,7.1,0,10);cylinder(1.65,1.65,.3,0x284c57,g,0,8.05,0,10);cylinder(.9,.9,1.5,0x9abcb4,g,0,8.9,0,8);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cylinder(.06,.06,1.6,0x324f50,g,Math.cos(a),8.85,Math.sin(a),5);}cylinder(0,1.7,1.3,0xde7358,g,0,10.25,0,10);cylinder(.06,.06,.8,0x214c55,g,0,11.25,0,5);
  mesh(new THREE.BoxGeometry(.7,1.3,.15),0x31595c,g,0,2.2,1.5);const dock=mesh(new THREE.BoxGeometry(2,.3,3.5),0xa58561,g,0,.4,4.5);for(let i=0;i<6;i++)mesh(new THREE.BoxGeometry(2.1,.08,.08),0xd2b78c,g,0,.6,3+i*.55);
  this.goalRing=ring(6,.2,0xffe5a4,this.root,x,z);this.goalRing.material.opacity=.5;this.lamp=new THREE.Mesh(new THREE.SphereGeometry(.75,12,8),new THREE.MeshBasicMaterial({color:0x688c87}));this.lamp.position.set(x,8.9,z);this.root.add(this.lamp);
  const bg=new THREE.ConeGeometry(5,28,32,1,true);bg.translate(0,-14,0);bg.rotateZ(Math.PI/2);this.beam=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:0xffe5a1,transparent:true,opacity:0.12,side:THREE.DoubleSide,depthWrite:false}));this.beam.position.set(x,8.9,z);this.root.add(this.beam);this.beam.visible=false;
 }
 load(level){while(this.root.children.length){const obj=this.root.children[0];this.root.remove(obj);obj.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&!Array.from(mats.values()).includes(o.material))o.material.dispose();});}this.level=level;this.water.material.uniforms.base.value.setHex(level.color);this.scene.background.setHex(level.sky);this.scene.fog.color.setHex(level.sky);this.sun.color.setHex(level.light);this.gems=[];this.storms=[];
  level.rocks.forEach(([x,z,r],i)=>this.island(x,z,r,i*2.1));this.lighthouse(...level.goal);
  level.gems.forEach(([x,z],i)=>{const g=new THREE.Group();g.position.set(x,1.7,z);const core=mesh(new THREE.OctahedronGeometry(.65),0xc4ffe5,g);core.material=new THREE.MeshStandardMaterial({color:0x99ffe1,emissive:0x4cebc3,emissiveIntensity:1,roughness:.2});const halo=new THREE.Mesh(new THREE.TorusGeometry(.95,.035,5,32),new THREE.MeshBasicMaterial({color:0xb2ffe5}));halo.rotation.x=Math.PI/2;g.add(halo);this.root.add(g);const ripple=ring(1.3,.08,0xc8ffe7,this.root,x,z);this.gems.push({g,ripple,i});});
  level.storms.forEach((s,i)=>{const g=new THREE.Group();cylinder(.65,.8,.9,0x3f3b5c,g,0,.45,0,8);const core=mesh(new THREE.IcosahedronGeometry(.65),0xfa716b,g,0,1.4,0);core.material=new THREE.MeshStandardMaterial({color:0xff8b76,emissive:0xc4334c,emissiveIntensity:.8});const aura=ring(s[4],.15,0xff827b,g);for(let j=0;j<5;j++){const a=j*1.256;mesh(new THREE.OctahedronGeometry(.18),0xdda6c4,g,Math.cos(a)*1.2,1.5,Math.sin(a)*1.2);}this.root.add(g);this.storms.push(g);});
  // Small distant islands frame the playable archipelago.
  for(let i=0;i<9;i++){const side=i%2?1:-1;this.island(side*(39+i%3*7),-45+i*12,3.5+i%3,i);}
  this.gulls=[];for(let i=0;i<7;i++){const g=new THREE.Group();for(let j=-1;j<=1;j+=2){const wing=mesh(new THREE.BoxGeometry(.7,.045,.18),0xfff1d5,g,j*.29,0,0);wing.rotation.z=j*.24;}this.root.add(g);this.gulls.push(g);}
  for(const tr of this.trails){tr.life=0;tr.m.material.opacity=0;}this.focus.set(level.start[0]*.35,0,level.start[1]-7);this.boat.position.set(level.start[0],.3,level.start[1]);
 }
 burst(x,z,color=0xb5ffe8){for(let i=0;i<16;i++){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.12),new THREE.MeshBasicMaterial({color,transparent:true}));m.position.set(x,1.5,z);this.scene.add(m);this.particles.push({m,v:new THREE.Vector3((Math.random()-.5)*5,2+Math.random()*3,(Math.random()-.5)*5),life:1});}}
 update(dt,t,run,mode){
  this.water.material.uniforms.time.value=t;const playing=mode==='play'||mode==='pause'||mode==='complete'||mode==='wreck';const bx=playing?run.x:Math.sin(t*.12)*6,bz=playing?run.z:11+Math.cos(t*.1)*3;
  this.boat.position.set(bx,.35+Math.sin(t*2.5)*.08,bz);this.boat.rotation.y=playing?run.angle:Math.sin(t*.15)*.45;this.boat.rotation.z=Math.sin(t*2.2)*.035;this.sail.rotation.y=Math.sin(t*1.7)*.06;
  if(playing){this.focus.x=THREE.MathUtils.lerp(this.focus.x,bx*.7,1-Math.exp(-dt*3));this.focus.z=THREE.MathUtils.lerp(this.focus.z,bz-7,1-Math.exp(-dt*3));}else{this.focus.lerp(new THREE.Vector3(-15,0,-5),1-Math.exp(-dt));}
  this.camera.position.set(this.focus.x,43,this.focus.z+34);this.camera.lookAt(this.focus.x,0,this.focus.z);this.boat.visible=!(run.invulnerable>0&&Math.floor(t*12)%2===0);
  this.gems.forEach(({g,ripple,i})=>{g.visible=ripple.visible=!run.collected.includes(i);g.position.y=1.6+Math.sin(t*2+i)*.25;g.rotation.y=t*.8+i;ripple.scale.setScalar(1+Math.sin(t*2+i)*.1);});
  this.storms.forEach((g,i)=>{const [x,z]=stormPosition(this.level.storms[i],run.time);g.position.set(x,0,z);g.rotation.y=t*.7;});
  const charged=run.collected.length===this.level.gems.length;this.goalRing.material.color.setHex(charged?0xffdf7d:0x96cac0);this.goalRing.scale.setScalar(1+Math.sin(t*2)*.035);this.lamp.material.color.setHex(mode==='complete'||charged?0xffefad:0x618e88);this.beam.visible=charged||mode==='complete'||!playing;this.beam.rotation.y=t*.35;
  this.gulls.forEach((g,i)=>{g.position.set(Math.sin(t*.12+i)*26,11+Math.sin(t*.8+i),Math.cos(t*.15+i)*28);g.rotation.y=t*.12+i;});
  this.trailClock+=dt;if(playing&&Math.hypot(run.vx,run.vz)>.5&&this.trailClock>.045){this.trailClock=0;for(const s of [-1,1]){const tr=this.trails[this.trailIndex++%this.trails.length];tr.life=1;tr.m.position.set(bx+Math.sin(run.angle)*1.5+s*.4,.03,bz+Math.cos(run.angle)*1.5);tr.m.rotation.z=-run.angle+s*.25;tr.m.scale.setScalar(run.dash>0?1.7:1);}}
  for(const tr of this.trails){tr.life=Math.max(0,tr.life-dt*.7);tr.m.material.opacity=tr.life*.45;}
  for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;p.m.position.addScaledVector(p.v,dt);p.v.y-=dt*6;p.m.material.opacity=p.life;if(p.life<=0){this.scene.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();this.particles.splice(i,1);}}
  this.renderer.render(this.scene,this.camera);
 }
 screenToWorld(x,y){this.ray.setFromCamera(new THREE.Vector2(x/innerWidth*2-1,-y/innerHeight*2+1),this.camera);const hit=new THREE.Vector3();return this.ray.ray.intersectPlane(this.plane,hit);}
 project(x,z){const p=new THREE.Vector3(x,0,z).project(this.camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};}
}
