import {ImageResponse} from 'next/og';

export const alt = 'BRIC À BRAC — Enchères à la baisse en direct sur Monad';
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#f5f5f7', color: '#1d1d1f', padding: 72, fontFamily: 'sans-serif'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20, fontSize: 44, fontWeight: 800, letterSpacing: -2}}>
        <div style={{width: 72, height: 72, borderRadius: 36, background: '#1d1d1f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40}}>⚡</div>
        BRIC À BRAC®
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        <div style={{fontSize: 92, fontWeight: 800, lineHeight: 1.02, letterSpacing: -4}}>Le luxe de l’absurde.</div>
        <div style={{fontSize: 56, color: '#0058b0', fontWeight: 600}}>Le prix de l’instant.</div>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 30, color: '#4a4a52'}}>
        <span>Filmez. L’IA expertise. Le prix dégringole.</span>
        <span>Monad Testnet · objets fictifs</span>
      </div>
    </div>,
    size
  );
}
