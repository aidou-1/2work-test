#!/usr/bin/env python3
# Entraînement : dans les anneaux de la planète Titane. Planète géante éclairée en sphère (bandes nuageuses, terminateur,
# limbe vert acide), anneaux elliptiques à divisions qui passent derrière puis devant elle, ombres croisées,
# fragments d'obsidienne (éclats 3D du style Titane) au premier plan, étoiles. Rendu par pixel (numpy), puis compositing.
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter
rng=np.random.default_rng(5); W,H=900,1600; SS=2; w,h=W*SS,H*SS
X,Y=np.meshgrid(np.arange(w)/SS,np.arange(h)/SS)
def lisse(n,s):  # bruit lissé normalisé, à la taille de l'image
    a=gaussian_filter(rng.random((h//n,w//n)),s); a=(a-a.min())/(a.max()-a.min())
    return np.asarray(Image.fromarray((a*255).astype(np.uint8)).resize((w,h),Image.BICUBIC))/255
# ciel : voie lactée en diagonale avec bandes de poussière, nébuleuse filamenteuse, étoiles de couleurs et de tailles variées,
# deux lunes et une petite planète lointaine
o=np.zeros((h,w,3))+np.array([3,4,7.])
gx=(X-W*0.1)*np.cos(0.95)+(Y-H*0.05)*np.sin(0.95); gy=-(X-W*0.1)*np.sin(0.95)+(Y-H*0.05)*np.cos(0.95)
bande=np.exp(-(gy/(W*0.28))**2)*np.clip(1-gx/(H*1.2),0,1)
nuage=lisse(8,4); fil=lisse(2,2); poussiere=np.clip((lisse(5,3)-0.45)*3,0,1)
vl=bande*(0.45*nuage+0.35*fil)*(1-0.75*poussiere*bande)
o+=vl[...,None]*np.array([86,92,112.])
neb=lisse(10,5); fl=np.abs(np.sin(lisse(6,3)*12))  # filaments
nb=np.exp(-(((X-W*0.30)/(W*0.35))**2+((Y-H*0.22)/(H*0.16))**2))*neb**1.6*(0.6+0.4*fl)
o+=nb[...,None]*np.array([40,70,96.])+(nb**2)[...,None]*np.array([60,96,40.])
for k,(seuil,tmin,tmax,flou) in enumerate([(0.9975,.15,.55,0),(0.99965,.5,1,0.6),(0.99996,.9,1,1.6)]):
    et=rng.random((h,w))<(1-seuil)*(1+3*bande)
    teint=np.array([[255,250,240],[210,222,255],[255,226,190],[232,238,255]])[rng.integers(4,size=et.sum())]
    c=np.zeros((h,w,3)); c[et]=teint*rng.uniform(tmin,tmax,(et.sum(),1))
    o+=gaussian_filter(c,(flou,flou,0))*(1+flou*4) if flou else c
# petite planète lointaine (à gauche) et deux lunes
for (cx,cy,rr,col,ann) in [(W*0.16,H*0.15,W*0.045,(150,126,110),True),(W*0.83,H*0.09,W*0.018,(190,196,206),False),(W*0.62,H*0.30,W*0.011,(170,175,185),False)]:
    ddx,ddy=(X-cx)/rr,(Y-cy)/rr; dd=ddx*ddx+ddy*ddy; nzz=np.sqrt(np.clip(1-dd,0,1))
    ll=np.clip(-0.6*ddx-0.5*ddy+0.6*nzz,0,1)**1.2
    o=np.where((dd<1)[...,None],np.array(col)*ll[...,None]*(0.85+0.15*lisse(4,2))[...,None]+4,o)
    if ann:
        ax=(X-cx)*np.cos(-0.5)+(Y-cy)*np.sin(-0.5); ay=(-(X-cx)*np.sin(-0.5)+(Y-cy)*np.cos(-0.5))/0.25; ar=np.sqrt(ax*ax+ay*ay)/rr
        ring=(ar>1.4)&(ar<2.1)&~((dd<1)&(ay<0)); o=np.where(ring[...,None],o*0.5+np.array([170,160,150.])*0.45,o)
# planète : grande sphère en bas à droite
pcx,pcy,R=W*0.62,H*0.74,W*0.40
dx,dy=(X-pcx)/R,(Y-pcy)/R; r2=dx*dx+dy*dy; disque=r2<1; nz=np.sqrt(np.clip(1-r2,0,1))
L=np.array([-0.62,-0.55,0.56]); L/=np.linalg.norm(L)
lam=np.clip(dx*L[0]+dy*L[1]+nz*L[2],0,1)
tilt=-0.30; lat=(dy*np.cos(tilt)-dx*np.sin(tilt)); lon=(dx*np.cos(tilt)+dy*np.sin(tilt))/np.maximum(nz,0.05)
tur=lisse(6,5)
bandes=0.72+0.10*np.sin(lat*22+tur*1.6)+0.05*np.sin(lat*70+lon*0.3+tur*2.5)+0.08*(lisse(3,3)-0.5)
teinte=np.array([152,160,178.])+np.array([14,6,-10.])*np.sin(lat*14)[...,None]
pl=teinte*(bandes*(0.035+1.05*lam**0.9))[...,None]*(0.55+0.45*nz**0.4)[...,None]  # assombri au bord (limbe)
# anneaux : plan incliné autour de la planète, vu en biais
ang=-0.30; ex,ey=(X-pcx),(Y-pcy)
ux=ex*np.cos(ang)+ey*np.sin(ang); uy=(-ex*np.sin(ang)+ey*np.cos(ang))/0.26
rho=np.sqrt(ux*ux+uy*uy)/R
prof_r=gaussian_filter(rng.random(4000),6); prof_r=(prof_r-prof_r.min())/(prof_r.max()-prof_r.min())  # profil radial irrégulier, comme de vrais anneaux
fin=gaussian_filter(rng.random(4000),1.5); fin=(fin-fin.min())/(fin.max()-fin.min())
ir=np.clip(((rho-1.2)/1.3*3999).astype(int),0,3999)
dens=((rho>1.28)&(rho<2.35)).astype(float)*(0.35+0.65*prof_r[ir])*(0.8+0.2*fin[ir])
dens*=np.where((rho>1.83)&(rho<1.90),0.08,1)*np.where((rho>2.12)&(rho<2.15),0.2,1)  # divisions
dens*=np.clip((rho-1.28)/0.05,0,1)*np.clip((2.35-rho)/0.04,0,1)
devant=uy>0  # moitié de l'anneau entre nous et la planète
# ombre de la planète sur l'anneau (côté opposé au soleil) et ombre de l'anneau sur la planète
ombre_ann=np.clip(1-np.exp(-((ux/R*0.9+uy/R*0.5)-0.9)*3),0,1)*(ux>0)*(uy<0)
anneau_c=np.array([196,200,212.])*(0.55+0.45*(1-ombre_ann))[...,None]
o=np.where((dens>0)&~devant[...,None].squeeze()[...,None] if False else ((dens>0)&~devant)[...,None],o*(1-dens[...,None]*0.85)+anneau_c*dens[...,None]*0.85,o)
o=np.where(disque[...,None],pl,o)
# ombre portée de l'anneau sur la planète : bande décalée vers le bas
sy=uy+0.55*R/0.17*0.0; rho_s=np.sqrt(ux*ux+((-ex*np.sin(ang)+(ey+R*0.16)*np.cos(ang))/0.26)**2)/R
ds=((rho_s>1.28)&(rho_s<2.35))*(0.5+0.5*np.sin(rho_s*58)**2)
o=np.where(disque[...,None],o*(1-0.55*ds*lam)[...,None],o)
o=np.where((devant&(dens>0))[...,None],o*(1-dens[...,None]*0.8)+anneau_c*dens[...,None]*0.85,o)
# limbe : atmosphère vert acide côté jour
d=np.sqrt(r2); jour=np.clip((dx*L[0]+dy*L[1])/np.maximum(np.sqrt(r2),1e-3)*1.6,0,1)  # seulement le bord éclairé
lim=(0.8*np.exp(-((d-1)*R/2.2)**2)+0.35*np.exp(-((d-1)*R/12)**2))*jour
o+=lim[...,None]*np.array([168,236,92.])
# soleil hors champ : halo en haut à gauche, scintillement des grains d'anneau
g=np.exp(-((X/(W*0.5))**2+(Y/(H*0.3))**2)); o+=g[...,None]*np.array([46,46,54.])
sc=(rng.random((h,w))>0.997)&(dens>0.3); o[sc]=np.minimum(255,o[sc]+150)
img=Image.fromarray(np.clip(o,0,255).astype(np.uint8)).convert('RGBA')
# fragments : quelques-uns dans le plan de l'anneau, trois gros au premier plan (flous de profondeur)
ecl=[Image.open(f'fonds/eclat{i}.webp').convert('RGBA') for i in range(1,7)]
def poser(x,y,t,flou,rot):
    e=ecl[rng.integers(6)]; e=e.resize((max(4,int(e.width*t*SS)),max(4,int(e.height*t*SS))),Image.LANCZOS).rotate(rot,expand=True,resample=Image.BICUBIC)
    if flou: e=e.filter(ImageFilter.GaussianBlur(flou))
    img.alpha_composite(e,(int(x*SS-e.width/2),int(y*SS-e.height/2)))
pts=[]
for _ in range(26):
    th=rng.uniform(0.1,2.9); rr=rng.uniform(1.35,2.3)*R; uxx=rr*np.cos(th); uyy=rr*np.sin(th)*0.26
    x=pcx+uxx*np.cos(ang)-uyy*np.sin(ang); y=pcy+uxx*np.sin(ang)+uyy*np.cos(ang)
    if 0<x<W and 0<y<H: pts.append((y,x))
for y,x in sorted(pts): poser(x,y,0.18+0.5*(y/H)**2,0,rng.uniform(0,360))
for x,y,t,f in [(W*0.10,H*0.30,1.7,7),(W*0.86,H*0.12,1.2,4),(W*0.18,H*0.80,2.8,12)]: poser(x,y,t,f,rng.uniform(0,360))
img=img.convert('RGB').resize((W,H),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.0,40,2))
img.save('fonds/polaire-anneaux.png'); print('ok')
