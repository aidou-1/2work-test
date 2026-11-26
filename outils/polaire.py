#!/usr/bin/env python3
"""Fonds des 3 lieux de la planète Titane : V=pic (échauffements), (entraînement : voir outils/caverne.py), V=lac (retour au calme : lac gelé à bulles, aurore, planète à anneau).
Rendu du relief par lancer de rayons (terrain_V.png), puis finition (fond_V.png). Convertir ensuite en fonds/polaire-V.webp."""
# Planète polaire : relief de neige en champ de hauteurs, rendu par lancer de rayons (numpy), brume, ciel pâle, monolithe en titane à joints lumineux
import numpy as np, os
V=os.environ.get('V','pic')  # pic (échauffements), crete (entraînement), lac (retour au calme)
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
# pénitents de glace : forêt de lames effilées, alignées face au soleil, précalculée sur une grille fine
PX0,PZ0,PR=-16.,1.5,0.03; PEN=np.zeros((1300,1067),np.float32)
if V=='crete':
    rp=np.random.default_rng(11)
    for _ in range(7000):
        cx,cz=rp.uniform(-15,15),rp.uniform(2.5,40); ht=rp.uniform(1.1,3.4)*(1+0.35*np.clip((cz-4)/20,0,1)); rx,rz=rp.uniform(0.11,0.22),rp.uniform(0.25,0.5)
        i0,i1=int((cz-rz-PZ0)/PR),int((cz+rz-PZ0)/PR)+1; j0,j1=int((cx-rx-PX0)/PR),int((cx+rx-PX0)/PR)+1
        if i0<0 or j0<0 or i1>=PEN.shape[0] or j1>=PEN.shape[1]: continue
        zz=(np.arange(i0,i1)*PR+PZ0)[:,None]; xx=(np.arange(j0,j1)*PR+PX0)[None,:]
        d=np.sqrt(((xx-cx-(zz-cz)*0.35)/rx)**2+((zz-cz)/rz)**2)
        PEN[i0:i1,j0:j1]=np.maximum(PEN[i0:i1,j0:j1],ht*np.clip(1-d,0,1)**0.55)
    # surface de glace sculptée par le soleil : facettes et cannelures, pas des cônes lisses
    from scipy.ndimage import gaussian_filter
    rug=gaussian_filter(rp.random(PEN.shape),2.2); rug=(rug-rug.mean())/rug.std()
    can=np.sin(np.arange(PEN.shape[1])[None,:]*PR*26+gaussian_filter(rp.random(PEN.shape),8)*40)
    PEN=(PEN*(1+0.16*rug+0.09*can)).astype(np.float32)
def pen(x,z):
    u=(x-PX0)/PR; v=(z-PZ0)/PR; ok=(u>=0)&(v>=0)&(u<PEN.shape[1]-1)&(v<PEN.shape[0]-1)
    u=np.clip(u,0,PEN.shape[1]-1.001); v=np.clip(v,0,PEN.shape[0]-1.001); i=v.astype(int); j=u.astype(int); fu=u-j; fv=v-i
    r=PEN[i,j]*(1-fu)*(1-fv)+PEN[i,j+1]*fu*(1-fv)+PEN[i+1,j]*(1-fu)*fv+PEN[i+1,j+1]*fu*fv
    return np.where(ok,r,0)
def hauteur(x,z):
    loin=(lambda q: q*q*(3-2*q))(np.clip((z-18)/45,0,1))**1.3*h(x*0.5+17,z*0.5)*28  # montagnes au loin
    base=h(x,z)*7.5+h(x*3.1+5,z*3.1)*2.2+h(x*8.3+1,z*8.3+2)*0.45+loin
    cr=lambda k,o: 1-np.abs(2*h(x*k+o,z*k+o*0.7)-1)  # crêtes vives
    if V=='crete':  # chaîne de crêtes déchiquetées vue d'en haut
        return h(x,z)*1.5+h(x*8.3+1,z*8.3+2)*0.25+pen(x,z)+loin*1.1
    if V=='lac':  # lac gelé parfaitement plat au milieu d'un cirque de montagnes
        m=np.clip((np.sqrt((x/1.6)**2+(z-16)**2)-11)/9,0,1); m=m*m*(3-2*m)
        return 0.6+m*(base*0.3+(0.5*cr(0.6,3))**2*7*np.clip((z-12)/20,0,1))
    plateau=np.exp(-((x)**2+(z-14)**2)/18)
    # affleurement rocheux naturel au centre : bloc déchiqueté qui sort de la neige
    ro=np.exp(-(((x-0.4)/2.0)**2+((z-12.5)/1.4)**2))
    jag=0.45*cr(2.1,11)+0.3*cr(5.3,3)+0.17*cr(12,7)+0.08*cr(27,1)
    roche=ro**0.6*(0.6+4.2*jag**2.2)+np.exp(-(((x+1.6)/0.8)**2+((z-11.8)/0.7)**2))**0.8*(0.4+4.2*jag**2.4)
    return base*(1-0.7*plateau)+plateau*2.2+roche
W,Hh=900,1600
h0=float(hauteur(np.array([0.]),np.array([-1.]))[0]); hc=float(hauteur(np.array([0.]),np.array([14.]))[0]); print('sol',h0,hc)
cam=np.array([0.,h0+1.7,-1.0]); cible=np.array([0.,4.5,14.])
if V=='crete': cam=np.array([0.,h0+1.9,-1.0]); cible=np.array([0.,h0+1.6,16.])
if V=='lac': cam=np.array([0.,0.6+1.4,5.5]); cible=np.array([0.,2.6,24.])
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
L=np.array({'pic':[-0.6,0.55,-0.45],'crete':[-0.55,0.45,-0.7],'lac':[0.5,0.45,-0.3]}[V]); L/=np.linalg.norm(L)
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
pente=np.clip(({'pic':0.72,'crete':-1,'lac':0.6}[V]-Nn[...,1])/0.18,0,1)*np.where(t<40,1,0)
rocheC=np.stack([0.30,0.31,0.34])[None,None]*(0.55+0.9*dif*om)[...,None]*(0.8+0.5*grain)[...,None]
col=col*(1-pente[...,None])+rocheC*pente[...,None]
# ciel pâle et brume
ciel=np.stack([0.80,0.82,0.86])[None,None]+(np.clip(Y,0,1)*0.10)[...,None]*np.array([-0.08,-0.05,0.02])
brume=1-np.exp(-np.maximum(t,0)/{'pic':70,'crete':150,'lac':160}[V])
brume=np.where(hit,brume,1)[...,None]
if V=='lac':  # la glace du lac reflète le ciel, rayée de fines fissures
    gl=(np.sqrt((P[...,0]/1.6)**2+(P[...,2]-16)**2)<11.3)&hit
    fis=np.abs(np.sin(h(P[...,0]*4,P[...,2]*4)*40))<0.06
    glace=np.stack([0.42,0.47,0.56])[None,None]+(np.clip(-Y,0,1)*0.25)[...,None]*np.array([0.2,0.22,0.25])
    glace=np.where(fis[...,None],glace*1.25,glace)
    # bulles prises dans la glace : disques blancs en grappes verticales (gaz piégé)
    bx,bz=P[...,0]*1.6,P[...,2]*1.6; cx,cz=np.floor(bx),np.floor(bz)
    hsh=lambda a,b,k: (np.sin(a*12.9898+b*78.233+k)*43758.5453)%1
    for k in range(3):
        ox,oz,rr=hsh(cx,cz,k),hsh(cx,cz,k+7),0.05+0.16*hsh(cx,cz,k+3)**2
        on=hsh(cx,cz,k+11)<0.55*h(P[...,0]*0.3+3,P[...,2]*0.3)*1.6
        d=np.sqrt((bx-cx-ox)**2+(bz-cz-oz)**2)
        bulle=on&(d<rr)
        glace=np.where(bulle[...,None],glace*0.6+np.array([0.82,0.88,0.95])*0.55*np.clip(1-d/rr,0,1)[...,None]**0.3,glace)
    col=np.where(gl[...,None],glace,col)
if V=='crete':  # glace des pénitents : bleutée et translucide dans les creux
    pn=pen(P[...,0],P[...,2])>0.15
    hp=np.clip(pen(P[...,0],P[...,2])/2.4,0,1)[...,None]  # pointes plus blanches, bases bleu profond
    col=np.where(pn[...,None],col*(np.array([0.78,0.9,1.06])*(1-hp)+np.array([1.0,1.0,1.02])*hp)+np.array([0.02,0.06,0.12])*(1-dif)[...,None],col)
img=col*(1-brume)+ciel*brume
img=img+(rng.random((Hh,W))[...,None]-0.5)*0.025*(1-brume)
img=np.clip(img,0,1)
img=np.clip((img*0.86)**1.25*np.array([0.97,0.98,1.03]),0,1)
Image.fromarray((img*255).astype(np.uint8)).save('terrain_'+V+'.png')
np.save('cam_'+V+'.npy',np.stack([cam,f,r,u])); np.save('prof_'+V+'.npy',np.where(hit,t,200).astype(np.float32))
print('ok', hit.mean())

# --- finition ---
# profondeur de champ, brume claire qui fond les montagnes dans le ciel, ciel en dégradé, vignette douce
import numpy as np, os
V=os.environ.get('V','pic')
from PIL import Image, ImageFilter
im=Image.open('terrain_'+V+'.png').convert('RGB'); t=np.load('prof_'+V+'.npy')
a=np.asarray(im).astype(float); b=np.asarray(im.filter(ImageFilter.GaussianBlur(3))).astype(float); c=np.asarray(im.filter(ImageFilter.GaussianBlur(0.8))).astype(float)
w=np.clip((5-t)/3,0,1)[...,None]*(0.25 if V!='pic' else 1)
o=c*(1-w)+b*w
H,W=t.shape; y=np.linspace(0,1,H)[:,None]; x=np.linspace(-1,1,W)[None,:]
horiz,haut={'pic':([222,224,230.],[176,181,192.]),'crete':([246,214,186.],[120,140,176.]),'lac':([120,132,156.],[22,30,48.])}[V]; horiz,haut=np.array(horiz),np.array(haut)
ciel=haut+(horiz-haut)*np.clip(y/0.30,0,1)[...,None]
f=np.clip(1-np.exp(-t/48),0,1)[...,None]; f=np.where(t[...,None]>150,1,f*0.92)
o=o*(1-f)+ciel*f
# lueur vert acide qui filtre d'une fente au pied des rochers (projetée avec la caméra du rendu)
cam,fw,rw,uw=np.load('cam_'+V+'.npy')
def proj(P):
    d=P-cam; z=d@fw; return ((d@rw)/z/0.56+1)/2*W, (1-(d@uw)/z/(0.56*H/W))/2*H
gx,gy=proj(np.array([-0.55,float(np.load('cam_'+V+'.npy')[0][1])-1.9,11.6]))
X,Y=np.meshgrid(np.arange(W),np.arange(H))
g=np.exp(-(((X-gx)/11)**2+((Y-gy)/32)**2))*0.95+np.exp(-(((X-gx)/60)**2+((Y-gy)/50)**2))*0.35
if V=='pic': o=o*(1-g[...,None])+np.array([210,248,130.])*g[...,None]
if V=='lac':
    from scipy.ndimage import gaussian_filter
    # planète géante à anneau, basse dans le ciel (derrière l'aurore)
    px,py,pr=W*0.74,H*0.25,W*0.15; d=np.sqrt((X-px)**2+(Y-py)**2); ciel_=t>150
    ang=-0.3; xr=(X-px)*np.cos(ang)-(Y-py)*np.sin(ang); yr=(X-px)*np.sin(ang)+(Y-py)*np.cos(ang)
    e=np.sqrt((xr/(pr*2.2))**2+(yr/(pr*0.45))**2)
    anneau=(e>0.74)&(e<0.98)&ciel_; ann_c=np.array([200,206,220.])*(0.55+0.45*np.sin(e*70)**2)[...,None]
    o=np.where((anneau&(yr<0))[...,None],o*0.65+ann_c*0.35,o)  # moitié arrière de l'anneau
    disque=(d<pr)&ciel_;  lum=np.clip(((X-px)*-0.7+(Y-py)*-0.5)/pr*0.7+0.5,0.04,1)**1.3
    bandes=0.85+0.15*np.sin((Y-py)/pr*9+np.sin((X-px)/pr*2)*0.6)
    dsq=np.clip((pr-d)/3,0,1)[...,None]*0.82  # bord adouci, voilé par l'atmosphère
    o=o*(1-dsq)+(np.array([168,176,198.])*(lum*bandes)[...,None]+np.array([40,48,66.]))*dsq
    o=np.where((anneau&(yr>=0))[...,None],o*0.55+ann_c*0.45,o)  # moitié avant, devant la planète
    # aurore : rideaux plissés avec des rayons verticaux nets
    yy=np.linspace(0,1,H)[:,None]; xx=np.linspace(0,1,W)[None,:]
    bord=0.10+0.07*np.sin(xx*6+1.3)+0.025*np.sin(xx*21)
    rideau=np.clip((yy-bord)/0.03,0,1)*np.exp(-np.clip(yy-bord,0,None)/0.13)
    rais=gaussian_filter(np.random.default_rng(2).random(W),1.0); rais=(rais-rais.min())/(rais.max()-rais.min())
    a=np.clip(rideau*(0.25+0.9*rais[None,:]**1.6),0,1)*(0.7+0.3*np.sin(xx*30+yy*8)**2)
    a=gaussian_filter(a,(2.5,0.6))*ciel_
    o=o+a[...,None]*np.array([140,235,105.])*1.05+gaussian_filter(a,12)[...,None]*np.array([60,120,60.])*0.6
    # reflet de l'aurore et de la planète sur la glace, sous la rive
    hz=int(H*0.555); n=min(hz,H-hz); rr=np.zeros_like(a); rr[hz:hz+n]=gaussian_filter(a[hz-n:hz][::-1],(10,3))
    o=o+rr[...,None]*np.array([140,235,105.])*0.14
if V=='crete': o=np.clip((o-128)*1.12+128,0,255)*np.array([1.04,1.0,0.95])
v=1-0.12*(x**2)-0.10*np.clip(y-0.75,0,1)*4
o=o*v[...,None]
Image.fromarray(np.clip(o,0,255).astype(np.uint8)).save('fond_'+V+'.png')
