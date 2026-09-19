import { defineChain, parseAbi } from 'viem';
export const monadTestnet = defineChain({
  id: 10143, name: 'Monad Testnet',
  nativeCurrency: {name: 'Test MON', symbol: 'MON', decimals: 18},
  rpcUrls: {default: {http: ['https://testnet-rpc.monad.xyz']}},
  blockExplorers: {default: {name: 'MonadVision', url: 'https://testnet.monadvision.com'}},
  testnet: true
});
export const auctionAbi = parseAbi([
  'struct ItemInput { string name; uint128 startPrice; uint128 floorPrice; uint32 duration; }',
  'struct Item { address seller; string name; uint128 startPrice; uint128 floorPrice; uint64 startTime; uint32 duration; address buyer; bool sold; uint128 soldPrice; }',
  'function listItems(ItemInput[] inputs) returns (uint256 firstId)',
  'function currentPrice(uint256 id) view returns (uint256)',
  'function buy(uint256 id) payable',
  'function getItem(uint256 id) view returns (Item)',
  'function itemCount() view returns (uint256)',
  'event ItemListed(uint256 indexed id, address indexed seller, string name, uint128 startPrice, uint128 floorPrice, uint64 startTime, uint32 duration)',
  'event ItemSold(uint256 indexed id, address indexed buyer, uint256 price, uint256 timestamp)',
  'error InvalidInput()', 'error NotFound()', 'error AlreadySold()', 'error InsufficientPayment()', 'error SelfPurchase()', 'error TransferFailed()', 'error Reentrancy()'
]);
