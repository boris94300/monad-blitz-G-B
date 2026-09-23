import type {Metadata} from 'next';
import {LegalPage} from '@/components/LegalPage';
import {CONTACT_EMAIL} from '@/lib/site';

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation',
  description: 'Règles d’utilisation de BRIC À BRAC : ventes fictives, MON de test, consentement des personnes filmées, responsabilités.',
  alternates: {canonical: '/cgu'}
};

export default function Terms() {
  return <LegalPage title="Conditions générales d’utilisation" intro="En utilisant BRIC À BRAC, vous acceptez les règles ci-dessous. Elles sont courtes parce que le jeu est fictif.">
    <section><h2>1. Éditeur et hébergement</h2>
      <p>BRIC À BRAC est un prototype réalisé dans le cadre d’un hackathon Monad, édité par ses auteurs (contact : {CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : <em>[à renseigner par l’éditeur]</em>}). Le site est hébergé par Render, Inc.</p></section>
    <section><h2>2. Objet du service</h2>
      <p>Le service permet d’ouvrir une salle de vente en direct où les prix d’objets fictifs baissent jusqu’à ce qu’un participant « achète ». Les descriptions, notes et estimations sont générées automatiquement et volontairement fantaisistes.</p></section>
    <section><h2>3. Aucune vente réelle</h2>
      <p>Aucun objet, aucun service et aucune personne ne sont réellement vendus. Le mode « Répétition » simule les achats. Le mode « Monad Testnet » utilise des MON de test, sans valeur monétaire, sur un réseau de test. N’envoyez jamais de fonds réels.</p></section>
    <section><h2>4. Vos engagements</h2>
      <ul>
        <li>Filmer uniquement des lieux et des objets que vous avez le droit de filmer.</li>
        <li>Obtenir l’<strong>accord préalable de chaque personne</strong> avant de l’inclure à l’écran ou en « personnage fictif ». Les mineurs ne doivent pas être filmés sans l’accord de leurs représentants légaux.</li>
        <li>Ne pas diffuser de contenu illégal, haineux, humiliant ou portant atteinte aux droits de tiers.</li>
        <li>Ne pas perturber le service : automatisation abusive, spam, tentative d’accès aux salles d’autrui, contournement des limites.</li>
      </ul></section>
    <section><h2>5. Portefeuille et blockchain</h2>
      <p>Vous restez seul responsable de votre portefeuille et de vos signatures. Les transactions sur la blockchain sont publiques et irréversibles. Le contrat est fourni en l’état, sans audit.</p></section>
    <section><h2>6. Propriété intellectuelle</h2>
      <p>Le site, sa marque et son code sont protégés. Les composants tiers sont listés dans le dépôt du projet. Vous conservez vos droits sur les images que vous diffusez et accordez au service le droit technique de les transmettre aux participants de la salle.</p></section>
    <section><h2>7. Disponibilité et responsabilité</h2>
      <p>Le service est un prototype fourni « en l’état », sans garantie de disponibilité, et peut être interrompu ou réinitialisé à tout moment (les salles ne sont pas sauvegardées). Dans la limite permise par la loi, l’éditeur n’est pas responsable des dommages indirects, ni des pertes liées à l’usage d’un portefeuille ou d’un réseau de test.</p></section>
    <section><h2>8. Données personnelles</h2>
      <p>Le traitement de vos données est décrit dans la <a href="/confidentialite">politique de confidentialité</a>.</p></section>
    <section><h2>9. Droit applicable</h2>
      <p>Ces conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action ; à défaut, les tribunaux compétents seront ceux du ressort de l’éditeur, sous réserve des règles protégeant les consommateurs.</p></section>
    <p className="legal-note">Ce texte est un modèle adapté au prototype et ne constitue pas un avis juridique ; l’éditeur doit le relire et le compléter (identité, contact, juridiction) avant une exploitation réelle.</p>
  </LegalPage>;
}
