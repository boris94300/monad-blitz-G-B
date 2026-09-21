import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import AuctionApp from '@/components/AuctionApp';
import {PRIVATE_SEGMENTS, ROOM_CODE} from '@/lib/site';

type Props = {params: Promise<{path?: string[]}>};

/** Only real routes reach the app; anything else gets the custom 404 page. */
function isKnownRoute(path: string[]) {
  if (path.length === 0) return true;
  if (path.length === 1) return path[0] === 'setup';
  if (path.length === 2) return ['host', 'join', 'scene', 'camera'].includes(path[0]) && ROOM_CODE.test(path[1].toUpperCase());
  return false;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {path = []} = await params;
  if (path[0] && PRIVATE_SEGMENTS.includes(path[0])) return {title: 'Salle privée', robots: {index: false, follow: false}, alternates: {canonical: undefined}};
  return {};
}

export default async function Page({params}: Props) {
  const {path = []} = await params;
  if (!isKnownRoute(path)) notFound();
  return <AuctionApp />;
}
