/** Public identity of the site, shared by metadata, sitemap, robots and legal pages. */
export const SITE_URL = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || 'https://bric-a-brac-monad.onrender.com').replace(/\/+$/, '');
export const SITE_NAME = 'BRIC À BRAC';
export const SITE_TITLE = 'BRIC À BRAC — Enchères à la baisse en direct sur Monad';
export const SITE_DESCRIPTION = 'Transformez votre pièce en salle de vente : l’IA repère sept objets, les prix baissent en direct et le premier qui craque gagne. Objets fictifs, MON de test.';
/** Pages that must never be indexed: private rooms, camera pairing, technical setup. */
export const PRIVATE_SEGMENTS = ['host', 'join', 'scene', 'camera', 'setup'];
/** Room codes are 8 uppercase hexadecimal characters (see server/rooms.ts). */
export const ROOM_CODE = /^[A-F0-9]{8}$/;
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || '';
export const LEGAL_UPDATED = '21 septembre 2026';
