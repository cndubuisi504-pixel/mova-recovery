import {useState,useEffect,useRef,useCallback} from 'react';
import {ArrowUpRight,ArrowRight,ArrowLeft,Check,ChevronDown,Copy,ExternalLink,LockKeyhole,Menu,Search,ShieldCheck,Wallet,X,LoaderCircle,Info,RefreshCw,Unplug,Download,FileText,ScanLine,Plus,Minus} from 'lucide-react';
import {isAddress,zeroAddress} from 'viem';
import Modal from './Modal';
import {checkPosition,short,type Position} from './api';
import {getProvider,type Provider} from './wallet';

function Mark({small=false}:{small?:boolean}){return <svg width={small?25:33} height={small?25:33} viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M4 27V9h7l7 10 7-10h7v18h-7V19l-7 10-7-10v8H4Z" fill="currentColor"/></svg>;}
function Eth(){return <svg width="16" height="22" viewBox="0 0 16 26" aria-hidden="true"><path d="m8 0 8 13-8 5-8-5L8 0Z" fill="#828990"/><path d="m8 0 8 13-8 5V0Z" fill="#505861"/><path d="m0 15 8 5 8-5-8 11-8-11Z" fill="#828990"/><path d="m8 20 8-5-8 11v-6Z" fill="#505861"/></svg>;}
const contract='0x8d12A197cB00D4747a1fe03395095ce2A5CC6819';
const faqs=[
 ['Can Mova recover a lost wallet?', 'No. Mova does not recover private keys or seed phrases. A real withdrawal requires the wallet that owns the position to authorize it. Never give anyone your signing credentials.'],
 ['Which protocols can I check?', 'This research build checks native ETH balances in one EtherDelta contract on Ethereum Mainnet. ERC-20 positions and other protocols are not included. No result does not mean you have no funds elsewhere.'],
 ['Will checking an address cost gas?', 'No. Address checks and simulations are read-only and do not submit a transaction. A future real withdrawal would require network fees and your explicit approval in your wallet.'],
 ['Does a successful simulation mean my funds are recovered?', 'No. It means the withdrawal call succeeded against a particular block’s state. State can change, and a simulation neither proves wallet control nor guarantees execution. Only a confirmed, verified on-chain withdrawal is a recovery.'],
];
export default function App(){
 const [modal,setModal]=useState<'wallet'|'docs'|'coverage'|null>(null);
 const [mobile,setMobile]=useState(false);
 const [address,setAddress]=useState('');
 const [connected,setConnected]=useState('');
 const [chain,setChain]=useState<number|null>(null);
 const [provider,setProvider]=useState<Provider|null>(null);
 const [connecting,setConnecting]=useState('');
 const [walletError,setWalletError]=useState('');
 const [state,setState]=useState<'idle'|'scanning'|'result'|'review'|'simulating'>('idle');
 const [position,setPosition]=useState<Position|null>(null);
 const [error,setError]=useState('');
 const [copied,setCopied]=useState(false);
 const [faq,setFaq]=useState<number|null>(null);
 const [scanStep,setScanStep]=useState(0);
 const [wcReady,setWcReady]=useState(false);
 const [publicRpc,setPublicRpc]=useState(true);
 const request=useRef<AbortController|null>(null);
 const checker=useRef<HTMLElement>(null);
 const closeModal=useCallback(()=>setModal(null),[]);
 const openWallet=()=>{setWalletError('');setModal('wallet');setMobile(false);};
 const reset=useCallback(()=>{request.current?.abort();setState('idle');setPosition(null);setError('');},[]);
 useEffect(()=>{fetch('/api/config').then(r=>r.json()).then(c=>{setWcReady(!!c.walletConnectProjectId);setPublicRpc(!c.rpcConfigured);}).catch(()=>{});return()=>request.current?.abort();},[]);
 const runScan=useCallback(async(wallet:string)=>{
  request.current?.abort();const ctrl=new AbortController();request.current=ctrl;
  setError('');setPosition(null);setState('scanning');setScanStep(0);
  try{const result=await checkPosition(wallet,false,ctrl.signal);if(!ctrl.signal.aborted){setPosition(result);setState('result');}}
  catch(e){if(!ctrl.signal.aborted){setError(e instanceof Error?e.message:'We couldn’t complete the check. Please try again.');setState('idle');}}
 },[]);
 useEffect(()=>{if(state!=='scanning')return;const timer=setInterval(()=>setScanStep(s=>Math.min(s+1,2)),1700);return()=>clearInterval(timer);},[state]);
 useEffect(()=>{
  if(!provider)return;
  const accounts=(values:string[])=>{reset();setConnected(values[0]||'');setAddress(values[0]||'');if(!values.length){setProvider(null);setChain(null);}else{setError('Your wallet account changed. Check the address, then scan again.');}};
  const network=(value:string)=>{reset();setChain(Number(value));setError('Your wallet network changed. Review your network before scanning.');};
  const disconnected=()=>{reset();setConnected('');setProvider(null);setChain(null);setError('Your wallet disconnected. You can reconnect or check a public address.');};
  provider.on?.('accountsChanged',accounts);provider.on?.('chainChanged',network);provider.on?.('disconnect',disconnected);
  return()=>{provider.removeListener?.('accountsChanged',accounts);provider.removeListener?.('chainChanged',network);provider.removeListener?.('disconnect',disconnected);};
 },[provider,reset]);
 async function connect(kind:'metamask'|'phantom'|'walletconnect'){
  setConnecting(kind);setWalletError('');
  try{
   const p=await getProvider(kind);
   const list=await p.request({method:'eth_requestAccounts'});
   if(!Array.isArray(list)||!isAddress(list[0]||''))throw new Error('The wallet did not return a valid address. Please try again.');
   const net=Number(await p.request({method:'eth_chainId'}));
   reset();setProvider(p);setConnected(list[0]);setAddress(list[0]);setChain(net);setModal(null);
   checker.current?.scrollIntoView({behavior:'smooth',block:'center'});
   if(net===1)await runScan(list[0]);
  }catch(e:any){setWalletError(e?.code===4001?'Connection cancelled in your wallet. You can try again whenever you’re ready.':e?.message?.includes('detected')||e?.message?.includes('project ID')?e.message:'We couldn’t connect to your wallet. Check your wallet, then try again.');}
  finally{setConnecting('');}
 }
 async function disconnect(){request.current?.abort();try{await provider?.disconnect?.();}catch{}setProvider(null);setConnected('');setChain(null);reset();}
 async function switchNetwork(){try{await provider?.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x1'}]});setChain(1);setError('');}catch{setError('The network switch wasn’t completed. Select Ethereum Mainnet in your wallet, or disconnect to check a public address.');}}
 async function simulate(){
  if(!position)return;request.current?.abort();const ctrl=new AbortController();request.current=ctrl;setState('simulating');setError('');
  try{const result=await checkPosition(position.wallet,true,ctrl.signal);if(!ctrl.signal.aborted){setPosition(result);setState('review');}}
  catch(e){if(!ctrl.signal.aborted){setPosition(p=>p?{...p,simulation:undefined}:p);setError(e instanceof Error?e.message:'The simulation could not be completed.');setState('review');}}
 }
 async function copyAddress(){try{await navigator.clipboard.writeText(position?.wallet||address);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{setError('Copy isn’t available in this browser. Select and copy the address manually.');}}
 function exportCheck(){if(!position)return;const blob=new Blob([JSON.stringify({product:'Mova Recovery',type:'read_only_research_report',recoveryCompleted:false,...position},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`mova-position-check-${position.blockNumber}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 const busy=state==='scanning'||state==='simulating';
 const wrongNetwork=!!connected&&chain!==1;
 const valid=isAddress(address.trim(),{strict:true})&&address.trim().toLowerCase()!==zeroAddress;
 return <>
  <a className="skip-link" href="#checker">Skip to address checker</a>
  <header className="header"><div className="container header-inner"><a className="brand" href="#" aria-label="Mova Recovery home"><Mark/><span>mova<span className="brand-period">.</span></span></a>
   <nav className="desktop-nav" aria-label="Main navigation"><a className="active" href="#recover">Recover</a><a href="#how-it-works">How it works</a><button onClick={()=>setModal('docs')}>Docs <ArrowUpRight size={13}/></button></nav>
   <div className="header-end"><span className="network-top"><span className="green-dot"/>Ethereum Mainnet</span><button className="button dark header-connect" onClick={connected?disconnect:openWallet}>{connected?<><span className="green-dot"/>{short(connected)}<Unplug size={15}/></>:<>Connect wallet<Wallet size={15}/></>}</button><button className="icon-button mobile-toggle" aria-label={mobile?'Close menu':'Open menu'} aria-expanded={mobile} onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button></div>
  </div>{mobile&&<nav className="mobile-nav" aria-label="Mobile navigation"><a onClick={()=>setMobile(false)} href="#recover">Recover</a><a onClick={()=>setMobile(false)} href="#how-it-works">How it works</a><button onClick={()=>{setModal('docs');setMobile(false);}}>Docs</button><button onClick={connected?disconnect:openWallet}>{connected?'Disconnect wallet':'Connect wallet'}</button></nav>}</header>
  <main id="recover">
   <section className="container hero">
    <div className="hero-copy"><div className="eyebrow"><span className="little-line"/> A WAY BACK TO WHAT’S YOURS</div><h1>Recover funds trapped in protocols you can <span>no longer access.</span></h1><p className="hero-description">The interface may be gone. Your position may not be.<br className="desktop-break"/> Find an existing withdrawal path, understand your options, and stay in control.</p>
    <div className="promise"><span><LockKeyhole size={15}/>Non-custodial</span><span><ShieldCheck size={16}/>No seed phrases. Ever.</span></div>
    <div className="hero-note"><span className="note-orbit"><ArrowUpRight size={17}/></span><p>We find. We verify. <strong>You control.</strong></p></div>
    </div>
    <div className="checker-wrap"><div className="checker-overline"><span className="tiny-square"/> MOVA RECOVERY <span className="test-label">RESEARCH PREVIEW</span></div>
    <section id="checker" className="checker" ref={checker} aria-label="Recovery position checker">
     <div className="checker-top"><span className="section-kicker">YOUR RECOVERY STARTS HERE</span><span className="network-pill"><Eth/>Ethereum</span></div>
     <div aria-live="polite" aria-busy={busy}>
     {state==='idle'&&<>
      <div className="scan-emblem"><ScanLine size={33} strokeWidth={1.35}/><span className="emblem-dot"/></div><h2>Let’s look for a way back.</h2><p className="card-description">Check your wallet for a position that may still have a withdrawal path.</p>
      <button className="button primary wide" onClick={connected?()=>runScan(connected):openWallet} disabled={wrongNetwork}>{connected?<>Scan connected wallet<ArrowRight size={17}/></>:<>Connect wallet<ArrowRight size={17}/></>}</button>
      <div className="divider"><span/>or check a public address<span/></div>
      <form onSubmit={e=>{e.preventDefault();if(valid&&!wrongNetwork)runScan(address.trim());}}><label className="input-label" htmlFor="wallet-address">Ethereum wallet address</label><div className={`address-input ${address&&!valid?'invalid':''}`}><Wallet size={17}/><input id="wallet-address" value={address} placeholder="0x…" spellCheck={false} autoComplete="off" aria-describedby="address-help" onChange={e=>{reset();setAddress(e.target.value);}} readOnly={!!connected} /><button type="submit" disabled={!valid||wrongNetwork} aria-label="Check public address"><ArrowRight size={20}/></button></div><p className="input-help" id="address-help">{address&&!valid?'Enter a valid 42-character Ethereum address.':'Read-only. No signature or gas fee required.'}</p></form>
     </>}
     {state==='scanning'&&<div className="scanning-state"><div className="radar"><div/><Search size={29}/></div><h2>Checking your wallet</h2><p className="card-description mono">{short(address)}</p><div className="scan-steps">{['Connecting to Ethereum Mainnet','Checking the supported EtherDelta contract','Reading your native ETH position'].map((s,i)=><div key={s} className={i<=scanStep?'step-current':''}>{i<scanStep?<Check size={15}/>:i===scanStep?<LoaderCircle className="spin" size={15}/>:<span className="step-dot"/>}{s}</div>)}</div><button className="text-button" onClick={reset}>Cancel check</button></div>}
     {position&&state!=='idle'&&state!=='scanning'&&<>
      {position.state==='no_position'?<><div className="scan-emblem neutral"><Search size={30} strokeWidth={1.4}/></div><h2>No supported ETH position found.</h2><p className="card-description">We didn’t find a native ETH balance for this address in the supported EtherDelta contract.</p><div className="info-panel"><Info size={17}/><p>This check covers one contract—not your full DeFi history. Other assets or protocols may still hold positions.</p></div><div className="mini-details"><span>Address checked</span><button onClick={copyAddress} className="copy-button">{short(position.wallet)}{copied?<Check size={13}/>:<Copy size={13}/>}</button><span>Checked at block</span><a target="_blank" rel="noreferrer" href={`https://etherscan.io/block/${position.blockNumber}`}>{Number(position.blockNumber).toLocaleString()} <ArrowUpRight size={12}/></a></div><button className="button dark wide" onClick={()=>runScan(position.wallet)}><RefreshCw size={15}/>Scan again</button><button className="text-button center" onClick={()=>{reset();if(!connected)setAddress('');}}>Check another address <ArrowRight size={14}/></button></>:
      <>
       <button className="back-button" onClick={()=>{if(state==='result')reset();else{request.current?.abort();setState('result');setError('');}}}><ArrowLeft size={14}/>{state==='result'?'Back to checker':'Back to position'}</button>
       <div className="result-label"><span className="green-dot"/>{state==='result'?'Position detected':'Review the withdrawal path'}</div><div className="asset-display"><div className="asset-icon"><Eth/></div><div><div className="asset-amount" title={position.amount+' ETH'}>{Number(position.amount).toLocaleString(undefined,{maximumSignificantDigits:8})}<span>ETH</span></div><p>Native Ether · USD estimate unavailable</p></div></div>
       <dl className="review-details"><div><dt>From</dt><dd>EtherDelta <a aria-label="View EtherDelta contract on Etherscan" href={`https://etherscan.io/address/${contract}#code`} target="_blank" rel="noreferrer"><ArrowUpRight size={14}/></a><small>{short(contract)}</small></dd></div><div><dt>To</dt><dd>{connected.toLowerCase()===position.wallet.toLowerCase()?'Your connected wallet':'Position owner'}<small>{short(position.wallet)}</small></dd></div><div><dt>Network</dt><dd>Ethereum Mainnet</dd></div>{state!=='result'&&<div><dt>Action</dt><dd>Withdraw native ETH<small>Full balance: {position.amount} ETH</small></dd></div>}</dl>
       <p className="owner-note"><LockKeyhole size={13}/>This withdrawal path pays the wallet that owns the position.</p>
       {state==='result'?<><div className="info-panel"><Info size={17}/><p>A balance is not a verified recovery. Review the withdrawal path and run a read-only simulation next.</p></div><button className="button primary wide" onClick={()=>{setState('review');setError('');}}>Review position<ArrowRight size={17}/></button></>:
       <><div className={`simulation-panel ${position.simulation==='passed'?'passed':''}`}>
       {state==='simulating'?<LoaderCircle className="spin" size={19}/>:position.simulation==='passed'?<Check size={19}/>:<ShieldCheck size={19}/>}<div><strong>{state==='simulating'?'Simulating the withdrawal…':position.simulation==='passed'?'Read-only simulation passed':'Check the withdrawal, without moving funds'}</strong><p>{position.simulation==='passed'?`eth_call succeeded at block ${Number(position.blockNumber).toLocaleString()}. No transaction was sent.`:'The checker uses the position owner, actual balance, and owner-only withdrawal method.'}</p></div></div>
       {!position.simulation&&<button className="button primary wide" disabled={state==='simulating'} onClick={simulate}>{state==='simulating'?<>Checking contract state<LoaderCircle className="spin" size={16}/></>:<>Run read-only simulation<ArrowRight size={16}/></>}</button>}
       {position.simulation==='passed'&&<><button className="button dark wide" disabled><LockKeyhole size={16}/>Mainnet recovery is not enabled</button><p className="release-note">Simulation is not a security audit or proof of wallet control. Protocol review and a controlled real recovery are still required.</p><button className="text-button center" onClick={exportCheck}><Download size={14}/>Download check report</button></>}
       </>}
      </>}
     </>}
     </div>
     {wrongNetwork&&<div className="error-panel" role="alert"><Info size={17}/><div><strong>Ethereum Mainnet required</strong><p>Your connected wallet is on another network.</p><button className="text-button" onClick={switchNetwork}>Switch to Ethereum <ArrowRight size={14}/></button></div></div>}
     {error&&<div className="error-panel" role="alert"><Info size={17}/><p>{error}</p></div>}
     <div className="checker-footer"><LockKeyhole size={13}/><span>Your keys stay yours. Your funds stay put.</span></div>
    </section>
    <div className="checker-under"><span className="green-dot"/><span>Read-only on Mainnet</span><span className="under-dot">·</span><button onClick={()=>setModal('coverage')}>What’s supported <ArrowUpRight size={12}/></button></div>
    </div>
   </section>
   <section className="container preview-note"><div className="preview-symbol"><Info size={18}/></div><div><strong>A careful first step.</strong><span> This preview checks EtherDelta ETH positions. It does not move funds, and recovery is not yet proven.</span></div><button onClick={()=>setModal('coverage')}>View coverage <ArrowUpRight size={16}/></button></section>
   <section id="how-it-works" className="container how-section"><div className="section-heading"><div><div className="eyebrow">SOPHISTICATED UNDERNEATH. SIMPLE ON TOP.</div><h2>A clear path. At every step.</h2></div><p>No shortcuts around permissions.<br/>Just a new way to use the ones you already have.</p></div>
    <div className="steps-grid">
     <article className="how-card"><div className="how-card-top"><Search strokeWidth={1.3} size={27}/><span>01 / FIND</span></div><h3>Start with what’s there.</h3><p>Check the underlying contract for a position tied to your wallet—even when the original interface is gone.</p><div className="how-tag"><span className="tiny-dot"/>On-chain position checks</div></article>
     <article className="how-card"><div className="how-card-top"><ShieldCheck strokeWidth={1.3} size={29}/><span>02 / VERIFY</span></div><h3>Understand the way out.</h3><p>Inspect the withdrawal path and simulate the call. See what can be checked, and what still needs verification.</p><div className="how-tag"><span className="tiny-dot"/>Read-only simulation</div></article>
     <article className="how-card"><div className="how-card-top"><Wallet strokeWidth={1.3} size={27}/><span>03 / RECOVER</span></div><h3>You make the final move.</h3><p>When a recovery path is fully verified, you’ll review and sign with your own wallet. Never with Mova.</p><div className="how-tag muted"><LockKeyhole size={12}/>Not enabled in this preview</div></article>
    </div>
   </section>
   <section className="container questions-section"><div><div className="eyebrow">BEFORE YOU CONNECT</div><h2>A little clarity<br/>goes a long way.</h2><button className="text-button" onClick={()=>setModal('docs')}>Read the documentation<ArrowUpRight size={16}/></button></div><div className="faq-list">{faqs.map(([q,a],i)=><div className="faq" key={q}><button aria-expanded={faq===i} aria-controls={`faq-${i}`} onClick={()=>setFaq(faq===i?null:i)}>{q}{faq===i?<Minus size={17}/>:<Plus size={17}/>}</button>{faq===i&&<p id={`faq-${i}`}>{a}</p>}</div>)}</div></section>
   <section className="container closing"><Mark/><p>Recover what you can <em>still control.</em></p><a href="#checker">Start with a check<ArrowUpRight size={18}/></a></section>
  </main>
  <footer className="container footer"><a className="brand" href="#"><Mark small/><span>mova.</span></a><span>© {new Date().getFullYear()} Mova. Your keys. Your control.</span><div><button onClick={()=>setModal('docs')}>Documentation</button><button onClick={()=>setModal('coverage')}>Preview scope</button><span className="footer-eth"><span className="green-dot"/>Ethereum only</span></div></footer>
  {modal==='wallet'&&<Modal title="Connect your wallet" onClose={closeModal}><p className="modal-intro">Your wallet shares its public address. Mova will never ask for a seed phrase or signing credentials.</p><div className="wallet-list">{(['metamask','walletconnect','phantom'] as const).map((kind,i)=><button key={kind} disabled={!!connecting} onClick={()=>connect(kind)}><span className={`wallet-brand wallet-${kind}`}>{i===0?'M':i===1?<span>≈</span>:'P'}</span><span><strong>{i===0?'MetaMask':i===1?'WalletConnect':'Phantom'}</strong><small>{i===0?'Browser & mobile wallet':i===1?wcReady?'Connect a mobile wallet':'Requires operator configuration':'Ethereum accounts'}</small></span>{connecting===kind?<LoaderCircle size={20} className="spin"/>:<ArrowUpRight size={18}/>}</button>)}</div>{walletError&&<div className="error-panel" role="alert"><Info size={17}/><p>{walletError}</p></div>}<div className="modal-foot"><LockKeyhole size={14}/>Connecting does not authorize a transaction.</div><button className="text-button center" onClick={()=>{setModal(null);document.getElementById('wallet-address')?.focus();}}>Use a public address instead<ArrowRight size={15}/></button></Modal>}
  {modal==='coverage'&&<Modal title="Small scope. Clear boundaries." onClose={closeModal}><p className="modal-intro">One candidate protocol. One asset. Read-only research before real-money recovery.</p><div className="coverage-card"><div className="coverage-heading"><div className="protocol-monogram">EΔ</div><div><h3>EtherDelta</h3><span>Ethereum Mainnet · Native ETH</span></div><span className="pill">Research</span></div><p className="code-address">{contract}</p><a className="text-button" href={`https://etherscan.io/address/${contract}#code`} target="_blank" rel="noreferrer">View contract on Etherscan<ExternalLink size={13}/></a></div><ul className="check-list"><li><Check size={16}/>Live native ETH balance checks</li><li><Check size={16}/>Read-only withdrawal simulation</li><li><LockKeyhole size={16}/>Mainnet signing is disabled</li><li><Minus size={16}/>No ERC-20, other contracts, or other chains</li></ul><div className="info-panel"><Info size={18}/><p>A missing position is not a full-wallet assessment. A positive balance is not proof that you can safely recover it.</p></div><p className="fine-print">{publicRpc?'This preview uses a public RPC endpoint for research. Availability is not guaranteed.':'This checker uses an operator-configured RPC endpoint.'} Your address is sent to this app’s backend and its Ethereum RPC provider to perform the check.</p></Modal>}
  {modal==='docs'&&<Modal title="Recovery, without the guesswork." onClose={closeModal}><div className="docs"><span className="doc-label">MOVA RECOVERY / RESEARCH PREVIEW</span><h3>What this tool does</h3><p>It reads native ETH balances in the allowlisted EtherDelta contract on Ethereum Mainnet. If a balance exists, it can simulate withdrawing that balance to the position owner with eth_call. It never broadcasts or signs transactions.</p><h3>How to test without trapped funds</h3><ol><li>Check a public Ethereum address. A connected wallet is optional.</li><li>Use the separate local-fork test harness to exercise real contract state without moving Mainnet funds.</li><li>Recruit a consenting position owner for a small Mainnet recovery only after source review and successful simulation.</li></ol><h3>What a simulation means</h3><p>A call succeeded at the displayed block. It does not establish that you control the address, prove that the protocol is secure, or guarantee future execution. It cannot produce a recovery receipt.</p><h3>What remains before launch</h3><p>Complete deployed-source and authorization review, controlled local-fork tests, and the wallet review/sign/confirmation path. A consenting owner must then complete a deliberately small, verified Mainnet recovery before public enablement.</p><h3>Your privacy</h3><p>Never enter a seed phrase or private key. Public addresses are passed to our backend and RPC provider for reads; this app does not write checks to a database or store addresses in browser storage. Infrastructure providers may retain request logs. A downloaded JSON report contains the checked address and balance; keep it private if you prefer.</p><h3>No custody. No shortcuts.</h3><p>The protocol determines what is withdrawable. The blockchain determines the state. Your wallet must authorize any real withdrawal. Mova cannot recover a wallet you no longer control.</p><a className="text-button" href={`https://etherscan.io/address/${contract}#code`} target="_blank" rel="noreferrer">Inspect the candidate contract<ArrowUpRight size={15}/></a></div></Modal>}
 </>;
}
