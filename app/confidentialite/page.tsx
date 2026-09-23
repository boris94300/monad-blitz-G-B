import type {Metadata} from 'next';
import {LegalPage} from '@/components/LegalPage';
import {CONTACT_EMAIL} from '@/lib/site';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Quelles données BRIC À BRAC traite (caméra, salles, cookies, analytics), pourquoi, combien de temps, et comment exercer vos droits.',
  alternates: {canonical: '/confidentialite'}
};

export default function Privacy() {
  return <LegalPage title="Politique de confidentialité" intro="BRIC À BRAC est un prototype de vente aux enchères fictive. Nous collectons le strict nécessaire pour faire fonctionner une salle en direct, et rien pour vous suivre à la trace.">
    <section><h2>1. Qui est responsable ?</h2>
      <p>Le responsable du traitement est l’éditeur du site BRIC À BRAC (voir les <a href="/cgu">conditions d’utilisation</a>). Contact : {CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : <em>[adresse de contact à renseigner par l’éditeur]</em>}.</p></section>
    <section><h2>2. Données traitées</h2>
      <ul>
        <li><strong>Nom de la salle et pseudo de collectionneur</strong> : saisis par vous, affichés aux participants de la salle. Le pseudo est mémorisé dans votre navigateur.</li>
        <li><strong>Flux caméra et micro du vendeur</strong> : activés uniquement quand le vendeur le décide. La vidéo transite en direct vers les participants (WebRTC, avec un secours par images JPEG relayées par notre serveur). Elle n’est pas enregistrée ; seules la dernière image et les vignettes des lots sont conservées en mémoire tant que la salle existe.</li>
        <li><strong>Images de la pièce et personnes</strong> : la reconnaissance d’objets s’exécute par défaut dans le navigateur du vendeur. Les personnes ne sont mises en scène qu’avec leur accord, comme personnages fictifs.</li>
        <li><strong>Expertise IA distante (facultative)</strong> : si le vendeur l’active et si l’éditeur a configuré une clé, une image de la pièce est envoyée à un fournisseur d’IA (OpenAI) pour rédiger les fiches. Ce mode est désactivé par défaut.</li>
        <li><strong>Adresse de portefeuille et transactions</strong> : en mode Monad Testnet, les achats sont inscrits sur une blockchain publique. Ces données sont publiques et ne peuvent pas être effacées par nous.</li>
        <li><strong>Adresse IP</strong> : utilisée en mémoire pour limiter les abus (anti-spam), non conservée dans un journal par l’application. L’hébergeur peut conserver des journaux techniques.</li>
      </ul></section>
    <section><h2>3. Finalités et bases légales</h2>
      <p>Faire fonctionner le service que vous demandez (exécution du service), protéger le site contre les abus (intérêt légitime), et mesurer l’audience de façon anonyme uniquement si vous l’acceptez (consentement).</p></section>
    <section><h2>4. Cookies et stockage local</h2>
      <p>Le site n’utilise aucun cookie publicitaire. Il utilise le stockage local de votre navigateur pour : votre pseudo, le jeton d’accès vendeur d’une salle, le jeton d’accès d’une caméra de téléphone (durée de l’onglet) et le mémo de votre choix sur les cookies. Ces éléments sont indispensables au fonctionnement et ne nécessitent pas de consentement.</p>
      <p>Si un outil de mesure d’audience est configuré, il ne se charge <strong>qu’après votre acceptation</strong> dans le bandeau. Vous pouvez changer d’avis à tout moment avec le lien « Gérer les cookies » en bas de page.</p></section>
    <section><h2>5. Destinataires et transferts</h2>
      <p>Les participants d’une salle voient le nom de la salle, les pseudos, la vidéo et les lots. Notre hébergeur (Render) traite les données techniques. La connexion vidéo utilise par défaut un serveur STUN public de Google, qui voit votre adresse IP pour établir la connexion. Selon les cas, des transferts hors de l’Union européenne peuvent avoir lieu, encadrés par les garanties prévues par le RGPD.</p></section>
    <section><h2>6. Durées de conservation</h2>
      <p>Les salles et leur contenu sont stockés en mémoire et supprimés après six heures d’inactivité ou au redémarrage du serveur. Les données stockées dans votre navigateur restent jusqu’à leur suppression par vos soins.</p></section>
    <section><h2>7. Vos droits</h2>
      <p>Vous pouvez demander l’accès, la rectification, l’effacement, la limitation, la portabilité et vous opposer au traitement de vos données, ainsi que retirer votre consentement. Écrivez-nous à l’adresse de contact ci-dessus. Vous pouvez aussi saisir la CNIL (<a href="https://www.cnil.fr/fr/plaintes" rel="noopener noreferrer" target="_blank">cnil.fr/fr/plaintes</a>).</p></section>
    <section><h2>8. Sécurité</h2>
      <p>Connexion chiffrée (HTTPS), accès vendeur protégé par un jeton secret, limitation du nombre de requêtes, aucune clé d’API exposée dans le navigateur. Ne partagez jamais votre clé privée ni votre phrase de récupération : le site ne vous les demande jamais.</p></section>
    <p className="legal-note">Ce texte décrit le fonctionnement actuel du prototype ; il doit être relu et complété par l’éditeur (identité, contact, hébergeur) avant une exploitation réelle.</p>
  </LegalPage>;
}
