export function priceAt(lot: {startPrice: number; floorPrice: number; duration: number; startTime: number; status?: string; soldPrice?: number}, now = Date.now()) {
  if (lot.status === 'sold') return lot.soldPrice ?? lot.floorPrice;
  if (!lot.startTime) return lot.startPrice;
  const elapsed = Math.max(0, Math.floor(now / 1000) - Math.floor(lot.startTime / 1000));
  const remaining = Math.max(0, lot.duration - elapsed);
  return lot.floorPrice + (lot.startPrice - lot.floorPrice) * (remaining / lot.duration) ** 2;
}
export function formatMon(value: number) {
  return value.toLocaleString('fr-FR', {minimumFractionDigits: 3, maximumFractionDigits: 4});
}
export function shortAddress(value: string) { return value.startsWith('0x') ? `${value.slice(0,6)}…${value.slice(-4)}` : value; }
export function auctioneer(progress: number) {
  if (progress < .22) return 'Une pièce exceptionnelle. Mon algorithme est formel.';
  if (progress < .48) return 'À ce prix-là, c’est presque une décision rationnelle.';
  if (progress < .75) return 'Les collectionneurs avertis transpirent en silence.';
  if (progress < 1) return 'S’il vous plaît. J’ai déjà annoncé la vente à ma mère.';
  return 'Prix plancher. Mon estime de moi est désormais offerte avec.';
}
