import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'BRIC À BRAC — Liquidation du futur',
  description: 'Le téléachat du chaos. Filmez. L’IA expertise. Le prix dégringole. Monad tranche.'
};
export default function Layout({children}: {children: React.ReactNode}) {
  return <html lang="fr"><body>{children}</body></html>;
}
