import type {Metadata, Viewport} from 'next';
import './globals.css';
import './luxury.css';
import './clean.css';
import './site.css';
import {ConsentBanner} from '@/components/ConsentBanner';
import {SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION} from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {default: SITE_TITLE, template: `%s · ${SITE_NAME}`},
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {canonical: '/'},
  openGraph: {type: 'website', locale: 'fr_FR', siteName: SITE_NAME, title: SITE_TITLE, description: SITE_DESCRIPTION, url: '/'},
  twitter: {card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION},
  robots: {index: true, follow: true}
};
export const viewport: Viewport = {width: 'device-width', initialScale: 1, themeColor: '#f5f5f7'};

export default function Layout({children}: {children: React.ReactNode}) {
  return <html lang="fr"><body>
    <a className="skip-link" href="#contenu">Aller au contenu</a>
    {children}
    <ConsentBanner/>
  </body></html>;
}
