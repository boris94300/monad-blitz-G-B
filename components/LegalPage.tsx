import Link from 'next/link';
import {LEGAL_UPDATED, SITE_NAME} from '@/lib/site';

export function LegalPage({title, intro, children}: {title: string; intro: string; children: React.ReactNode}) {
  return <div className="landing legal-page">
    <header className="topbar"><Link className="brand" href="/">BRIC<span className="brand-small">À</span>BRAC<span className="brand-dot">®</span></Link><Link href="/">Retour à l’accueil →</Link></header>
    <main id="contenu" className="legal">
      <span className="eyebrow">INFORMATIONS LÉGALES · MISE À JOUR LE {LEGAL_UPDATED.toUpperCase()}</span>
      <h1>{title}</h1>
      <p className="legal-intro">{intro}</p>
      {children}
    </main>
    <LegalFooter/>
  </div>;
}

export function LegalFooter() {
  return <footer className="legal-footer"><span>© {new Date().getFullYear()} {SITE_NAME} · Prototype de hackathon, objets fictifs, MON de test.</span><nav aria-label="Liens légaux"><Link href="/cgu">Conditions d’utilisation</Link><Link href="/confidentialite">Confidentialité</Link><button type="button" data-cookie-settings>Gérer les cookies</button></nav></footer>;
}
