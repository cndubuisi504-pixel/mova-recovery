export type Project = {
 id:string;name:string;contract:string;asset:string;destinationType:string;simulationSupported?:boolean;implementation?:string;
};
export type Position = {
 wallet:string; amountWei:string; amount:string; state:'position_found'|'no_position'; blockNumber:string; blockHash:string; observedAt:string;
 protocol:Project; signingEnabled:false;
 availableWei?:string;availableAmount?:string;lockedWei?:string;lockedAmount?:string;
 simulation?:'passed'; gasEstimate?:string|null; note?:string;
 transaction?:{from:string;to:string;data:string;value:string;chainId:number};
};
export type FailedCheck={protocol:Project;state:'check_failed';message:string;errorCode:string;signingEnabled:false};
export type ProjectCheck=Position|FailedCheck;
export type Discovery={schemaVersion:2;chainId:1;wallet:string;blockNumber:string;blockHash:string;observedAt:string;state:'complete'|'partial'|'failed';results:ProjectCheck[];signingEnabled:false;scope:string};
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
 if(data.schemaVersion!==2||!Array.isArray(data.results)||data.results.length!==2||data.signingEnabled!==false)throw new Error('The discovery service needs an update. Please refresh or try again shortly.');
 return data;
}
export const short=(s:string)=>s.slice(0,6)+'…'+s.slice(-4);
// Preserve exact token quantities without floating-point rounding.
export function displayAmount(value:string){const [whole,fraction]=value.split('.');return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction?'.'+fraction:'');}
