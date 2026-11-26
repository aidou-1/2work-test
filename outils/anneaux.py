#!/usr/bin/env python3
# Entraînement : dans les anneaux de la planète Titane. Planète géante en bas (bandes, limbe vert acide),
# anneaux en perspective faits de milliers de fragments (éclats rendus en 3D du style Titane), étoiles et nébuleuse.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
rng=np.random.default_rng(5); W,H=900,1600; S=2
X,Y=np.meshgrid(np.arange(W),np.arange(H))
# ciel : noir profond, nébuleuse froide, étoiles
from scipy.ndimage import gaussian_filter
neb=gaussian_filter(rng.random((H//8,W//8)),7); neb=(neb-neb.min())/(neb.max()-neb.min())
neb=np.asarray(Image.fromarray((neb*255).astype(np.uint8)).resize((W,H),Image.BICUBIC))/255
o=np.zeros((H,W,3))+np.array([5,6,9.])
o+=(neb**3)[...,None]*np.array([40,52,78.])*np.clip(1-Y/H*1.3,0,1)[...,None]
et=rng.random((H,W)); o[et>0.9985]=np.array([230,235,245.])*rng.uniform(.4,1,(np.sum(et>0.9985),1))
# planète géante : centre très bas, on voit sa courbure et ses bandes
pcx,pcy,pr=W*0.42,H*1.62,H*1.05
d=np.sqrt((X-pcx)**2+(Y-pcy)**2); dans=d<pr
lat=(Y-pcy)/pr; tur=gaussian_filter(rng.random((H//4,W//4)),4); tur=np.asarray(Image.fromarray(((tur-tur.min())/(tur.max()-tur.min())*255).astype(np.uint8)).resize((W,H),Image.BICUBIC))/255
bandes=0.72+0.13*np.sin(lat*46+np.sin((X-pcx)/pr*3)*1.2+tur*2.5)+0.07*np.sin(lat*130+(X-pcx)/pr*2+tur*4)+0.06*(tur-0.5)
lum=np.clip(((X-pcx)*-0.55+(Y-pcy)*-0.8)/pr,0,1)**1.4  # éclairée par le haut gauche
pl=(np.array([150,158,176.])+np.array([10,0,-12.])*np.sin(lat*20)[...,None])*(bandes*(0.06+1.0*lum))[...,None]
# ombre des anneaux portée sur la planète : bande sombre courbe
om_=np.exp(-((Y-(H*0.70+(X-W*0.5)*0.12))/26)**2)*dans; pl=pl*(1-0.55*om_)[...,None]
o=np.where(dans[...,None],pl,o)
# limbe : fine atmosphère vert acide qui s'éteint côté ombre
lim=np.exp(-((d-pr)/6)**2)*np.clip(lum*1.6,0,1)+np.exp(-((d-pr)/26)**2)*0.35*np.clip(lum*1.6,0,1)
o+=lim[...,None]*np.array([170,235,95.])
img=Image.fromarray(np.clip(o,0,255).astype(np.uint8)).resize((W*S,H*S),Image.BICUBIC).convert('RGBA')
# anneaux : plan incliné qui traverse l'écran ; fragments plus gros et plus nets au premier plan
eclats=[Image.open(f'fonds/eclat{i}.webp').convert('RGBA') for i in range(1,7)]
ang=np.deg2rad(-17); cx0,cy0=W*0.5,H*0.47
calque=Image.new('RGBA',img.size,(0,0,0,0)); dr=ImageDraw.Draw(calque)
# poussière des anneaux : bande de points fins, plusieurs sous-anneaux avec des vides
for _ in range(60000):
    u=rng.uniform(-1.4,1.4)*W; v=rng.normal(0,1)
    r_=abs(v); dens=(np.sin(r_*7)**2*0.7+0.3)*(r_<2.6)
    if rng.random()>dens: continue
    ep=26+34*(u/W+1.4)/2.8  # le plan s'épaissit vers la droite (plus proche)
    x=cx0+u*np.cos(ang)-v*ep*np.sin(ang); y=cy0+u*np.sin(ang)+v*ep*np.cos(ang)
    b=int(rng.uniform(90,230)); a=int(rng.uniform(60,200)); s=rng.uniform(0.6,1.6)*S
    dr.ellipse([x*S-s,y*S-s,x*S+s,y*S+s],fill=(b,b+4,min(255,b+14),a))
calque=calque.filter(ImageFilter.GaussianBlur(0.6))
img=Image.alpha_composite(img,calque)
# gros fragments (éclats 3D) : du fond vers l'avant, éclairés en haut à gauche
fr=[]
for _ in range(70):
    u=rng.uniform(-0.75,0.75)*W; v=rng.normal(0,0.9); z=rng.uniform(0,1)
    ep=26+34*(u/W+1.4)/2.8
    x=cx0+u*np.cos(ang)-v*ep*np.sin(ang); y=cy0+u*np.sin(ang)+v*ep*np.cos(ang)
    fr.append((z,x,y))
for z,x,y in sorted(fr):
    e=eclats[rng.integers(6)]; t=(0.12+0.9*z**2.2)*S; e=e.resize((max(4,int(e.width*t)),max(4,int(e.height*t))),Image.LANCZOS).rotate(rng.uniform(0,360),expand=True,resample=Image.BICUBIC)
    if z<0.5: e=e.filter(ImageFilter.GaussianBlur(0.4))
    img.alpha_composite(e,(int(x*S-e.width/2),int(y*S-e.height/2)))
# trois gros blocs au premier plan, flous (profondeur), pour l'échelle
for (x,y,t) in [(W*0.08,H*0.70,2.6),(W*0.93,H*0.33,2.1),(W*0.78,H*0.86,3.4)]:
    e=eclats[rng.integers(6)]; e=e.resize((int(e.width*t*S),int(e.height*t*S)),Image.LANCZOS).rotate(rng.uniform(0,360),expand=True).filter(ImageFilter.GaussianBlur(11))
    img.alpha_composite(e,(int(x*S-e.width/2),int(y*S-e.height/2)))
img=img.convert('RGB').resize((W,H),Image.LANCZOS)
# lumière du soleil (hors champ, en haut à gauche) qui accroche la poussière
a=np.asarray(img).astype(float); g=np.exp(-(((X-W*0.05)/(W*0.6))**2+((Y-H*0.05)/(H*0.4))**2))
a=a+g[...,None]*np.array([40,40,46.])
Image.fromarray(np.clip(a,0,255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(1.2,40,2)).save('fonds/polaire-anneaux.png'); print('ok')
