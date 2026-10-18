import UiIcon from './UiIcon';
import {stages,type Candidate} from './data';
// Count each record once. Legacy combined Equipment & Access records belong to
// Equipment until the record explicitly advances to Access.
export function matchesProcessStep(candidate:Candidate,step:string){
 const aliases:Record<string,string[]>={'Approval':['Approval','Approved'],'Contract':['Contract','Contracting'],'Equipment':['Equipment','Equipment & Access'],'Access':['Access']};
 return (aliases[step]||[step]).includes(candidate.stage);
}
export default function CandidateSteps({candidates,selected,onSelect}:{candidates:Candidate[];selected:string;onSelect:(step:string)=>void}){
 return <div className="candidate-process-chips" role="group" aria-label="Filter candidates by process step">{stages.map(step=><button key={step} className={step===selected?'selected':''} aria-label={step} aria-pressed={step===selected} onClick={()=>onSelect(step===selected?'':step)}><UiIcon label={step}/><span>{step}</span><strong>{candidates.filter(c=>matchesProcessStep(c,step)).length}</strong></button>)}</div>;
}
