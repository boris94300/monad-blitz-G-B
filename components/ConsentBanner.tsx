'use client';
import {useEffect, useState} from 'react';

const KEY = 'consent:analytics';
type Choice = 'granted' | 'denied' | null;
type Analytics = {domain: string; src: string} | null;

function readChoice(): Choice {
  try { const v = localStorage.getItem(KEY); return v === 'granted' || v === 'denied' ? v : null; } catch { return null; }
}

/** Cookie/consent banner. Analytics load only after an explicit "Accepter"; refusing is as easy as accepting. */
export function ConsentBanner() {
  const [choice, setChoice] = useState<Choice>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = readChoice();
    setChoice(stored);
    setOpen(stored === null);
    const reopen = (e: Event) => { if ((e.target as HTMLElement | null)?.closest?.('[data-cookie-settings]')) setOpen(true); };
    document.addEventListener('click', reopen);
    return () => document.removeEventListener('click', reopen);
  }, []);

  useEffect(() => {
    if (choice !== 'granted' || document.getElementById('analytics-script')) return;
    let cancelled = false;
    fetch('/api/config').then(r => r.json()).then((cfg: {analytics?: Analytics}) => {
      if (cancelled || !cfg.analytics) return;
      const script = document.createElement('script');
      script.id = 'analytics-script'; script.defer = true;
      script.dataset.domain = cfg.analytics.domain; script.src = cfg.analytics.src;
      document.head.appendChild(script);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [choice]);

  function decide(value: 'granted' | 'denied') {
    try { localStorage.setItem(KEY, value); } catch {}
    setChoice(value); setOpen(false);
    if (value === 'denied') document.getElementById('analytics-script')?.remove();
  }

  if (!open) return null;
  return <section className="consent" aria-labelledby="consent-title" aria-describedby="consent-text">
    <div>
      <h2 id="consent-title">Vos cookies, votre choix</h2>
      <p id="consent-text">Le site fonctionne sans cookie de suivi. Avec votre accord, nous mesurons l’audience de façon anonyme pour l’améliorer. Voir la <a href="/confidentialite">politique de confidentialité</a>.</p>
    </div>
    <div className="consent-actions">
      <button type="button" className="button dark" onClick={() => decide('denied')}>Refuser</button>
      <button type="button" className="button primary" onClick={() => decide('granted')}>Accepter</button>
    </div>
  </section>;
}
