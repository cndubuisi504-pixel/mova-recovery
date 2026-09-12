export type Position = {
 wallet:string; amountWei:string; amount:string; state:'position_found'|'no_position'; blockNumber:string; blockHash:string; observedAt:string;
 protocol:{name:string;contract:string;asset:string;destinationType:string}; signingEnabled:false;
 simulation?:'passed'; gasEstimate?:string|null; note?:string;
 transaction?:{from:string;to:string;data:string;value:string;chainId:number};
};
export async function checkPosition(wallet:string,simulate=false,signal?:AbortSignal):Promise<Position>{
 const res=await fetch(simulate?'/api/simulate':'/api/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({wallet}),signal});
 if(res.status===429) throw new Error('Too many checks in a short time. Please wait a minute and try again.');
 let data;
 try { data=await res.json(); } catch { throw new Error('The checking service is unavailable. Please try again shortly.'); }
 if(!res.ok) throw new Error(data.message||'The check could not be completed. Please try again.');
 return data;
}
export const short=(s:string)=>s.slice(0,6)+'…'+s.slice(-4);
