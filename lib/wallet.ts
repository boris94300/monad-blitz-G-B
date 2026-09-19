import {createWalletClient,createPublicClient,custom,http,parseEther,formatEther} from 'viem';
import type {EIP1193Provider,Address} from 'viem';
import {auctionAbi,monadTestnet} from './chain';
import type {Lot} from './types';
declare global {interface Window {ethereum?:EIP1193Provider}}
const publicClient=createPublicClient({chain:monadTestnet,transport:http()});
export async function connectWallet(){
  if(!window.ethereum)throw new Error('Ouvrez ce lien dans le navigateur de MetaMask ou Rabby sur téléphone, ou installez leur extension sur ordinateur.');
  const wallet=createWalletClient({chain:monadTestnet,transport:custom(window.ethereum)});
  const [account]=await wallet.requestAddresses();
  try{await wallet.switchChain({id:10143});}
  catch(e){if((e as {code?:number}).code===4001)throw e;await wallet.addChain({chain:monadTestnet});await wallet.switchChain({id:10143});}
  if(await wallet.getChainId()!==10143)throw new Error('Choisissez Monad Testnet dans votre wallet.');
  return {wallet,account};
}
export async function listOnChain(address:Address,input:Lot|Lot[]){
  const {wallet,account}=await connectWallet();
  const lots=Array.isArray(input)?input:[input];
  return wallet.writeContract({address,abi:auctionAbi,functionName:'listItems',account,args:[lots.map(lot=>({name:lot.name,startPrice:parseEther(String(lot.startPrice)),floorPrice:parseEther(String(lot.floorPrice)),duration:lot.duration}))]});
}
export async function buyOnChain(address:Address,lot:Lot){
  const {wallet,account}=await connectWallet();
  if(lot.chainId===undefined)throw new Error('Ce lot n’a pas encore été inscrit sur Monad.');
  const id=BigInt(lot.chainId);
  const price=await publicClient.readContract({address,abi:auctionAbi,functionName:'currentPrice',args:[id]});
  const {request}=await publicClient.simulateContract({address,abi:auctionAbi,functionName:'buy',args:[id],account,value:price});
  const hash=await wallet.writeContract(request);
  const receipt=await publicClient.waitForTransactionReceipt({hash,timeout:60000});
  if(receipt.status!=='success')throw new Error('Achat refusé : quelqu’un a peut-être acheté avant vous.');
  return {hash,account,price:Number(formatEther(price))};
}
export async function deployContract(){
  const {wallet,account}=await connectWallet();
  const artifact=await fetch('/DutchAuction.json').then(r=>r.json());
  const hash=await wallet.deployContract({abi:artifact.abi,bytecode:artifact.bytecode,account});
  const receipt=await publicClient.waitForTransactionReceipt({hash,timeout:90000});
  if(receipt.status!=='success'||!receipt.contractAddress)throw new Error('Le déploiement n’a pas abouti.');
  return {address:receipt.contractAddress,hash};
}
