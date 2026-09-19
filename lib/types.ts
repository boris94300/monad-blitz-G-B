export type Candidate = {
  label: string; confidence: number; bbox: [number, number, number, number];
  person: boolean;
};
export type Lot = {
  id: string; detectionLabel?: string; name: string; label: string; description: string; title: string;
  traits: string[]; bbox: Candidate['bbox']; person: boolean; image: string;
  estimatedPrice: number; startPrice: number; floorPrice: number; duration: number;
  startTime: number; status: 'preview' | 'active' | 'sold';
  buyer?: string; soldPrice?: number; chainId?: string; txHash?: string;
  source: 'vision' | 'local' | 'rehearsal' | 'manual';
};
export type Room = {
  code: string; name: string; mode: 'demo' | 'chain'; viewers: number;
  live: boolean; createdAt: number; active: Lot | null; lots: Lot[]; history: Lot[]; salesCount:number; volume:number;
  serverTime: number; chainHealthy: boolean; videoSource: 'host' | 'phone' | null;
};
export type Config = {
  vision: boolean; contractAddress: `0x${string}` | null; publicUrl: string;
  chainId: number; iceServers: RTCIceServer[];
};

export type TrackingFrame={candidates:Candidate[];width:number;height:number;at:number};
