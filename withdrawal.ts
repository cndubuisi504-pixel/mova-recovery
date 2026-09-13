export type WithdrawalPlan={version:1;projectId?:'etherdelta-eth'|'foundation-feth';recoveryId:string;wallet:string;amountWei:string;tx:{from:string;to:string;data:string;value:string;chainId:string;gas:string;gasPrice:string;nonce:string};preparedAt:number;expiresAt:number;fromBlock:string;fromHash:string};
export type PreparedWithdrawal={plan:WithdrawalPlan;envelope:string;verification:{simulation:'passed';blockNumber:string;blockHash:string};signingEnabled:true;maxFeeWei:string;estimatedFeeWei:string;confirmations:number};
export type TrackingRecord={version:1;envelope:string;plan:WithdrawalPlan;hash?:string;savedAt:number};
export type ConfirmedRecovery={recoveryId:string;wallet:string;destination:string;contract:string;protocol:string;chainId:1;asset:'ETH';amountWei:string;amount:string;transactionHash:string;blockNumber:string;blockHash:string;confirmedAt:string;gasFeeWei:string};
export type MonitoredWithdrawal={status:'pending'|'confirming'|'confirmed'|'reverted'|'transaction_changed'|'outcome_unverified'|'replaced_or_nonce_used'|'submission_unknown'|'confirmation_timeout';hash?:string;message?:string;confirmations?:number;requiredConfirmations?:number;recovery?:ConfirmedRecovery};
export async function withdrawalRequest<T>(action:string,body:unknown):Promise<T>{
 const res=await fetch('/api/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(res.status===429)throw Error('Too many checks. Please wait a minute before trying again. Your wallet transaction will not be resubmitted.');
 let data;try{data=await res.json();}catch{throw Error('The recovery service is temporarily unavailable. Check your wallet before taking further action.');}
 if(!res.ok)throw Error(data.message||'The recovery request could not be verified.');return data;
}
export const TRACKING_KEY='mova.withdrawal.v1';
export function loadTracking():TrackingRecord|null{
 const value=localStorage.getItem(TRACKING_KEY);if(!value)return null;
 const r=JSON.parse(value);
 if(r.version!==1||typeof r.envelope!=='string'||r.envelope.length>1800||!r.plan?.tx||!/^0x[0-9a-fA-F]{40}$/.test(r.plan.wallet||'')||!/^\d{1,78}$/.test(r.plan.amountWei||'')||!/^0x[0-9a-fA-F]{1,64}$/.test(r.plan.tx.gas||'')||!/^0x[0-9a-fA-F]{1,64}$/.test(r.plan.tx.gasPrice||'')||typeof r.savedAt!=='number'||(r.hash&&!/^0x[0-9a-fA-F]{64}$/.test(r.hash)))throw Error('The saved recovery record cannot be read. Check your wallet history before removing it.');
 return r;
}
export function saveTracking(record:TrackingRecord){const value=JSON.stringify(record);localStorage.setItem(TRACKING_KEY,value);if(localStorage.getItem(TRACKING_KEY)!==value)throw Error('This browser cannot retain transaction tracking safely. Signing was not requested.');}

export function withdrawalName(plan:WithdrawalPlan){return plan.projectId==='foundation-feth'?'Foundation FETH':'EtherDelta';}
