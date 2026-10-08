#!/usr/bin/env python3
"""Support de pitch. Dépendances : reportlab. Chiffres issus du JSON livré."""
from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/pitch/support-presentation.pdf"
DATA = json.loads((ROOT / "public/data/experience-data.json").read_text())
W, H = 1280, 720
INK, PAPER, RED, GREY, GRID = map(HexColor, ["#151816", "#f1efe8", "#fa583f", "#757970", "#c9cbc4"])
c = canvas.Canvas(str(OUT), pagesize=(W, H))
c.setTitle("Quand la souffrance devient visible - Pitch Odissé 2026")
c.setAuthor("Manuel Reismann")
c.setSubject("Défi 1 - Santé mentale ; présentation de trois minutes")

def text(x, y, value, size=22, font="Helvetica", color=INK):
    c.setFillColor(color); c.setFont(font, size); c.drawString(x, y, value)

def lines(x, y, values, size=22, leading=None, font="Helvetica", color=INK):
    for i, value in enumerate(values):
        text(x, y-i*(leading or size*1.3), value, size, font, color)

def line(x1,y1,x2,y2,color=GRID,width=1):
    c.setStrokeColor(color); c.setLineWidth(width); c.line(x1,y1,x2,y2)

def page(n, chapter, dark=False):
    bg, fg = (INK, PAPER) if dark else (PAPER, INK)
    c.setFillColor(bg); c.rect(0,0,W,H,fill=1,stroke=0)
    text(64,665,chapter,13,"Courier",GREY)
    line(64,58,1216,58,GREY,.6)
    text(64,34,"MANUEL REISMANN · ODISSÉ DATAVIZ 2026 · DÉFI 1",11,"Courier",GREY)
    text(1174,34,f"{n} / 5",11,"Courier",GREY)
    return fg

def source(y,label,url):
    text(64,y,label,12,"Helvetica",GREY)
    c.linkURL(url,(64,y-3,1216,y+15),relative=0)

PATIENT_URL="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-patients-hospitalises-france/"
SOCIAL_URL="https://odisse.santepubliquefrance.fr/explore/dataset/episodes-depressif-indicateurs-du-barometre-2024/"
SITE="https://odisse-sante-mentale.vercel.app"

page(1,"QUATRE REGARDS SUR LA SOUFFRANCE PSYCHIQUE",True)
lines(64,553,["Quand la souffrance", "devient visible"],74,85,"Helvetica-Bold",PAPER)
lines(68,315,["Que masque un chiffre national ?", "Que voit-on quand on change de source ?"],29,42,color=PAPER)
text(68,170,"DÉCLARÉ  /  URGENCES  /  HÔPITAL  /  DÉCÈS",17,"Courier",RED)
text(68,121,"Certaines manifestations de la souffrance, pas toute la santé mentale.",20,color=GREY)
c.showPage()

page(2,"01 · CHANGER DE POPULATION")
text(64,602,"Une hausse nationale, deux directions",48,"Helvetica-Bold")
series={sex:sorted([r for r in DATA["odissePatients"] if r["age"]=="Tous" and r["sex"]==sex],key=lambda r:r["year"]) for sex in ["Femmes","Hommes","Hommes et Femmes"]}
change=lambda s:(s[-1]["rate"]/s[0]["rate"]-1)*100
fmt=lambda v: f"{v:.1f}".replace(".",",")
text(64,415,f"+{round(change(series['Hommes et Femmes']))} %",104,"Helvetica-Bold",RED)
lines(68,360,["Tous âges, tous sexes", "112,6 → 117,2 pour 100 000"],21,31)
lines(68,210,["L’agrégat rassemble", "des trajectoires opposées"],27,34,"Helvetica-Bold")
left,right,bottom,top=560,1206,185,490
px=lambda year:left+(year-2019)*(right-left)/5
py=lambda rate:bottom+rate*(top-bottom)/150
for v in [0,50,100,150]:
    line(left,py(v),right,py(v)); text(left-43,py(v)-5,str(v),14,"Courier",GREY)
for year in range(2019,2025): text(px(year)-19,bottom-29,str(year),14,"Courier",GREY)
for sex,color in [("Femmes",RED),("Hommes",INK)]:
    s=series[sex]
    for a,b in zip(s,s[1:]): line(px(a["year"]),py(a["rate"]),px(b["year"]),py(b["rate"]),color,3)
    c.setFillColor(color)
    for r in s:c.circle(px(r["year"]),py(r["rate"]),5,stroke=0,fill=1)
text(560,540,"Femmes  +"+fmt(change(series["Femmes"]))+" %",23,"Helvetica-Bold",RED)
text(870,540,"Hommes  "+fmt(change(series["Hommes"]))+" %",23,"Helvetica-Bold",INK)
text(64,118,"France · 2019-2024 · Patients hospitalisés en MCO pour gestes auto-infligés",15,"Courier",GREY)
source(91,"Taux standardisés pour 100 000 personnes de chaque sexe. Psychiatrie exclue. Source : Santé publique France / Odissé.",PATIENT_URL)
c.showPage()

page(3,"02 · CHANGER DE REGARD")
lines(64,602,["La souffrance déclarée suit", "un gradient social"],48,55,"Helvetica-Bold")
text(64,467,"Épisode dépressif caractérisé dans les 12 derniers mois",23)
labels=["À l’aise","Ça va","C’est juste","En difficulté"]
rows=[r for r in DATA["social"] if r["indicator"]=="Dépression"]
rows.sort(key=lambda r:r["estimate"])
left,right,bottom,top=358,1070,199,414
px=lambda v:left+v*(right-left)/30
for v in [0,10,20,30]:
    line(px(v),bottom-12,px(v),top+22);text(px(v)-20,bottom-43,str(v)+" %",17,"Courier",GREY)
for i,(label,r) in enumerate(zip(labels,rows)):
    y=top-i*(top-bottom)/3
    text(64,y-7,label,25,"Courier",GREY)
    line(px(r["low"]),y,px(r["high"]),y,INK,2)
    c.setFillColor(RED);c.circle(px(r["estimate"]),y,8,stroke=0,fill=1)
    text(px(r["high"])+14,y-8,fmt(r["estimate"])+" %",25,"Courier-Bold")
text(64,118,"18-79 ans · France hors Mayotte · Situation financière perçue · Baromètre 2024",15,"Courier",GREY)
source(91,"Trait : intervalle de confiance à 95 %. Association observée, sans causalité démontrée. Source : Santé publique France / Odissé.",SOCIAL_URL)
c.showPage()

page(4,"03 · PASSER DU RÉCIT À L’EXPLORATION")
text(64,602,"Un récit, puis les moyens de vérifier",47,"Helvetica-Bold")
for i,(title,desc) in enumerate([("Déclaré","Une expérience rapportée"),("Urgences","Un recours aigu"),("Hôpital","Patients et séjours en MCO"),("Décès","Une mortalité enregistrée")]):
    y=492-i*82
    line(64,y+30,378,y+30)
    text(64,y,title,26,"Helvetica-Bold")
    text(64,y-28,desc,18,color=GREY)
im=ImageReader(str(ROOT/"docs/pitch/explorer.png"))
c.drawImage(im,420,132,width=796,height=442,preserveAspectRatio=True,mask="auto")
text(64,110,"Carte permanente · Aperçu au survol · Sélection au clic · Valeurs, unités et sources accessibles",17,"Courier",GREY)
c.linkURL(SITE+"/#territoires",(420,132,1216,574),relative=0)
c.showPage()

page(5,"04 · RENDRE VISIBLE, SANS CONFONDRE",True)
lines(64,570,["Un chiffre national", "Des réalités différentes"],64,74,"Helvetica-Bold",PAPER)
lines(68,345,["Distinguer les sources et leurs populations", "Conserver les unités, les périodes et l’incertitude", "Documenter les ruptures et rendre les calculs reproductibles"],25,43,color=PAPER)
text(68,174,"Ces sources ne sont pas les étapes d’un même parcours individuel.",21,color=GREY)
text(68,121,"odisse-sante-mentale.vercel.app",25,"Helvetica-Bold",RED)
c.linkURL(SITE,(68,113,640,151),relative=0)
text(760,124,"CODE MIT · TEXTES ET VISUELS CC-BY 4.0",11,"Courier",GREY)
text(760,102,"DONNÉES ODISSÉ : LICENCE OUVERTE 2.0",11,"Courier",GREY)
c.linkURL("https://github.com/m4nR3is/odisse-sante-mentale",(760,90,1216,150),relative=0)
c.showPage();c.save()
print(OUT)
