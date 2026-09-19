import type {Candidate} from '../lib/types';

type Gender = 'm' | 'f' | 'p';
/** Pragmatic French name, category shown as the lot label, grammatical gender, and optional witty description/title. */
type Entry = {name: string; category: string; gender: Gender; description?: string; title?: string};

const entries: Record<string, Entry> = {
  bicycle:{name:'Vélo',category:'véhicule',gender:'m'},
  car:{name:'Voiture',category:'véhicule',gender:'f'},
  motorcycle:{name:'Moto',category:'véhicule',gender:'f'},
  airplane:{name:'Avion',category:'véhicule',gender:'m'},
  bus:{name:'Bus',category:'véhicule',gender:'m'},
  train:{name:'Train',category:'véhicule',gender:'m'},
  truck:{name:'Camion',category:'véhicule',gender:'m'},
  boat:{name:'Bateau',category:'véhicule',gender:'m'},
  'traffic light':{name:'Feu de circulation',category:'équipement urbain',gender:'m'},
  'fire hydrant':{name:'Bouche d’incendie',category:'équipement urbain',gender:'f'},
  'stop sign':{name:'Panneau stop',category:'équipement urbain',gender:'m'},
  'parking meter':{name:'Parcmètre',category:'équipement urbain',gender:'m'},
  bench:{name:'Banc',category:'mobilier',gender:'m'},
  bird:{name:'Oiseau',category:'animal',gender:'m'},
  cat:{name:'Chat',category:'animal',gender:'m'},
  dog:{name:'Chien',category:'animal',gender:'m'},
  horse:{name:'Cheval',category:'animal',gender:'m'},
  sheep:{name:'Mouton',category:'animal',gender:'m'},
  cow:{name:'Vache',category:'animal',gender:'f'},
  elephant:{name:'Éléphant',category:'animal',gender:'m'},
  bear:{name:'Ours',category:'animal',gender:'m'},
  zebra:{name:'Zèbre',category:'animal',gender:'m'},
  giraffe:{name:'Girafe',category:'animal',gender:'f'},
  backpack:{name:'Sac à dos',category:'accessoire',gender:'m',description:'Contient un chargeur incompatible et le poids des responsabilités.',title:'Explorateur des poches oubliées'},
  umbrella:{name:'Parapluie',category:'accessoire',gender:'m'},
  handbag:{name:'Sac à main',category:'accessoire',gender:'m'},
  tie:{name:'Cravate',category:'accessoire',gender:'f'},
  suitcase:{name:'Valise',category:'accessoire',gender:'f'},
  frisbee:{name:'Frisbee',category:'sport',gender:'m'},
  skis:{name:'Skis',category:'sport',gender:'p'},
  snowboard:{name:'Snowboard',category:'sport',gender:'m'},
  'sports ball':{name:'Ballon',category:'sport',gender:'m'},
  kite:{name:'Cerf-volant',category:'loisir',gender:'m'},
  'baseball bat':{name:'Batte de baseball',category:'sport',gender:'f'},
  'baseball glove':{name:'Gant de baseball',category:'sport',gender:'m'},
  skateboard:{name:'Skateboard',category:'sport',gender:'m'},
  surfboard:{name:'Planche de surf',category:'sport',gender:'f'},
  'tennis racket':{name:'Raquette de tennis',category:'sport',gender:'f'},
  bottle:{name:'Bouteille',category:'vaisselle',gender:'f',description:'Contient peut-être de l’eau. Notre département scientifique refuse de se prononcer.',title:'Ministre de l’hydratation'},
  'wine glass':{name:'Verre à pied',category:'vaisselle',gender:'m'},
  cup:{name:'Tasse',category:'vaisselle',gender:'f',description:'Transforme le café en décisions discutables depuis une époque indéterminée.',title:'Archiduc du petit-déjeuner'},
  fork:{name:'Fourchette',category:'couvert',gender:'f'},
  knife:{name:'Couteau',category:'couvert',gender:'m'},
  spoon:{name:'Cuillère',category:'couvert',gender:'f',description:'Un patrimoine national, selon une source proche de la cuisine.',title:'Grand chancelier de la cuillère'},
  bowl:{name:'Bol',category:'vaisselle',gender:'m'},
  banana:{name:'Banane',category:'nourriture',gender:'f',description:'Réseau inexistant. Prise en main exceptionnelle.',title:'Baron de la potassiumie'},
  apple:{name:'Pomme',category:'nourriture',gender:'f'},
  sandwich:{name:'Sandwich',category:'nourriture',gender:'m'},
  orange:{name:'Orange',category:'nourriture',gender:'f'},
  broccoli:{name:'Brocoli',category:'nourriture',gender:'m'},
  carrot:{name:'Carotte',category:'nourriture',gender:'f'},
  'hot dog':{name:'Hot-dog',category:'nourriture',gender:'m'},
  pizza:{name:'Pizza',category:'nourriture',gender:'f'},
  donut:{name:'Donut',category:'nourriture',gender:'m'},
  cake:{name:'Gâteau',category:'nourriture',gender:'m'},
  chair:{name:'Chaise',category:'mobilier',gender:'f',description:'A supporté des réunions qui auraient dû être des e-mails.',title:'Monarque du mobilier'},
  couch:{name:'Canapé',category:'mobilier',gender:'m',description:'Rend le départ au sport physiquement impossible.',title:'Duc de la sieste'},
  'potted plant':{name:'Plante en pot',category:'décoration',gender:'f',description:'Ne répond pas aux mails, mais améliore l’ambiance.',title:'Directeur des affaires végétales'},
  bed:{name:'Lit',category:'mobilier',gender:'m'},
  'dining table':{name:'Table',category:'mobilier',gender:'f',description:'Supporte les débats. Littéralement.',title:'Président du conseil de table'},
  toilet:{name:'Toilettes',category:'sanitaire',gender:'p'},
  tv:{name:'Écran',category:'électronique',gender:'m',description:'Définition : très haute. Productivité : sans commentaire.',title:'Gardien du dernier épisode'},
  laptop:{name:'Ordinateur portable',category:'électronique',gender:'m',description:'Puissance de calcul inégalée pour afficher « mise à jour en cours ».',title:'Grand maître des onglets'},
  mouse:{name:'Souris',category:'électronique',gender:'f',description:'N’a jamais demandé de fromage. Très professionnelle.',title:'Dompteur de curseurs'},
  remote:{name:'Télécommande',category:'électronique',gender:'f'},
  keyboard:{name:'Clavier',category:'électronique',gender:'m',description:'Toutes les touches pour écrire un bug original.',title:'Virtuose du point-virgule'},
  'cell phone':{name:'Téléphone portable',category:'électronique',gender:'m',description:'Permet de contacter toute l’humanité pour lui dire « t’es où ? ».',title:'Ambassadeur du mode avion'},
  microwave:{name:'Micro-ondes',category:'électroménager',gender:'m'},
  oven:{name:'Four',category:'électroménager',gender:'m'},
  toaster:{name:'Grille-pain',category:'électroménager',gender:'m'},
  sink:{name:'Évier',category:'sanitaire',gender:'m'},
  refrigerator:{name:'Réfrigérateur',category:'électroménager',gender:'m'},
  book:{name:'Livre',category:'papeterie',gender:'m',description:'Fonctionne sans batterie. Le service innovation est en état de choc.',title:'Gardien du savoir approximatif'},
  clock:{name:'Horloge',category:'décoration',gender:'f',description:'Voyage dans le temps, exclusivement vers l’avant.',title:'Ministre du retard'},
  vase:{name:'Vase',category:'décoration',gender:'m'},
  scissors:{name:'Ciseaux',category:'papeterie',gender:'p',description:'Deux lames, zéro dragon vaincu.',title:'Chevalier de la papeterie'},
  'teddy bear':{name:'Ours en peluche',category:'jouet',gender:'m'},
  'hair drier':{name:'Sèche-cheveux',category:'électroménager',gender:'m'},
  toothbrush:{name:'Brosse à dents',category:'hygiène',gender:'f'},
};

/** "du vélo", "de la tasse", "de l’écran", "des ciseaux" (h aspiré of hot-dog keeps "du"). */
export function ofThe(name: string, gender: Gender) {
  const noun = name.charAt(0).toLowerCase() + name.slice(1);
  if (gender === 'p') return `des ${noun}`;
  if (/^[aeiouyéèêëàâîïôûœ]|^ho[rm]/i.test(noun)) return `de l’${noun}`;
  return gender === 'f' ? `de la ${noun}` : `du ${noun}`;
}

/** Pragmatic naming of a detected object; unknown labels (manual crops) keep the typed text. */
export function objectEntry(label: string): Required<Omit<Entry,'gender'>> {
  const entry = entries[label];
  if (!entry) {
    const name = label.charAt(0).toUpperCase() + label.slice(1);
    return {name, category: label, description: 'Repéré à l’écran, vendu en l’état, sans garantie.', title: `Propriétaire officiel ${ofThe(name, 'm')}`};
  }
  const seen = entry.gender === 'f' ? 'Repérée' : entry.gender === 'p' ? 'Repérés' : 'Repéré', sold = entry.gender === 'f' ? 'vendue' : entry.gender === 'p' ? 'vendus' : 'vendu';
  return {name: entry.name, category: entry.category,
    description: entry.description ?? `${seen} en direct par la caméra, ${sold} en l’état, sans garantie.`,
    title: entry.title ?? `Propriétaire officiel ${ofThe(entry.name, entry.gender)}`};
}

/** "Personne 2 · haut rouge, à gauche": number, clothing colour when known, position in the frame. */
export function personName(label: string, bbox: Candidate['bbox'], appearance?: string) {
  const number = Number(/#(\d+)$/.exec(label)?.[1] ?? 1);
  const center = bbox[0] + bbox[2] / 2, where = center < .36 ? 'à gauche' : center > .64 ? 'à droite' : 'au centre';
  const top = appearance ? /^Haut (?:et bas )?([^,·]+?)\s*(?:,|·|$)/.exec(appearance)?.[1] : undefined;
  return `Personne ${number} · ${top ? `haut ${top}, ` : ''}${where}`;
}
