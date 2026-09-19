# BRIC À BRAC — Liquidation du futur

Un téléphone filme une pièce. Une IA reconnaît les objets, le hasard en choisit un, et un commissaire-priseur très peu qualifié le transforme en pièce de collection. Le public regarde le live sur son téléphone. Le prix descend : attendre coûte moins cher, mais le premier achat accepté gagne.

**Rien de réel n’est vendu. Les prix sont fantaisistes. Les transactions utilisent uniquement des MON de test, sans valeur.** Une personne consentante devient une carte de personnage fictive ; il n’y a ni identification biométrique, ni vente, ni estimation de la valeur d’un humain.

Projet créé pour Monad Blitz Paris. [Dépôt de départ](https://github.com/monad-developers/monad-blitz-paris).

## Lancer en local

Node.js 22.12+ (testé avec 24), npm. Aucun compte IA nécessaire.

```sh
npm ci
npm run contracts:compile
npm run build
npm start
```

Ouvrir `http://localhost:3000`. Créer une salle **Répétition**. Les achats de ce mode sont simulés et clairement indiqués. Pour développer : `npm run model:download`, puis `npm run dev`.

Le build télécharge environ 19 Mo de poids publics COCO-SSD depuis TensorFlow et les sert avec l’application. L’analyse tourne sur le téléphone vendeur, sans envoyer les images à un fournisseur d’IA. Le serveur reçoit uniquement la capture nécessaire à la carte du lot et les catégories détectées. La diffusion vidéo est partagée avec les participants de la salle.

## Parcours de démonstration

**Wallet sur le PC, caméra sur le téléphone :** créer la salle sur le PC, cliquer **Filmer avec mon téléphone**, puis scanner le QR caméra avec le téléphone vendeur. Celui-ci diffuse uniquement la vidéo et, au choix, le micro : aucun wallet n’y est nécessaire. Le PC reçoit le live, lance la reconnaissance et signe les mises en vente dans Rabby/MetaMask. Le QR caméra est distinct du QR public destiné aux acheteurs ; son jeton n’autorise ni la vente ni les commandes de régie.

1. Sur le téléphone vendeur, ouvrir l’adresse HTTPS et créer une salle. L’accès vendeur est enregistré dans ce navigateur.
2. Activer la caméra (et, éventuellement, le micro avant le démarrage).
3. Sur le PC de projection, ouvrir la **vue grand écran** `/scene/CODE`.
4. Les acheteurs scannent le QR ou ouvrent `/join/CODE`.
5. Cadrer des objets courants : chaise, tasse, bouteille, ordinateur, livre… Cliquer **Sélectionner 7 objets**. La capture et cinq zones agrandies sont analysées. Le serveur conserve une seule instance par catégorie, avec priorité aux petits objets et exclusion des meubles si leur contenu est reconnu. La sélection compte toujours sept lots : s’il manque des objets, des matériaux absurdes (parcelle d’air, pan de mur, morceau de plafond, ombre, poussière…) complètent la liste, placés à l’écart des vrais objets. Ensuite, un lot dont l’objet quitte l’écran plus de 2 s est remplacé sur place par un autre objet visible, ou à défaut par un matériau absurde ; un nouvel objet qui apparaît prend la place d’un matériau absurde. La case **Mode humains uniquement** ne sélectionne que les personnes consentantes (jusqu’à sept), chacune suivie individuellement comme personnage fictif. Chaque personnage reçoit une fiche inventée (charisme de réunion, énergie restante, talent caché…), une note sur 10 et une courte justification de son prix ; le prix dépend de la note. La note ne porte jamais sur le physique : corps, visage, cheveux, taille ou tout attribut sensible sont exclus.
6. Le vendeur valide le lot avec **Lancer l’enchère**. Le public voit le même prix et le même gagnant.
7. Après l’achat, le gagnant reçoit un titre absurde. Relancer un tour.

Sur mobile, une barre d’achat reste visible pendant le live. Les réactions emoji sont partagées. La sélection des personnes est désactivée par défaut et doit être activée avec leur accord. L’IA ne reconnaît que les 80 catégories COCO : un objet non reconnu n’est pas inventé.

**Plan B :** dans une salle de répétition, « Essayer avec un décor fictif » fournit une chaise illustrée explicitement étiquetée. Ce mode n’est pas une preuve de reconnaissance IA ni de transaction Monad. Préparer une vidéo du vrai parcours avant le pitch.

## Monad Testnet

Chain ID : **10143**. [Faucet](https://faucet.monad.xyz). [Documentation officielle de déploiement](https://docs.monad.xyz/guides/deploy-smart-contract/foundry).

Contrat déployé et bytecode vérifié : **[`0x1dc0ead510654e1b494d30d9ba3325a7a047bfce`](https://testnet.monadvision.com/address/0x1dc0ead510654e1b494d30d9ba3325a7a047bfce)**.

L’adresse et l’empreinte du bytecode déployé sont conservées dans `contracts/deployments.json`. L’application utilise cette adresse par défaut ; `CONTRACT_ADDRESS` permet de la remplacer. L’ABI et le bytecode sont dans `public/DutchAuction.json`.

### Déployer sans manipuler de clé privée

Ouvrir `/setup` dans un navigateur avec MetaMask/Rabby et un wallet dédié au testnet alimenté en MON. Le bouton de déploiement demande la signature dans le wallet. L’application ne lit jamais les clés. Copier ensuite l’adresse publique obtenue dans `CONTRACT_ADDRESS` de `.env` et dans `contracts/deployments.json`, puis redémarrer le serveur. Il est alors possible de créer une salle **Monad Testnet**.

Sur téléphone, ouvrir le site **dans le navigateur intégré de MetaMask ou Rabby**. La connexion repose sur le wallet injecté ; cette version n’intègre pas WalletConnect. Le vendeur et les acheteurs doivent avoir des adresses différentes.

### Alternative Foundry avec keystore

Foundry **1.8+** requis. Le profil sélectionne l’environnement Monad.

```sh
cd contracts
forge test -vv
# Avec un keystore déjà créé localement :
forge create src/DutchAuction.sol:DutchAuction --account monad-deployer --broadcast
```

Ne jamais placer de clé privée ou de phrase de récupération dans le dépôt ou le terminal partagé. Les fichiers `.env*` sont ignorés (sauf l’exemple vide). Ne pas importer un wallet contenant des fonds réels pour cette démo.

### Comprendre le contrat

- `listItems` : le vendeur inscrit jusqu’à 20 lots dans une seule transaction. Les prix et la durée sont contrôlés. L’heure de début est celle du bloc.
- `currentPrice` : une lecture calcule `plancher + (départ - plancher) × (temps restant / durée)²`. Le prix chute vite au début et ralentit vers le plancher. À mi-durée, il reste 25 % de l’écart initial. Aucun robot ni transaction périodique ne modifie le prix.
- `buy` : le premier achat valide gagne. Le contrat marque le lot vendu avant les transferts, paie le vendeur et rembourse le trop-perçu. Une protection empêche les rappels pendant le paiement. Un transfert refusé annule toute la transaction.
- `getItem` et `itemCount` : l’interface lit les lots. Un lot vendu conserve son prix d’achat.

Le vendeur ne peut pas acheter son propre lot. Après la durée, un lot invendu reste achetable au plancher. L’interface présente toujours sept lots simultanés par salle, inscrits dans une seule transaction. En répétition, un remplaçant rejoint la vente en cours avec sa propre courbe ; sur Monad, les lots inscrits ne changent pas pendant la vente. Chaque acheteur choisit un lot indépendamment. Il faut terminer les ventes actives avant une nouvelle sélection. Pas de mécanisme d’annulation dans ce prototype.

Le navigateur affiche une interpolation avec l’heure serveur ; **le contrat fait autorité**. À l’achat, le client relit le prix sur Monad. Le serveur vérifie la transaction de création et lit l’état du contrat pour annoncer le gagnant. Un appel à l’API de répétition ne peut pas vendre un lot blockchain.

## Architecture et hébergement

- Next.js App Router + React + TypeScript : accueil, régie, participant, projection, déploiement.
- Serveur Node/Express + Socket.IO : salles, autorisation vendeur, sélection de sept catégories, remplacement des objets sortis du champ, état, réactions, signalisation vidéo.
- WebRTC : diffusion pair à pair du vendeur aux spectateurs, audio facultatif.
- Secours JPEG : cible de 12 images/seconde en 480 px, sans audio, si WebRTC ne passe pas. Les images périmées disparaissent.
- TensorFlow.js/COCO-SSD : détection locale ; catalogue humoristique et prix fictifs calculés localement côté serveur.
- Solidity + viem : transactions Monad Testnet.

Ce serveur doit rester actif. **Cette version ne peut pas être déployée telle quelle comme des fonctions Vercel.** Utiliser le `Dockerfile` sur un hébergeur Node permanent compatible WebSocket, ou le `render.yaml` fourni. Un seul processus/une seule instance : les salles sont en mémoire et expirent après six heures d’inactivité. Redémarrer le serveur ferme les salles, mais les enchères blockchain persistent dans le contrat.

Pour un test rapide sur plusieurs téléphones, un tunnel HTTPS vers le port 3000 fonctionne :

```sh
cloudflared tunnel --url http://localhost:3000
```

Ouvrir l’URL HTTPS générée **sur tous les appareils**, y compris le vendeur. Un QR généré depuis `localhost` ne fonctionne pas depuis un autre téléphone ; renseigner `PUBLIC_URL` si nécessaire. Un tunnel temporaire dépend du PC et n’est pas un hébergement permanent. Le code de salle est une invitation à regarder ; ne pas le publier hors du public souhaité.

Pour des réseaux mobiles différents, un relais TURN améliore la compatibilité WebRTC. Les paramètres `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` sont facultatifs ; en leur absence, le secours JPEG reste disponible. La diffusion pair à pair est destinée à une petite salle, pas à des centaines de spectateurs. Limite de prototype : 40 spectateurs par salle, à valider avec le réseau du lieu.

## IA distante facultative

Sans clé API, **la détection est réellement effectuée par un modèle IA**, mais les histoires viennent d’un catalogue et les prix sont des valeurs de jeu. L’interface l’indique. Pour générer aussi les textes depuis une IA vision, configurer `OPENAI_API_KEY` et `OPENAI_MODEL` côté serveur, puis activer l’option dans la régie. Une image par tour sera envoyée au fournisseur. Cette intégration est facultative et nécessite un compte API facturé séparément. Elle n’est pas nécessaire pour utiliser l’application.

## Vérification

```sh
npm run typecheck
npm test
npm run contracts:test
# Avec l’application démarrée dans un autre terminal :
npx playwright install chromium
npm run test:e2e
```

Les tests navigateur utilisent une caméra synthétique, jamais la caméra personnelle de la machine. Les tests Solidity couvrent les prix, l’achat, le remboursement, les achats concurrents, les entrées invalides, l’auto-achat interdit, les transferts refusés et 256 cas de décroissance du prix.

## Pitch de 3 minutes

**0:00–0:20** — « Notre IA a fait faillite. Aujourd’hui, on liquide ses possessions. Même cette chaise. »

**0:20–0:50** — Filmer la pièce, tirer un objet au sort, lire l’expertise absurde et ouvrir l’enchère.

**0:50–1:50** — Faire participer les wallets préparés. Le prix baisse, le commissaire panique, un gagnant apparaît. Afficher son titre.

**1:50–2:30** — Second objet imprévu ou personnage consentant. « Plus vous attendez, moins vous payez, jusqu’à ce que quelqu’un vous le prenne. »

**2:30–3:00** — Montrer la transaction et expliquer : « Pas une transaction pour chaque baisse : le prix est une fonction du temps. Monad enregistre le gagnant. L’IA reconnaît ; le hasard choisit ; vous regrettez. »

Une mise en vente nécessite aussi une transaction. La nouveauté revendiquée est l’expérience collective, pas l’invention des enchères à la baisse.

## Interface Maison de vente et vision multi-objets

- Thème clair épuré, sélection compacte à droite du live et vignettes recadrées. Sur mobile la sélection défile horizontalement sous la vidéo.
- Cinq prix indépendants descendent simultanément. Le volume et le nombre d’acquisitions viennent uniquement des achats de la salle (explicitement simulés en répétition).
- Repérage local périodique : une analyse à la fois, dans un worker séparé, relancée 180 ms après chaque inférence. Une passe sur deux réanalyse aussi les zones des petits lots sélectionnés. Les cadres suivent les nouvelles détections par catégorie ; ils ne garantissent pas l’identité persistante de deux objets semblables. Les cadres obsolètes disparaissent après 4,5 secondes.
- Les humains sont exclus par défaut ; activer « Inclure les personnages consentants » pour une carte fictive.
- COCO-SSD reste limité à ses 80 catégories. Les écouteurs, mouchoirs et miettes ne sont pas garantis. « Cadrer un petit objet » permet de dessiner une zone sur une capture et de nommer ce détail ; le lot est explicitement marqué cadrage manuel. Ce détail manuel n’est pas suivi automatiquement en vidéo.
- Le modèle local et le cadrage manuel fonctionnent sans clé API. La vision distante optionnelle privilégie désormais les petits objets et une image haute définition, mais nécessite une configuration séparée.
- Les tests navigateur vérifient cinq lots, deux achats distincts, les doublons, les cadres synchronisés et leur expiration, le cadrage manuel, la caméra séparée et le rendu mobile. Les scènes de test sont synthétiques, pas une mesure de précision sur de vrais petits objets.

## Vue acheteur épurée, vidéo et mascotte

La vue acheteur montre le live, une sélection compacte et un bouton d’achat principal. Les détails de régie, les réactions, les statistiques et le QR sont masqués. Sur téléphone les objets défilent horizontalement et le bouton d’achat reste en bas.

La caméra demande désormais 30 images/s en WebRTC, privilégie la cadence et limite le débit par connexion. Le mode de secours JPEG vise 12 images/s en 480 px, contre 4 auparavant ; son débit réel dépend du réseau. Les images de secours ne provoquent pas de rendu React lorsque la vidéo directe fonctionne. Une connexion figée bascule vers le secours et demande une renégociation. Aucun serveur TURN n’a été ajouté : les réseaux restrictifs peuvent encore utiliser le secours.

Le repérage recommence 180 ms après chaque inférence ; les petites régions sélectionnées sont également réanalysées une passe sur deux. Le mouvement des cadres est lissé, les détections manquantes sont conservées au maximum une seconde, et les cadres périmés disparaissent. Les couleurs sont stables par catégorie sélectionnée. Cela reste une reconnaissance périodique, pas une garantie de suivi image par image ni de reconnaissance des détails hors des 80 classes du modèle.

Une mascotte vectorielle animée (style guignol, chapeau et marteau) célèbre chaque nouvelle vente confirmée. Les ventes simultanées sont mises en file ; les ventes historiques ne rejouent pas à l’arrivée. L’animation respecte la préférence de réduction des mouvements, ne bloque aucun bouton et ne nécessite pas de télécharger un GIF.

La reconnaissance est exécutée dans un Web Worker avec OffscreenCanvas : le chargement et le calcul du modèle ne bloquent plus le fil d’affichage ou l’encodage des images de secours. Le test de fluidité vérifie la réception d’au moins huit changements d’image sur 1,6 seconde pendant que le modèle se charge, en plus des essais de reconnaissance réelle. Les fontes sont locales au système, sans téléchargement Google Fonts.
