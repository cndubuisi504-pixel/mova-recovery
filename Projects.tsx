import {ArrowLeft,ArrowRight,ArrowUpRight,Check,Download,Info,LoaderCircle,LockKeyhole,RefreshCw,Search,TriangleAlert} from 'lucide-react';
import {short,displayAmount,type Discovery,type Position} from './api';

export function ProjectResults({scan,onSelect,onRetry,onBack,onDownload}:{scan:Discovery;onSelect:(p:Position)=>void;onRetry:()=>void;onBack:()=>void;onDownload:()=>void}){
 const found=scan.results.filter(r=>r.state==='position_found').length;
 const failed=scan.results.filter(r=>r.state==='check_failed').length;
 return <div className="project-results">
  <button className="back-button" onClick={onBack}><ArrowLeft size={14}/>Change address</button>
  <h2>{found?`${found} ${found===1?'position':'positions'} found`:failed?'We couldn’t finish every check':'No positions found in these checks'}</h2>
  <p className="card-description">{found?'Here’s what the checked projects hold for this address. A position is not yet a verified recovery.':failed?'An incomplete check is not a zero balance. Completed project results are listed separately below.':'No balance was found in either checked position. This is not a complete search of your wallet’s history.'}</p>
  <div className="discovery-wallet"><span>Ethereum wallet</span><span className="mono" title={scan.wallet}>{short(scan.wallet)}</span></div>
  <div className="project-list" aria-label="Individual project results">{scan.results.map(row=>{
   const failed=row.state==='check_failed',positive=row.state==='position_found';
   return <article key={row.protocol.id} className={`project-result ${failed?'check-error':positive?'check-positive':''}`}>
    <div className="project-result-head"><div className="protocol-monogram">{row.protocol.id==='foundation-feth'?'F':'EΔ'}</div><div><h3>{row.protocol.name}</h3><p>{row.protocol.asset} · Ethereum</p></div>{failed?<TriangleAlert size={17}/>:positive?<Check size={18}/>:<Search size={17}/>}</div>
    <div className={`project-state ${failed?'failed':''}`}>{failed?'Couldn’t complete check':positive?'Position found':'No position found'}</div>
    {row.state==='check_failed'?<p className="project-explanation">{row.message}</p>:<>
     {positive&&<div className="project-balance">{displayAmount(row.amount)} <span>{row.protocol.asset}</span></div>}
     {row.protocol.id==='foundation-feth'&&positive&&<p className="project-explanation">Available: {displayAmount(row.availableAmount||'0')} FETH<br/>Locked: {displayAmount(row.lockedAmount||'0')} FETH</p>}
     {!positive&&<p className="project-explanation">{row.protocol.id==='foundation-feth'?'No available or locked FETH balance was reported.':'No internal native ETH balance was reported.'}</p>}
     {positive&&<p className="project-capability"><LockKeyhole size={12}/>{'Simulation available · controlled withdrawals require approval'}</p>}
    </>}
    <div className="project-actions"><a href={`https://etherscan.io/address/${row.protocol.contract}#code`} target="_blank" rel="noreferrer">Contract<ArrowUpRight size={13}/></a>{row.state==='position_found'&&<button onClick={()=>onSelect(row)}>View position<ArrowRight size={14}/></button>}{failed&&<button onClick={onRetry}>Retry checks<RefreshCw size={13}/></button>}</div>
   </article>;
  })}</div>
  <div className="discovery-stamp"><span>{scan.results.length-failed} of {scan.results.length} checks completed</span><a href={`https://etherscan.io/block/${scan.blockNumber}`} target="_blank" rel="noreferrer">Block {Number(scan.blockNumber).toLocaleString()}<ArrowUpRight size={12}/></a></div>
  <p className="discovery-time">Checked {new Date(scan.observedAt).toLocaleString()}</p>
  <button className="button dark wide" onClick={onRetry}><RefreshCw size={15}/>Run checks again</button>
  <button className="text-button center" onClick={onDownload}><Download size={14}/>Download check report</button>
 </div>;
}
export function FoundationDetails({position,onBack,onRefresh,onDownload,onSimulate,onWithdraw,busy}:{position:Position;onBack:()=>void;onRefresh:()=>void;onDownload:()=>void;onSimulate:()=>void;onWithdraw:()=>void;busy:boolean}){
 const locked=BigInt(position.lockedWei||'0')>0n,available=BigInt(position.availableWei||'0')>0n;
 return <div className="foundation-details">
  <button className="back-button" onClick={onBack}><ArrowLeft size={14}/>Back to project checks</button>
  <div className="result-label"><span className="green-dot"/>Foundation FETH position</div>
  <h2 className="feth-amount">{displayAmount(position.amount)} <span>FETH</span></h2>
  <p className="card-description">Total balance recorded for this address, including any funds still locked.</p>
  <dl className="review-details"><div><dt>Available balance</dt><dd>{displayAmount(position.availableAmount||'0')} FETH</dd></div><div><dt>Locked balance</dt><dd>{displayAmount(position.lockedAmount||'0')} FETH</dd></div><div><dt>Position address</dt><dd className="address-wrap">{position.wallet}</dd></div><div><dt>Network</dt><dd>Ethereum Mainnet</dd></div><div><dt>Contract</dt><dd><a href={`https://etherscan.io/address/${position.protocol.contract}#code`} target="_blank" rel="noreferrer">{short(position.protocol.contract)} <ArrowUpRight size={13}/></a><small>Proxy and implementation checked</small></dd></div><div><dt>Checked at block</dt><dd><a href={`https://etherscan.io/block/${position.blockNumber}`} target="_blank" rel="noreferrer">{Number(position.blockNumber).toLocaleString()} <ArrowUpRight size={13}/></a></dd></div></dl>
  <div className="info-panel"><Info size={17}/><p>{locked?'Some FETH remains locked. The checker does not assume lockups have expired.':'Available FETH was reported by the reviewed balance-reading method.'} This does not establish wallet control or verify that a withdrawal will succeed.</p></div>
  <dl className="review-details"><div><dt>Withdrawal action</dt><dd>Available FETH → native ETH<small>1 FETH redeems for 1 ETH, before gas</small></dd></div><div><dt>Destination</dt><dd>Position owner only</dd></div></dl>
  {!available?<div className="info-panel"><LockKeyhole size={17}/><p>No available balance can be withdrawn now. Locked FETH remains visible; refresh after expiry to check again.</p></div>:position.simulation==='passed'?<><div className="simulation-panel passed"><Check size={19}/><div><strong>Read-only simulation passed</strong><p>Available FETH withdrawal simulated at block {Number(position.blockNumber).toLocaleString()}. No transaction was sent. The small pilot request is prepared separately.</p></div></div><button className="button dark wide" onClick={onWithdraw}>Review controlled withdrawal<ArrowRight size={16}/></button></>:<button className="button primary wide" disabled={busy} onClick={onSimulate}>{busy?<><LoaderCircle className="spin" size={16}/>Simulating available withdrawal…</>:<>Run read-only simulation<ArrowRight size={16}/></>}</button>}
  <p className="release-note">Real withdrawals require separate FETH review approval, an approved owner wallet and exact-transaction simulation. A proxy upgrade invalidates the reviewed path. No approvals or alternate recipients are requested. USD estimates are unavailable.</p>
  <button className="text-button center" onClick={onRefresh}><RefreshCw size={14}/>Refresh project checks</button>
  <button className="text-button center" onClick={onDownload}><Download size={14}/>Download position report</button>
 </div>;
}
export function ProjectCoverage({publicRpc}:{publicRpc:boolean}){
 const rows=[{name:'EtherDelta',symbol:'EΔ',asset:'Native ETH',address:'0x8d12A197cB00D4747a1fe03395095ce2A5CC6819',note:'Internal ETH discovery and read-only simulation. A restricted withdrawal pilot is available only when an operator enables an approved test wallet.'},{name:'Foundation FETH',symbol:'F',asset:'Available + locked FETH',address:'0x49128CF8ABE9071ee24540a296b5DED3F9D50443',note:'Available and locked balance discovery, read-only simulation and a restricted FETH-to-ETH pilot. Locked funds are excluded; proxy execution tracing is required before completion.'}];
 return <><p className="modal-intro">Paste one Ethereum wallet address. Mova checks the following known positions without requiring the project name.</p>{rows.map(row=><div className="coverage-card" key={row.address}><div className="coverage-heading"><div className="protocol-monogram">{row.symbol}</div><div><h3>{row.name}</h3><span>{row.asset}</span></div></div><p className="fine-print">{row.note}</p><p className="code-address">{row.address}</p><a className="text-button" href={`https://etherscan.io/address/${row.address}#code`} target="_blank" rel="noreferrer">Inspect contract<ArrowUpRight size={13}/></a></div>)}<div className="info-panel"><Info size={17}/><p>A scan checks these specific contracts. It does not search every project, establish that an app has shut down, or cover Solana. Failed checks are reported separately from zero balances.</p></div><p className="fine-print">Public discovery does not authorize transactions. Controlled withdrawals require separate eligibility and wallet approval. {publicRpc?'This preview uses a public research RPC; availability is not guaranteed.':'This checker uses an operator-configured RPC.'} Your public address is sent to the backend and RPC provider for these reads.</p></>;
}
