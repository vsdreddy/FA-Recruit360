import {useEffect,useRef,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {ArrowLeft,ArrowRight,ChevronDown,GitCompareArrows,ShieldCheck,Search,SlidersHorizontal,Sparkles,CheckCircle2,FileText,RotateCcw,ClipboardCheck,X} from 'lucide-react';
import type {Candidate} from './data';
import {StageDrawer} from './WorkflowUI';
import {stageStatus,versionFor,journey} from './workflow';
import MappingWorkspace from './MappingWorkspace';
import './account-mappings.css';

export function PreRegistrationMenu({id}:{id:string}){
 const ref=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{const outside=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node))ref.current?.removeAttribute('open')};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){ref.current?.removeAttribute('open');ref.current?.querySelector('summary')?.focus()}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)}},[]);
 return <details ref={ref} className="pr-menu"><summary aria-label="Pre-Registration options"><ChevronDown size={14}/></summary><div className="pr-options"><Link to={`/candidates/${id}/accounts`}><GitCompareArrows size={16}/>Account mappings</Link><Link to={`/candidates/${id}/background`}><ShieldCheck size={16}/>Background verification</Link></div></details>
}
function Trail({c,label}:{c:Candidate;label:string}){return <div className="breadcrumb"><Link to={'/candidates/'+c.id}><ArrowLeft size={14}/>{c.name}</Link><span>Pre-Registration</span><span>{label}</span></div>}
export default function AccountMappings({candidates}:{candidates:Candidate[]}){const {id}=useParams();const c=candidates.find(x=>x.id===id);return c?<MappingWorkspace key={c.id} c={c} trail={<Trail c={c} label="Account mappings"/>}/>:<p>Candidate not found. <Link to="/candidates">Back to candidates</Link></p>}
export function BackgroundVerification({candidates}:{candidates:Candidate[]}){const {id}=useParams();const c=candidates.find(x=>x.id===id);const [drawer,setDrawer]=useState(false);if(!c)return <p>Candidate not found.</p>;const rule=versionFor(c).stages.find(s=>s.id==='Background');return <div className="mapping-page"><Trail c={c} label="Background verification"/><div className="mapping-heading"><div><h1><ShieldCheck size={24}/>Background verification</h1><p>{c.name} · {stageStatus(c,'Background')} · Mock workflow</p></div><button className="primary" onClick={()=>setDrawer(true)}><ClipboardCheck size={16}/>Review background checklist</button></div><section className="section mapping-detail"><h3>Verification requirements</h3>{rule?.requirements.map(r=><div className="detail-row" key={r.id}><FileText size={16}/><b>{r.label}</b><span>{journey(c).evidence[r.id]?.done?'Completed':'Required'}</span></div>)}<p className="mapping-footnote">Uses the candidate’s existing Background stage evidence. External screening and clearance are simulated.</p></section>{drawer&&<StageDrawer candidate={c} stage="Background" close={()=>setDrawer(false)}/>}</div>}
