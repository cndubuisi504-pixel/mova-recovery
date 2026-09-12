import {useEffect,useRef, type ReactNode} from 'react';
import {X} from 'lucide-react';
export default function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  const old=document.body.style.overflow;document.body.style.overflow='hidden';
  ref.current?.focus();
  function key(e:KeyboardEvent){
   if(e.key==='Escape'){onClose();return;}
   if(e.key==='Tab'){
    const nodes=ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]');
    if(!nodes?.length){e.preventDefault();return;}
    const first=nodes[0],last=nodes[nodes.length-1];
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){e.preventDefault();first.focus();}
   }
  }
  document.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',key);previous?.focus();};
 },[onClose]);
 return <div className="modal-scrim" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal" ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}><div className="modal-head"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={21}/></button></div>{children}</div></div>;
}
