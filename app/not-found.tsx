import type {Metadata} from 'next';
import Link from 'next/link';

export const metadata: Metadata = {title: 'Page introuvable', robots: {index: false, follow: false}};

export default function NotFound() {
  return <main id="contenu" className="notfound">
    <span className="eyebrow">ERREUR 404 · LOT INTROUVABLE</span>
    <h1>Cet objet a été adjugé.<br/>Ou n’a jamais existé.</h1>
    <p>La page que vous cherchez n’est plus en vente. Si vous cherchiez une salle, vérifiez son code : il compte 8 caractères (chiffres de 0 à 9 et lettres de A à F).</p>
    <div className="notfound-actions">
      <Link className="button primary" href="/">Retour à l’accueil</Link>
      <Link className="button text-button" href="/#join">J’ai un code de salle</Link>
    </div>
  </main>;
}
