# BRIC À BRAC — Contexte et réalisations

## L’idée

BRIC À BRAC est un prototype développé pour un hackathon autour de Monad. L’objectif est de transformer une pièce ordinaire en salle de vente aux enchères en direct, avec une approche volontairement absurde : une tasse, une bouteille ou un morceau de biscuit deviennent des objets de collection aux descriptions extravagantes.

Le vendeur filme la pièce. La reconnaissance visuelle aide à sélectionner jusqu’à cinq catégories d’objets différentes. Chaque lot reçoit un nom humoristique, une description et un prix de départ volontairement gonflé. Les prix descendent ensuite simultanément : le premier acheteur dont l’achat est accepté remporte le lot choisi.

Les objets sont fictifs et les MON utilisés sur Monad Testnet n’ont pas de valeur réelle. Les personnes peuvent apparaître, avec leur accord, sous forme de cartes de personnages fictifs ; aucune personne n’est mise en vente.

## Le parcours réalisé

1. Le vendeur crée une salle en mode répétition ou Monad Testnet.
2. Il active la caméra de son ordinateur ou associe un téléphone grâce à un QR code réservé à la caméra. Le PC peut ainsi conserver la régie et le wallet.
3. Les acheteurs rejoignent la salle depuis leurs téléphones avec un lien ou un code.
4. Le vendeur lance la sélection. L’application privilégie les petits objets et conserve une seule instance par catégorie, dans la limite de cinq lots.
5. Les acheteurs voient le live, les vignettes recadrées et les prix qui baissent. Ils sélectionnent un objet puis appuient sur « Acheter ».
6. Après une vente confirmée dans la salle, une mascotte de commissaire-priseur, inspirée de Guignol, apparaît et frappe son marteau. Les achats de répétition sont explicitement indiqués comme simulés.

## Ce qui a été développé

### Interface

L’interface a évolué d’une ambiance de maison de vente noire et dorée vers une présentation claire et épurée, inspirée des principes visuels d’Apple. La vue acheteur met en avant la vidéo, la sélection et l’action d’achat. Sur téléphone, les objets défilent horizontalement et le bouton d’achat reste accessible en bas de l’écran. La régie conserve les contrôles nécessaires au vendeur.

### Reconnaissance et suivi visuel

La reconnaissance locale utilise TensorFlow.js et COCO-SSD, sans fournisseur d’IA payant ni clé API. Une analyse de la capture et de zones agrandies améliore la recherche de petits objets. Le suivi périodique affiche des cadres colorés, lisse leurs déplacements et conserve brièvement une détection manquante avant de la retirer. Les lots sélectionnés ont chacun une couleur distincte.

Les calculs s’exécutent dans un Web Worker afin de ne pas bloquer l’affichage ou l’envoi vidéo. Un outil de cadrage manuel permet d’ajouter un petit objet mal reconnu, en dessinant sa zone sur une capture puis en le nommant. Ces lots sont clairement identifiés comme manuels.

### Vidéo et synchronisation

La vidéo utilise WebRTC, avec une demande de capture à 30 images par seconde, une limitation du débit par connexion et une reprise après interruption. Si la connexion directe échoue, un mode de secours JPEG vise environ 12 images par seconde en résolution réduite. Socket.IO synchronise les salles, les lots, les ventes et les cadres entre les participants.

### Blockchain

Un contrat Solidity d’enchères hollandaises est déployé sur Monad Testnet, réseau 10143, à l’adresse :

`0x1dc0ead510654e1b494d30d9ba3325a7a047bfce`

Le vendeur peut inscrire les cinq lots dans une seule transaction. Le contrat calcule leur prix dégressif, empêche un deuxième achat du même lot, verse le montant au vendeur et rembourse l’excédent éventuel. Le vendeur ne peut pas acheter ses propres lots. Les signatures passent par le wallet de l’utilisateur ; l’application ne conserve aucune clé privée.

## Vérifications effectuées

- Compilation et vérification TypeScript.
- Huit tests unitaires sur les prix, la sélection, les ventes indépendantes, les secrets de salle et le lissage du suivi.
- Sept scénarios navigateur couvrant les acheteurs multiples, le téléphone caméra, la reconnaissance locale, les cadres colorés, le cadrage manuel, la mascotte et les affichages ordinateur/mobile.
- Vérifications via le lien public, dont la réception continue d’images de secours pendant le chargement du modèle.
- Dix tests du contrat Solidity, avec des cas de fuzzing, réalisés lors de son développement.

Les tests de caméra utilisent des scènes synthétiques. Ils ne constituent pas une mesure de précision sur tous les objets réels. Un parcours complet d’achat entre deux vrais wallets sur le testnet reste à valider.

## Limites actuelles

- COCO-SSD reconnaît 80 catégories : les écouteurs, mouchoirs et miettes ne sont pas garantis. Le cadrage manuel complète cette limite.
- Les noms, histoires et estimations sont humoristiques ; les prix ne sont pas des expertises de valeur marchande.
- Les cadres résultent d’analyses périodiques, sans garantie de suivi à chaque image ni d’identité persistante entre deux objets semblables. Les lots cadrés manuellement ne sont pas suivis automatiquement.
- La fluidité dépend des téléphones, du PC et du réseau. Aucun relais TURN n’est configuré actuellement ; certains réseaux utilisent donc le secours JPEG.
- Les salles sont conservées en mémoire et disparaissent au redémarrage. Les données inscrites dans le contrat restent sur Monad Testnet.
- Le prototype convient à une petite démonstration ; sa limite de 40 spectateurs n’a pas été validée en charge réelle.
- Le site public passe par un tunnel Cloudflare temporaire vers le PC. Le PC, le serveur et le tunnel doivent rester actifs. Il ne s’agit pas encore d’un hébergement autonome permanent.

## Liens

- Dépôt : https://github.com/boris94300/monad-blitz-G-B
- Démonstration temporaire : https://peripheral-decent-sufficiently-specialist.trycloudflare.com/
- Contrat : https://testnet.monadvision.com/address/0x1dc0ead510654e1b494d30d9ba3325a7a047bfce

Le dépôt contient le code source, le contrat, les tests, les scripts de compilation et les instructions de lancement. Les dépendances installées, les fichiers de compilation et les paramètres privés locaux sont exclus du versionnement.
