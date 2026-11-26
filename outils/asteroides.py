#!/usr/bin/env python3
# Astéroïdes réalistes (fonds/eclat1-6.webp) : roche sombre déchiquetée, rendue par lancer de rayons sur champ de distance,
# lumière dorée rasante venue d'en haut (comme le faisceau de l'accueil) et liseré chaud sur les arêtes ; fond transparent.
import numpy as np
from PIL import Image
def hsh(x,y,z): return (np.sin(x*127.1+y*311.7+z*74.7)*43758.5453)%1
def bruit(x,y,z):
    xi,yi,zi=np.floor(x),np.floor(y),np.floor(z); fx,fy,fz=x-xi,y-yi,z-zi
    fx,fy,fz=fx*fx*(3-2*fx),fy*fy*(3-2*fy),fz*fz*(3-2*fz); r=0
    for a in (0,1):
        for b in (0,1):
            for c in (0,1): r=r+hsh(xi+a,yi+b,zi+c)*(fx if a else 1-fx)*(fy if b else 1-fy)*(fz if c else 1-fz)
    return r
def rocher(graine,S=320):
    g=np.random.default_rng(graine); ax=g.uniform(0.7,1.3,3); o=g.uniform(0,50,3)
    PL=[]
    for k in range(11):
        v=g.normal(size=3); v/=np.linalg.norm(v); PL.append((*v,g.uniform(0.55,0.85)))
    def sdf(x,y,z):
        d=np.sqrt((x/ax[0])**2+(y/ax[1])**2+(z/ax[2])**2)-1
        # grandes faces taillées (plans) + relief rocheux à plusieurs échelles
        for (nx,ny,nz,c) in PL:  # faces taillées comme un éclat de roche
            d=np.maximum(d,x*nx+y*ny+z*nz-c)
        f=lambda s,a: (bruit(x*s+o[0],y*s+o[1],z*s+o[2])-0.5)*a
        return d+f(1.4,0.32)+f(3.5,0.10)+f(9,0.05)+f(21,0.02)
    px=(np.arange(S)+.5)/S*2-1; X,Y=np.meshgrid(px*1.7,-px*1.7)
    t=np.full((S,S),0.0); hit=np.zeros((S,S),bool); act=np.ones((S,S),bool); oz=-4.0
    for _ in range(90):
        z=oz+t[act]; d=sdf(X[act],Y[act],z); hh=d<0.002
        tt=t[act]+np.maximum(d*0.55,0.002); t[act]=tt; hit[act]=hh; a=act[act]; a&=~hh&(tt<8); act[act]=a
        if not act.any(): break
    Z=oz+t; e=0.01
    n=np.stack([sdf(X+e,Y,Z)-sdf(X-e,Y,Z),sdf(X,Y+e,Z)-sdf(X,Y-e,Z),sdf(X,Y,Z+e)-sdf(X,Y,Z-e)],-1); n/=np.linalg.norm(n,axis=-1,keepdims=True)+1e-9
    L=np.array([0.25,0.85,0.45]); L/=np.linalg.norm(L)  # lumière dorée venue d'en haut
    dif=np.clip((n*L).sum(-1),0,1); rim=np.clip(1-np.abs(n[...,2]),0,1)**3*np.clip(n[...,1]+0.3,0,1)
    H=L+np.array([0,0,-1.]); H/=np.linalg.norm(H); spec=np.clip((n*H).sum(-1),0,1)**28  # reflet satiné sur les faces
    gr=0.85+0.3*bruit(X*14,Y*14,Z*14)
    ao=np.clip(sdf(X+n[...,0]*0.15,Y+n[...,1]*0.15,Z+n[...,2]*0.15)/0.15,0,1)
    col=(np.array([0.07,0.065,0.06])+np.array([0.95,0.74,0.48])*(dif**1.6*0.85)[...,None]+np.array([1.0,0.82,0.55])*(rim*0.7)[...,None]+np.array([1.0,0.88,0.66])*(spec*0.6)[...,None])*gr[...,None]*(0.55+0.45*ao)[...,None]
    # filons blancs : fines veines lumineuses qui courent dans la roche (énergie prise dans la pierre)
    v1=np.abs(bruit(X*2.2+o[1],Y*2.2,Z*2.2+o[2])-0.5)<0.011; v2=np.abs(bruit(X*4.5+9,Y*4.5+o[0],Z*4.5)-0.5)<0.006
    veine=((v1|v2)&hit&(bruit(X*1.1+3,Y*1.1,Z*1.1)>0.42)).astype(float)
    from scipy.ndimage import gaussian_filter
    halo=gaussian_filter(veine,2.2)*0.9+gaussian_filter(veine,0.6)*0.9
    col=col*(1-np.clip(halo,0,1))[...,None]+np.array([1.0,0.99,0.95])*np.clip(halo,0,1)[...,None]
    img=np.dstack([np.clip(col,0,1)**(1/1.1)*255,hit*255]).astype(np.uint8)
    im=Image.fromarray(img,'RGBA'); return im.crop(im.getbbox())
for i in range(1,7):
    r=rocher(i*7+3); r.thumbnail((240,240),Image.LANCZOS); r.save(f'fonds/eclat{i}.webp',quality=90); print(i,r.size)
