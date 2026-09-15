export type Project = {
 id:string;name:string;contract:string;chainId?:number;networkName?:string;asset:string;destinationType:string;simulationSupported?:boolean;implementation?:string;
};
export type Position = {
 wallet:string; amountWei:string; amount:string; state:'position_found'|'no_position'; blockNumber:string; blockHash:string; observedAt:string;
 protocol:Project; signingEnabled:false;stader?:StaderPosition;silicon?:SiliconPosition;
 availableWei?:string;availableAmount?:string;lockedWei?:string;lockedAmount?:string;
 simulation?:'passed'; gasEstimate?:string|null; note?:string;
 transaction?:{from:string;to:string;data:string;value:string;chainId:number};
};
export type FailedCheck={protocol:Project;state:'check_failed';message:string;errorCode:string;signingEnabled:false};
export type ProjectCheck=Position|FailedCheck;
export type Discovery={schemaVersion:3;chainId:1;wallet:string;blockNumber:string|null;blockHash:string|null;observedAt:string;state:'complete'|'partial'|'failed';results:ProjectCheck[];signingEnabled:false;scope:string};
async function post<T>(path:string,wallet:string,signal?:AbortSignal,projectId?:string):Promise<T>{
 const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({wallet,...(projectId?{projectId}:{})}),signal});
 if(res.status===429)throw new Error('Too many checks in a short time. Please wait a minute and try again.');
 let data;
 try{data=await res.json();}catch{throw new Error('The checking service is unavailable. Please try again shortly.');}
 if(!res.ok)throw new Error(data.message||'The check could not be completed. Please try again.');
 return data;
}
export function checkPosition(wallet:string,simulate=false,signal?:AbortSignal,projectId?:string):Promise<Position>{return post(simulate?'/api/simulate':'/api/scan',wallet,signal,projectId);}
export async function discoverProjects(wallet:string,signal?:AbortSignal):Promise<Discovery>{
 const data=await post<Discovery>('/api/discover',wallet,signal);
 if(data.schemaVersion!==3||!Array.isArray(data.results)||data.results.length!==4||new Set(data.results.map(r=>r.protocol.id)).size!==4||data.results.some(r=>!['etherdelta-eth','foundation-feth','stader-maticx','silicon-exit'].includes(r.protocol.id))||data.signingEnabled!==false)throw new Error('The discovery service needs an update. Please refresh or try again shortly.');
 return data;
}
export const short=(s:string)=>s.slice(0,6)+'…'+s.slice(-4);
// Preserve exact token quantities without floating-point rounding.
export function displayAmount(value:string){const [whole,fraction]=value.split('.');return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction?'.'+fraction:'');}
export type StaderQueueItem={index:number;key:string;validatorAddress:string;validatorNonce:string;requestEpoch:string;eligibleEpoch:string;state:'waiting'|'epoch_eligible'};
export type StaderPosition={requests:StaderQueueItem[];currentEpoch:string;delayEpochs:string;paused:boolean;instant:boolean;rateLocked:boolean;custodied:boolean;quoteWei:string|null;outputToken:string;outputAsset:'POL';executionEnabled:false};
export type SiliconExit={depositCount:number;globalIndex:string;originNetwork:number;token:string;amountWei:string;destination:string;sourceHash:string;reportedReady:boolean;state:'not_checked'|'check_failed'|'claimed'|'unclaimed';verificationEnabled:boolean};
export type SiliconPosition={exits:SiliconExit[];historyError:string|null;historyTotal:number|null;historyLimited:boolean;ethereumBlock:string|null;executionEnabled:false;sourceVerifiedInThisCheck:false;coverage:string;deadline:string};
export type StaderCheck={simulation:'passed';stage:'request_only'|'claim_only';amountWei:string|null;requestKey:string|null;gasEstimate:string|null;blockNumber:string;blockHash:string;signingEnabled:false;note:string};
export type SiliconProof={status:'already_claimed'|'proof_checked'|'waiting_for_root';sourceEventVerified:true;proofVerified:true;rootRegistered:boolean;claimed:boolean;depositCount:number;asset:string;amountWei:string;sourceHash:string;ethereumBlock:string;sourceBlock:string;signingEnabled:false;sourceCodeVerified:true;message:string};
export const networkFor=(project:Project)=>project.chainId===2355?'Silicon':'Ethereum';
export const explorerFor=(project:Project)=>project.chainId===2355?'https://scope.silicon.network':'https://etherscan.io';
export async function sunsetCheck<T>(action:'stader-check'|'silicon-proof',body:Record<string,unknown>,signal?:AbortSignal):Promise<T>{
 const res=await fetch('/api/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
 if(res.status===429)throw Error('Too many checks. Wait a minute and try again. No transaction was submitted.');
 let data;try{data=await res.json();}catch{throw Error('The checking service is temporarily unavailable.');}if(!res.ok)throw Error(data.message||'This read-only check could not be completed.');if(data.signingEnabled!==false)throw Error('The service returned an unsupported response. Nothing was submitted.');return data;
}
