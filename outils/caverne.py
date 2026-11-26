#!/usr/bin/env python3
# Caverne de glace (Entraînement) : tunnel sculpté rendu par lancer de rayons sur champ de distance 3D (numpy),
# parois de glace bleue festonnées, sortie lumineuse au fond, veines vert acide dans la glace
import numpy as np
from PIL import Image, ImageFilter
W,H=720,1280
def hsh(x,y,z): return (np.sin(x*127.1+y*311.7+z*74.7)*43758.5453)%1
def bruit(x,y,z):
    xi,yi,zi=np.floor(x),np.floor(y),np.floor(z); fx,fy,fz=x-xi,y-yi,z-zi
    fx,fy,fz=fx*fx*(3-2*fx),fy*fy*(3-2*fy),fz*fz*(3-2*fz); r=0
    for a in (0,1):
        for b in (0,1):
            for c in (0,1):
                r=r+hsh(xi+a,yi+b,zi+c)*(fx if a else 1-fx)*(fy if b else 1-fy)*(fz if c else 1-fz)
    return r
def fbm(x,y,z): return 0.55*bruit(x,y,z)+0.3*bruit(x*2.1+5,y*2.1,z*2.1)+0.15*bruit(x*4.3,y*4.3+3,z*4.3)
def centre(z): return 1.1*np.sin(z*0.13), 0.25*np.sin(z*0.21+1)
def sdf(x,y,z):
    cx,cy=centre(z); r=2.3+0.5*np.sin(z*0.31)+np.clip((z-24)/3,0,None)**2*0.8  # s'ouvre vers la sortie
    d=r-np.sqrt((x-cx)**2+((y-cy)*1.2)**2)
    d=np.minimum(d,y+1.35+0.12*bruit(x*1.5,0,z*1.5))  # sol de glace plus plat
    d=d+0.55*(fbm(x*0.7,y*0.7,z*0.7)-0.5)+0.06*np.abs(np.sin(bruit(x*3,y*3,z*3)*9))  # festons de fonte
    return d
cam=np.array([0.,-0.2,0.]); cib=np.array([0.6,0.0,12.])
f=cib-cam; f/=np.linalg.norm(f); r=np.cross([0,1,0],f); r/=np.linalg.norm(r); u=np.cross(f,r)
px=(np.arange(W)+.5)/W*2-1; py=1-(np.arange(H)+.5)/H*2
X,Y=np.meshgrid(px*0.62,py*0.62*H/W)
D=f+X[...,None]*r+Y[...,None]*u; D/=np.linalg.norm(D,axis=2,keepdims=True)
t=np.full((H,W),0.1); hit=np.zeros((H,W),bool); act=np.ones((H,W),bool)
for k in range(140):
    m=act; P=cam+D[m]*t[m][:,None]; d=sdf(P[:,0],P[:,1],P[:,2])
    tt=t[m]+np.maximum(d*0.6,0.004); hh=d<0.006
    t[m]=tt; hit[m]=hh; a=act[m]; a&=~hh&(tt<42); act[m]=a
    if not act.any(): break
P=cam+D*t[...,None]; e=0.02
nx=sdf(P[...,0]+e,P[...,1],P[...,2])-sdf(P[...,0]-e,P[...,1],P[...,2])
ny=sdf(P[...,0],P[...,1]+e,P[...,2])-sdf(P[...,0],P[...,1]-e,P[...,2])
nz=sdf(P[...,0],P[...,1],P[...,2]+e)-sdf(P[...,0],P[...,1],P[...,2]-e)
N=-np.stack([nx,ny,nz],-1); N/=np.linalg.norm(N,axis=-1,keepdims=True)+1e-9
# lumière : la sortie au fond (lumière du jour) + une lueur froide diffuse dans la glace
Ls=np.array([1.0,0.6,27.]); vL=Ls-P; dist=np.linalg.norm(vL,axis=-1); vL/=dist[...,None]
dif=np.clip((N*vL).sum(-1),0,1); att=1/(1+(dist/13)**2)
fres=np.clip(1+(N*D).sum(-1),0,1)**3
prof=np.array([0.07,0.22,0.42]); clair=np.array([0.55,0.86,1.0]); blanc=np.array([0.92,0.97,1.0])
k=np.clip(dif*att*2.6+0.12,0,1)[...,None]
col=prof*(1-k)+clair*k+blanc*(fres*att*1.5)[...,None]*0.5
col=col*(0.8+0.4*fbm(P[...,0]*2,P[...,1]*2,P[...,2]*2))[...,None]
# veines vert acide prises dans la glace
# occlusion : les creux des festons s'assombrissent
ao=np.clip(sdf(*(P+N*0.25).transpose(2,0,1))/0.25,0,1)[...,None]
col=col*(0.72+0.28*ao)
vein=(np.abs(bruit(P[...,0]*0.9+7,P[...,1]*0.9,P[...,2]*0.35)-0.5)<0.006*(1+t/10))&(bruit(P[...,0]*0.4,P[...,1]*0.4+9,P[...,2]*0.4)>0.55)&hit
sol=(N[...,1]>0.75)&hit; col=np.where(sol[...,None],col*0.75+np.array([0.75,0.85,0.95])*0.25*k,col)  # givre au sol
# sortie : lumière blanche aveuglante et brume qui grandit vers elle
ciel=np.array([0.95,0.98,1.0]); brume=np.clip(1-np.exp(-np.maximum(t-6,0)/22),0,1)[...,None]
img=np.where(hit[...,None],col*(1-brume)+np.array([0.62,0.82,0.96])*brume,ciel)
img=np.clip(img,0,1)**(1/1.15)
im=Image.fromarray((img*255).astype(np.uint8))
# veines vert acide : fines lignes lumineuses avec un halo, prises dans la glace
vm=Image.fromarray((vein*255).astype(np.uint8)); g1=np.asarray(vm.filter(ImageFilter.GaussianBlur(1.2)))/255; g2=np.asarray(vm.filter(ImageFilter.GaussianBlur(7)))/255
a=np.asarray(im).astype(float); a=a+np.array([200,250,120.])*(g1*0.9+g2*0.8)[...,None]
im=Image.fromarray(np.clip(a,0,255).astype(np.uint8))
lum=im.filter(ImageFilter.GaussianBlur(18)); im=Image.blend(im,Image.fromarray(np.clip(np.asarray(im).astype(int)+np.asarray(lum).astype(int)//3,0,255).astype(np.uint8)),0.6)  # halo autour de la sortie
im=im.resize((900,1600),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.5,50,3))
im.save('fond_crete.png'); print('ok',hit.mean())
