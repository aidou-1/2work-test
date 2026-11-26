#!/usr/bin/env python3
"""Fond de la planète Titane (fonds/polaire.webp) : relief de neige par lancer de rayons, piton rocheux, puis brume, flou de premier plan et lueur de la fente. Écrit terrain.png, puis terrain2.png à convertir en webp."""
# Planète polaire : relief de neige en champ de hauteurs, rendu par lancer de rayons (numpy), brume, ciel pâle, monolithe en titane à joints lumineux
import numpy as np
from PIL import Image, ImageFilter
rng=np.random.default_rng(7)
N=2048
def bruit(n,o):  # bruit de valeur lissé, plusieurs octaves
    out=np.zeros((n,n))
    for k in range(o):
        f=2**(k+2); g=rng.random((f+1,f+1))
        x=np.linspace(0,f,n,endpoint=False); i=x.astype(int); t=x-i; t=t*t*(3-2*t)
        a=g[i][:,i]; b=g[i+1][:,i]; c=g[i][:,i+1]; d=g[i+1][:,i+1]
        T=t[:,None]; S=t[None,:]
        v=a*(1-T)*(1-S)+b*T*(1-S)+c*(1-T)*S+d*T*S
        out+=v*0.5**k
    return out/ (2-0.5**(o-1))
H=bruit(N,10)
R=bruit(N,5)  # crêtes
H=0.55*H+0.45*(1-np.abs(2*R-1))**2
# monde : x,z dans [-60,60], y hauteur
S=120.0
def h(x,z):
    u=((x+60)/S*N)%N; v=((z+60)/S*N)%N
    i=u.astype(int); j=v.astype(int); fu=u-i; fv=v-j; fu=fu*fu*(3-2*fu); fv=fv*fv*(3-2*fv); i1=(i+1)%N; j1=(j+1)%N
    return (H[j,i]*(1-fu)*(1-fv)+H[j,i1]*fu*(1-fv)+H[j1,i]*(1-fu)*fv+H[j1,i1]*fu*fv)
def hauteur(x,z):
    d=np.sqrt(x*x+(z-30)**2)
    base=h(x,z)*7.5+h(x*3.1+5,z*3.1)*2.2+h(x*8.3+1,z*8.3+2)*0.45+ (lambda q: q*q*(3-2*q))(np.clip((z-18)/45,0,1))**1.3*h(x*0.5+17,z*0.5)*28  # montagnes au loin
    plateau=np.exp(-((x)**2+(z-14)**2)/18)  # replat sous le monolithe
    # affleurement rocheux naturel au centre : bloc déchiqueté qui sort de la neige
    ro=np.exp(-(((x-0.4)/2.0)**2+((z-12.5)/1.4)**2))
    cr=lambda k,o: 1-np.abs(2*h(x*k+o,z*k+o*0.7)-1)  # crêtes vives
    jag=0.45*cr(2.1,11)+0.3*cr(5.3,3)+0.17*cr(12,7)+0.08*cr(27,1)
    roche=ro**0.6*(0.6+4.2*jag**2.2)+np.exp(-(((x+1.6)/0.8)**2+((z-11.8)/0.7)**2))**0.8*(0.4+4.2*jag**2.4)
    return base*(1-0.7*plateau)+plateau*2.2+roche
W,Hh=900,1600
h0=float(hauteur(np.array([0.]),np.array([-1.]))[0]); hc=float(hauteur(np.array([0.]),np.array([14.]))[0]); print('sol',h0,hc)
cam=np.array([0.,h0+1.7,-1.0]); cible=np.array([0.,4.5,14.])
f=cible-cam; f/=np.linalg.norm(f); r=np.cross([0,1,0],f); r/=np.linalg.norm(r); u=np.cross(f,r)
px=(np.arange(W)+.5)/W*2-1; py=1-(np.arange(Hh)+.5)/Hh*2
X,Y=np.meshgrid(px*0.56,py*0.56*Hh/W)
D=f[None,None]+X[...,None]*r+Y[...,None]*u; D/=np.linalg.norm(D,axis=2,keepdims=True)
t=np.full((Hh,W),0.3); tp=t.copy(); hit=np.zeros((Hh,W),bool); tmax=120
for k in range(900):
    m=~hit & (t<tmax)
    if not m.any(): break
    p=cam+D[m]*t[m][:,None]
    dy=p[:,1]-hauteur(p[:,0],p[:,2])
    h2=dy<0; tt=t[m]
    tp[m]=np.where(h2,tp[m],tt)
    t[m]=np.where(h2,tt,tt+np.maximum(0.03,np.maximum(dy*0.22,tt*0.0025)))
    hh=hit[m]; hh|=h2; hit[m]=hh
# affinage par dichotomie entre le dernier point au-dessus et le premier en dessous
a=tp.copy(); b=t.copy()
for k in range(10):
    c=(a+b)/2; Pc=cam+D*c[...,None]; dn=Pc[...,1]-hauteur(Pc[...,0],Pc[...,2])<0
    b=np.where(hit&dn,c,b); a=np.where(hit&~dn,c,a)
t=np.where(hit,b,t)
P=cam+D*t[...,None]
e=0.08
hx=(hauteur(P[...,0]+e,P[...,2])-hauteur(P[...,0]-e,P[...,2]))/(2*e)
hz=(hauteur(P[...,0],P[...,2]+e)-hauteur(P[...,0],P[...,2]-e))/(2*e)
Nn=np.stack([-hx,np.ones_like(hx),-hz],-1); Nn/=np.linalg.norm(Nn,axis=-1,keepdims=True)
fb=lambda x,z: (h(x*14,z*14)*0.16+h(x*40+3,z*40)*0.05)*(1+6*np.exp(-(((x-0.0)/2.8)**2+((z-12.3)/1.8)**2)))
hx+=(fb(P[...,0]+e,P[...,2])-fb(P[...,0]-e,P[...,2]))/(2*e); hz+=(fb(P[...,0],P[...,2]+e)-fb(P[...,0],P[...,2]-e))/(2*e)
Nn=np.stack([-hx,np.ones_like(hx),-hz],-1); Nn/=np.linalg.norm(Nn,axis=-1,keepdims=True)
L=np.array([-0.6,0.55,-0.45]); L/=np.linalg.norm(L)
dif=np.clip((Nn*L).sum(-1),0,1)
L=L/np.linalg.norm(L); om=np.ones((Hh,W)); q=P+Nn*0.05; ts=np.full((Hh,W),0.15)
for k in range(70):
    Q=q+L*ts[...,None]; d=Q[...,1]-hauteur(Q[...,0],Q[...,2]); om=np.minimum(om,np.clip(2.5*d/ts,0,1)); ts+=np.clip(d*0.6,0.08,1.5)
om=np.where(hit,om,1)
amb=0.55+0.45*Nn[...,1]
grain=0.7*h(P[...,0]*9,P[...,2]*9)+0.3*h(P[...,0]*25+3,P[...,2]*25)  # texture de neige
col=np.stack([0.80,0.83,0.89])[None,None]*(0.42*amb)[...,None]+np.stack([0.95,0.95,0.97])[None,None]*(0.80*dif*om)[...,None]
col=col*(0.86+0.28*grain)[...,None]
# roche à nu sur les pentes raides (la neige ne tient pas), neige sur le reste
pente=np.clip((0.72-Nn[...,1])/0.18,0,1)*np.where(t<40,1,0)
rocheC=np.stack([0.30,0.31,0.34])[None,None]*(0.55+0.9*dif*om)[...,None]*(0.8+0.5*grain)[...,None]
col=col*(1-pente[...,None])+rocheC*pente[...,None]
# ciel pâle et brume
ciel=np.stack([0.80,0.82,0.86])[None,None]+(np.clip(Y,0,1)*0.10)[...,None]*np.array([-0.08,-0.05,0.02])
brume=1-np.exp(-np.maximum(t,0)/70)
brume=np.where(hit,brume,1)[...,None]
img=col*(1-brume)+ciel*brume
img=img+(rng.random((Hh,W))[...,None]-0.5)*0.025*(1-brume)
img=np.clip(img,0,1)
img=np.clip((img*0.86)**1.25*np.array([0.97,0.98,1.03]),0,1)
Image.fromarray((img*255).astype(np.uint8)).save('terrain.png')
np.save('cam.npy',np.stack([cam,f,r,u])); np.save('profondeur.npy',np.where(hit,t,200).astype(np.float32))
print('ok', hit.mean())

# --- finition ---
# profondeur de champ, brume claire qui fond les montagnes dans le ciel, ciel en dégradé, vignette douce
import numpy as np
from PIL import Image, ImageFilter
im=Image.open('terrain.png').convert('RGB'); t=np.load('profondeur.npy')
a=np.asarray(im).astype(float); b=np.asarray(im.filter(ImageFilter.GaussianBlur(3))).astype(float); c=np.asarray(im.filter(ImageFilter.GaussianBlur(0.8))).astype(float)
w=np.clip((5-t)/3,0,1)[...,None]
o=c*(1-w)+b*w
H,W=t.shape; y=np.linspace(0,1,H)[:,None]; x=np.linspace(-1,1,W)[None,:]
horiz=np.array([222,224,230.]); haut=np.array([176,181,192.])
ciel=haut+(horiz-haut)*np.clip(y/0.30,0,1)[...,None]
f=np.clip(1-np.exp(-t/48),0,1)[...,None]; f=np.where(t[...,None]>150,1,f*0.92)
o=o*(1-f)+ciel*f
# lueur vert acide qui filtre d'une fente au pied des rochers (projetée avec la caméra du rendu)
cam,fw,rw,uw=np.load('cam.npy')
def proj(P):
    d=P-cam; z=d@fw; return ((d@rw)/z/0.56+1)/2*W, (1-(d@uw)/z/(0.56*H/W))/2*H
gx,gy=proj(np.array([-0.55,float(np.load('cam.npy')[0][1])-1.9,11.6]))
X,Y=np.meshgrid(np.arange(W),np.arange(H))
g=np.exp(-(((X-gx)/11)**2+((Y-gy)/32)**2))*0.95+np.exp(-(((X-gx)/60)**2+((Y-gy)/50)**2))*0.35
o=o*(1-g[...,None])+np.array([210,248,130.])*g[...,None]
v=1-0.12*(x**2)-0.10*np.clip(y-0.75,0,1)*4
o=o*v[...,None]
Image.fromarray(np.clip(o,0,255).astype(np.uint8)).save('terrain2.png')
