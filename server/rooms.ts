import {randomBytes, randomInt, randomUUID} from 'node:crypto';
import type {Candidate, Lot, Room} from '../lib/types';
import {priceAt} from '../lib/auction';
import {MAX_LOTS,overlap} from '../lib/selection';
export {selectCandidates} from '../lib/selection';

export type InternalRoom = Room & {hostToken: string; cameraToken: string; hostSocket?: string; cameraSocket?:string; sourceSocket?:string; peers: Set<string>; lastFrame?: string; busy: boolean; lastScan: number; lastTouched: number};
export const rooms = new Map<string, InternalRoom>();
export function createRoom(name: string, mode: Room['mode']) {
  const code = randomBytes(4).toString('hex').toUpperCase();
  const room: InternalRoom = {code, name, mode, hostToken:randomBytes(32).toString('hex'),cameraToken:randomBytes(32).toString('hex'),videoSource:null,
    viewers:0, live:false, peopleOnly:false, createdAt:Date.now(), serverTime:Date.now(), active:null,lots:[],
    history:[],salesCount:0,volume:0, peers:new Set(), busy:false, lastScan:0, lastTouched:Date.now(), chainHealthy:true};
  rooms.set(code, room); return room;
}
export function publicRoom(room: InternalRoom): Room {
  return {code:room.code, name:room.name, mode:room.mode, viewers:room.peers.size,
    live:room.live, peopleOnly:room.peopleOnly, createdAt:room.createdAt, active:room.active,lots:room.lots,
    history:room.history.slice(-12),salesCount:room.salesCount,volume:room.volume, serverTime:Date.now(), chainHealthy:room.chainHealthy,videoSource:room.videoSource};
}
export function selectCandidate(candidates: Candidate[], includePeople: boolean) {
  const eligible = candidates.filter(c => c.confidence >= .45 && (includePeople || !c.person));
  if (!eligible.length) throw new Error('Aucune cible reconnue. Rapprochez-vous d’un objet bien éclairé et réessayez.');
  return eligible[randomInt(eligible.length)];
}
type Zone=[number,number,number,number];
/** Fallback "materials" that complete the selection when the camera shows too few objects. Zone = [x0,y0,x1,y1] where the box may sit. */
const absurdities: Record<string,{zone:Zone;size:[number,number];entry:[string,string,string,string]}> = {
  air:{zone:[0,0,1,1],size:[.12,.22],entry:['parcelle d’air','Air d’époque, millésime du jour','Respiré par personne. Enfin, presque. Emballage non fourni.','Propriétaire foncier de l’atmosphère']},
  wall:{zone:[0,.05,1,.6],size:[.14,.24],entry:['pan de mur','Parcelle de muraille porteuse d’ambiance','A tout entendu, n’a rien répété. Discrétion garantie.','Confident des cloisons']},
  ceiling:{zone:[0,0,1,.22],size:[.16,.2],entry:['morceau de plafond','Fragment de firmament en placo','Protège de la pluie depuis sa pose. Jamais remercié.','Seigneur des hauteurs']},
  floor:{zone:[0,.72,1,1],size:[.16,.24],entry:['bout de sol','Terrain constructible miniature','Idéal pour poser des choses. Gravité incluse.','Baron du rez-de-chaussée']},
  shadow:{zone:[0,.35,1,1],size:[.12,.2],entry:['ombre','Ombre portée de collection','Disparaît à la lumière. Comme nos promesses de livraison.','Duc de la pénombre']},
  light:{zone:[0,0,1,.55],size:[.1,.18],entry:['rayon de lumière','Photon d’occasion','A voyagé des millions de kilomètres pour finir ici. Respect.','Ministre de l’éclairage']},
  dust:{zone:[0,0,1,1],size:[.05,.08],entry:['grain de poussière','Poussière d’origine contrôlée','Présente avant vous, restera après vous. Un placement sûr.','Gardien du ménage oublié']},
  corner:{zone:[0,0,1,1],size:[.12,.18],entry:['coin de la pièce','Angle droit certifié 90°','Parfait pour bouder. Livré sans chaise.','Maître des angles morts']},
  silence:{zone:[0,0,1,1],size:[.12,.2],entry:['morceau de silence','Silence gêné en édition limitée','Récolté juste après une blague ratée.','Chevalier du malaise']},
  reflection:{zone:[0,0,1,1],size:[.1,.18],entry:['reflet','Reflet légèrement utilisé','Vous ressemble étrangement, mais à l’envers.','Comte du miroir']},
  void:{zone:[0,0,1,1],size:[.12,.22],entry:['vide','Néant premium','Rien. Absolument rien. Et pourtant, quelle présence.','Empereur du rien']},
  pixel:{zone:[0,0,1,1],size:[.04,.06],entry:['pixel','Pixel orphelin de la caméra','Un seul point, mais quel point. Couleur laissée au hasard.','Archiduc de la résolution']},
};
/** Picks `count` absurd materials not already used, placed where they overlap the taken boxes the least. */
export function absurdCandidates(taken: {label:string;bbox:Candidate['bbox']}[], count: number, random: ()=>number = Math.random): Candidate[] {
  const used=new Set(taken.map(t=>t.label)),boxes=taken.map(t=>t.bbox),picked:Candidate[]=[];
  const keys=Object.keys(absurdities).filter(k=>!used.has(k)).map(k=>[k,random()] as const).sort((a,b)=>a[1]-b[1]).map(([k])=>k);
  for(const label of keys.slice(0,Math.max(0,count))){
    const {zone:[x0,y0,x1,y1],size:[min,max]}=absurdities[label];let best:Candidate['bbox']|null=null,bestScore=Infinity;
    for(let attempt=0;attempt<40&&bestScore>0;attempt++){
      const w=Math.min(x1-x0,min+random()*(max-min)),h=Math.min(y1-y0,min+random()*(max-min));
      const box:Candidate['bbox']=[x0+random()*(x1-x0-w),y0+random()*(y1-y0-h),w,h];
      const score=Math.max(0,...boxes.map(b=>overlap(box,b)));if(score<bestScore){best=box;bestScore=score;}
    }
    boxes.push(best!);picked.push({label,confidence:1,person:false,bbox:best!});
  }
  return picked;
}
const catalogue: Record<string, [string,string,string,string]> = {
  chair:['chaise','Trône du stagiaire suprême','A supporté des réunions qui auraient dû être des e-mails.','Monarque du mobilier'],
  bottle:['bouteille','Élixir de productivité douteuse','Contient peut-être de l’eau. Notre département scientifique refuse de se prononcer.','Ministre de l’hydratation'],
  cup:['tasse','Graal du lundi matin','Transforme le café en décisions discutables depuis une époque indéterminée.','Archiduc du petit-déjeuner'],
  laptop:['ordinateur','Portail vers 47 onglets','Puissance de calcul inégalée pour afficher « mise à jour en cours ».','Grand maître des onglets'],
  'cell phone':['téléphone','Rectangle de procrastination','Permet de contacter toute l’humanité pour lui dire « t’es où ? ».','Ambassadeur du mode avion'],
  person:['personnage fictif','PNJ légendaire du hackathon','Carte de personnage : énergie à 3 %, idées à 200 %. Aucune personne n’est à vendre.','Agent officiel du chaos'],
  book:['livre','Disque dur en bois compressé','Fonctionne sans batterie. Le service innovation est en état de choc.','Gardien du savoir approximatif'],
  backpack:['sac','Inventaire du héros secondaire','Contient un chargeur incompatible et le poids des responsabilités.','Explorateur des poches oubliées'],
  clock:['horloge','Machine à manquer les deadlines','Voyage dans le temps, exclusivement vers l’avant.','Ministre du retard'],
  keyboard:['clavier','Piano du développeur triste','Toutes les touches pour écrire un bug original.','Virtuose du point-virgule'],
  mouse:['souris','Rongeur administratif','N’a jamais demandé de fromage. Très professionnel.','Dompteur de curseurs'],
  'potted plant':['plante','Employé du mois par photosynthèse','Ne répond pas aux mails, mais améliore l’ambiance.','Directeur des affaires végétales'],
  spoon:['cuillère','Sceptre du ministère de la soupe','Un patrimoine national, selon une source proche de la cuisine.','Grand chancelier de la cuillère'],
  couch:['canapé','Station de recharge humaine','Rend le départ au sport physiquement impossible.','Duc de la sieste'],
  'dining table':['table','Plateforme de gouvernance horizontale','Supporte les débats. Littéralement.','Président du conseil de table'],
  tv:['écran','Fenêtre sur le temps perdu','Définition : très haute. Productivité : sans commentaire.','Gardien du dernier épisode'],
  scissors:['ciseaux','Épées jumelles du service courrier','Deux lames, zéro dragon vaincu.','Chevalier de la papeterie'],
  banana:['banane','Téléphone ergonomique biodégradable','Réseau inexistant. Prise en main exceptionnelle.','Baron de la potassiumie'],
  ...Object.fromEntries(Object.entries(absurdities).map(([key,a])=>[key,a.entry]))
};
/**
 * People are auctioned as FICTIONAL characters: the sheet scores invented personality stats, never the body,
 * face, hair, height or any sensitive attribute. [stat, reason when it drags the price down, reason when it lifts it]
 */
const characterStats: [string,string,string][] = [
  ['Charisme de réunion','ne prend la parole que pour dire « on se capte après »','peut faire applaudir un tableau Excel'],
  ['Énergie restante','tourne sur 3 % de batterie et un demi-croissant','a encore de l’énergie à cette heure-ci, c’est suspect'],
  ['Talent caché','talent si bien caché que même son propriétaire le cherche','jongle sûrement, personne n’ose demander'],
  ['Réserve de blagues','stock de blagues épuisé depuis mardi','a une blague prête pour chaque bug'],
  ['Maîtrise du café','confond encore expresso et allongé','sommelier officieux de la machine à café'],
  ['Diplomatie en code review','commente « non. » sans autre explication','transforme un refus en compliment'],
  ['Sens de l’orientation','s’est perdu deux fois en cherchant la sortie','connaît toutes les issues de secours par cœur'],
  ['Vitesse de réponse','répond aux messages la semaine suivante','répond avant la fin de la question'],
  ['Aura de fin de hackathon','aura en mode économie d’énergie','rayonne comme une démo qui marche du premier coup'],
];
const characterNames = ['Légende du dernier commit','Icône du stand-up','Vedette de la réunion de 9 h','Figure mythique de l’open space','Star de la machine à café','Personnalité du Wi-Fi','Célébrité du post-it'];
const characterTitles = ['Agent officiel du chaos','Mécène des légendes vivantes','Impresario du hackathon','Gardien du casting fictif'];
/** Estimate grows with the character score: 1/10 is the bargain bin, 10/10 the star of the sale. */
export function ratingPrice(mode: Room['mode'], rating: number) {
  const r = Math.min(10, Math.max(1, Math.round(rating)));
  return mode === 'chain' ? (8 + r * 2) / 1000 : 6 + r * 2;
}
export function characterSheet(pick: (max: number) => number = max => randomInt(max)) {
  const pool = [...characterStats], stats = Array.from({length:3}, () => {
    const [name, low, high] = pool.splice(pick(pool.length), 1)[0];
    return {name, low, high, score: 1 + pick(10)};
  });
  const rating = Math.round(stats.reduce((sum, s) => sum + s.score, 0) / stats.length);
  const weakest = stats.reduce((a, b) => b.score < a.score ? b : a), strongest = stats.reduce((a, b) => b.score > a.score ? b : a);
  const ratingReason = rating <= 5
    ? `Coûte moins cher : ${weakest.name.toLowerCase()} à ${weakest.score}/10, ${weakest.low}.`
    : `Cote élevée : ${strongest.name.toLowerCase()} à ${strongest.score}/10, ${strongest.high}. Seul bémol : ${weakest.name.toLowerCase()} à ${weakest.score}/10.`;
  return {traits: stats.map(s => `${s.name} : ${s.score}/10`), rating, ratingReason,
    name: characterNames[pick(characterNames.length)], title: characterTitles[pick(characterTitles.length)]};
}
/** Characters sharing a name get a dynasty number (II, III…) so buyers can tell them apart. */
export function distinctNames(lots: Lot[]) {
  const roman = ['II','III','IV','V','VI','VII','VIII'], seen = new Map<string, number>();
  for (const lot of lots) {
    const base = lot.name.replace(/ (?:II|III|IV|V|VI|VII|VIII)$/, ''), count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    if (lot.person && count) lot.name = `${base} ${roman[count - 1] ?? count + 1}`;
  }
  return lots;
}
export function makeLot(candidate: Candidate, image: string, mode: Room['mode'], source: Lot['source'] = 'local'): Lot {
  const entry = catalogue[candidate.label] ?? [candidate.label, `${candidate.label} de prestige intergalactique`, 'Une pièce si rare que notre expert vient d’apprendre son existence.', 'Collectionneur de l’inexplicable'];
  if (candidate.person) {
    const sheet = characterSheet(), estimate = ratingPrice(mode, sheet.rating);
    return {id:randomUUID(), detectionLabel:candidate.label, label:'personnage fictif', name:sheet.name,
      description:'Carte de personnage fictive, avec son accord. Aucune personne n’est à vendre : seule sa légende l’est.', title:sheet.title,
      traits:sheet.traits, rating:sheet.rating, ratingReason:sheet.ratingReason, appearance:candidate.appearance||undefined, person:true, bbox:candidate.bbox, image,
      estimatedPrice:estimate, startPrice:Number((estimate*2.5).toFixed(6)), floorPrice:Number((estimate*.15).toFixed(6)),
      duration:60, startTime:0, status:'preview', source};
  }
  const estimate = mode === 'chain' ? randomInt(10,31)/1000 : randomInt(8,26);
  return {id:randomUUID(), detectionLabel:candidate.label, label:entry[0], name:entry[1], description:entry[2], title:entry[3],
    traits:[`Prestige cosmique : ${randomInt(76,101)}/100`, `Utilité discutable : ${randomInt(1,10)}/10`, 'Authenticité : probablement'],
    person:candidate.person, bbox:candidate.bbox, image,
    estimatedPrice:estimate, startPrice:Number((estimate*2.5).toFixed(6)), floorPrice:Number((estimate*.15).toFixed(6)),
    duration:60, startTime:0, status:'preview', source};
}
/** Swaps a lot whose object left the camera for a newly seen one (or an absurd material), or fills a free slot when lotId is omitted. */
export function replaceLot(room: InternalRoom, lotId: string|undefined, real: Candidate|undefined, image: string) {
  if (!room.lots.length) throw new Error('Lancez d’abord la sélection.');
  const index = lotId ? room.lots.findIndex(l => l.id === lotId) : -1;
  if (lotId && index < 0) throw new Error('Le lot a changé.');
  const old = index >= 0 ? room.lots[index] : undefined;
  if (old && old.source !== 'local' && old.source !== 'vision' && old.source !== 'absurd') throw new Error('Ce lot est suivi manuellement.');
  if (!old && room.lots.length >= MAX_LOTS) throw new Error('La sélection est complète.');
  const selling = room.lots.some(l => l.status === 'active');
  if (selling && room.mode === 'chain') throw new Error('Les lots inscrits sur Monad ne changent pas pendant la vente.');
  const others = room.lots.filter((_, i) => i !== index).map(l => ({label: l.detectionLabel || l.label, bbox: l.bbox}));
  if (real && others.some(o => o.label === real.label)) throw new Error('Cette catégorie est déjà présente.');
  if (room.peopleOnly && !real?.person) throw new Error('En mode humains, seule une autre personne peut prendre cette place.');
  // Without a visible replacement, an absurd material takes the slot so the selection stays complete.
  const candidate = real ?? absurdCandidates(others, 1)[0];
  if (!candidate) throw new Error('Plus aucun matériau absurde disponible.');
  const lot = makeLot(candidate, image, room.mode, real ? 'local' : 'absurd'); lot.duration = (old ?? room.lots[0]).duration;
  // During a demo sale the newcomer joins immediately with its own descending price.
  if (selling) { lot.status = 'active'; lot.startTime = Math.floor(Date.now() / 1000) * 1000; }
  room.lots = distinctNames(old ? room.lots.map((l, i) => i === index ? lot : l) : [...room.lots, lot]);
  if (!room.active || room.active.id === old?.id) room.active = room.lots[0];
  return lot;
}
export function sellDemo(room: InternalRoom, buyer: string, lotId?:string) {
  if (room.mode !== 'demo') throw new Error('Les achats de cette salle doivent être confirmés sur Monad.');
  const lot = lotId ? room.lots.find(l=>l.id===lotId) : room.active;
  if (!lot || lot.status !== 'active') throw new Error('Ce lot n’est plus disponible.');
  const price = priceAt(lot);
  lot.status = 'sold'; lot.buyer = buyer; lot.soldPrice = price;
  room.salesCount++;room.volume+=price;
  room.history.push({...lot}); room.history = room.history.slice(-12);
  return lot;
}
