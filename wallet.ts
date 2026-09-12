export type Provider={request:(args:{method:string;params?:unknown[]})=>Promise<any>;on?:(event:string,callback:(value:any)=>void)=>void;removeListener?:(event:string,callback:(value:any)=>void)=>void;disconnect?:()=>Promise<void>};
type Announced={info:{uuid:string;name:string;rdns:string};provider:Provider};
export const discovered:Announced[]=[];
window.addEventListener('eip6963:announceProvider',((event:CustomEvent<Announced>)=>{if(!discovered.some(p=>p.info.uuid===event.detail.info.uuid))discovered.push(event.detail);}) as EventListener);
window.dispatchEvent(new Event('eip6963:requestProvider'));
export async function getProvider(kind:'metamask'|'phantom'|'walletconnect'):Promise<Provider>{
 const w=window as any;
 if(kind==='walletconnect'){
  const config=await fetch('/api/config').then(r=>r.json());
  if(!config.walletConnectProjectId) throw new Error('WalletConnect needs a project ID from the app operator. You can use an installed wallet or check a public address instead.');
  const {EthereumProvider}=await import('@walletconnect/ethereum-provider');
  const p=await EthereumProvider.init({projectId:config.walletConnectProjectId,chains:[1],showQrModal:true,methods:['eth_accounts','eth_requestAccounts','eth_chainId'],events:['accountsChanged','chainChanged'],metadata:{name:'Mova Recovery',description:'Read-only Ethereum recovery checker',url:window.location.origin,icons:[]}});
  await p.connect();
  return p as Provider;
 }
 window.dispatchEvent(new Event('eip6963:requestProvider'));
 const announced=discovered.find(p=>p.info.rdns.toLowerCase().includes(kind));
 if(announced) return announced.provider;
 if(kind==='phantom' && w.phantom?.ethereum) return w.phantom.ethereum;
 const injected=w.ethereum?.providers||[w.ethereum];
 const p=injected.find((p:any)=>p && (kind==='metamask'?p.isMetaMask&&!p.isPhantom:p.isPhantom));
 if(p) return p;
 throw new Error(`${kind==='metamask'?'MetaMask':'Phantom EVM'} wasn’t detected in this browser. Open Mova in your wallet’s browser, or check a public address below.`);
}
