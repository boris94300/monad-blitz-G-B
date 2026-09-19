import {randomBytes, randomInt, randomUUID} from 'node:crypto';
import type {Candidate, Lot, Room} from '../lib/types';
import {priceAt} from '../lib/auction';

export type InternalRoom = Room & {hostToken: string; hostSocket?: string; peers: Set<string>; lastFrame?: string; busy: boolean; lastScan: number; lastTouched: number};
export const rooms = new Map<string, InternalRoom>();
export function createRoom(name: string, mode: Room['mode']) {
  const code = randomBytes(4).toString('hex').toUpperCase();
  const room: InternalRoom = {code, name, mode, hostToken:randomBytes(32).toString('hex'),
    viewers:0, live:false, createdAt:Date.now(), serverTime:Date.now(), active:null,
    history:[], peers:new Set(), busy:false, lastScan:0, lastTouched:Date.now(), chainHealthy:true};
  rooms.set(code, room); return room;
}
export function publicRoom(room: InternalRoom): Room {
  return {code:room.code, name:room.name, mode:room.mode, viewers:room.peers.size,
    live:room.live, createdAt:room.createdAt, active:room.active,
    history:room.history.slice(-12), serverTime:Date.now(), chainHealthy:room.chainHealthy};
}
export function selectCandidate(candidates: Candidate[], includePeople: boolean) {
  const eligible = candidates.filter(c => c.confidence >= .45 && (includePeople || !c.person));
  if (!eligible.length) throw new Error('Aucune cible reconnue. Rapprochez-vous d’un objet bien éclairé et réessayez.');
  return eligible[randomInt(eligible.length)];
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
  banana:['banane','Téléphone ergonomique biodégradable','Réseau inexistant. Prise en main exceptionnelle.','Baron de la potassiumie']
};
export function makeLot(candidate: Candidate, image: string, mode: Room['mode'], source: Lot['source'] = 'local'): Lot {
  const entry = catalogue[candidate.label] ?? [candidate.label, `${candidate.label} de prestige intergalactique`, 'Une pièce si rare que notre expert vient d’apprendre son existence.', 'Collectionneur de l’inexplicable'];
  const estimate = mode === 'chain' ? randomInt(10,31)/1000 : randomInt(8,26);
  return {id:randomUUID(), label:entry[0], name:entry[1], description:entry[2], title:entry[3],
    traits:[`Prestige cosmique : ${randomInt(76,101)}/100`, `Utilité discutable : ${randomInt(1,10)}/10`, 'Authenticité : probablement'],
    person:candidate.person, bbox:candidate.bbox, image,
    estimatedPrice:estimate, startPrice:Number((estimate*2.5).toFixed(6)), floorPrice:Number((estimate*.15).toFixed(6)),
    duration:60, startTime:0, status:'preview', source};
}
export function sellDemo(room: InternalRoom, buyer: string) {
  if (room.mode !== 'demo') throw new Error('Les achats de cette salle doivent être confirmés sur Monad.');
  const lot = room.active;
  if (!lot || lot.status !== 'active') throw new Error('Ce lot n’est plus disponible.');
  const price = priceAt(lot);
  lot.status = 'sold'; lot.buyer = buyer; lot.soldPrice = price;
  room.history.push({...lot}); room.history = room.history.slice(-12);
  return lot;
}
