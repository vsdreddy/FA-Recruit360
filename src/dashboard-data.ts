import {canonical} from './workflow';
import {pipelineStages,type Candidate} from './data';
import {workItems,statusOf,isOverdue,ownerGroups} from './work-data';
export function dashboardData(candidates:Candidate[]){
 const active=candidates.filter(c=>c.progress<100),expected=active.filter(c=>c.offerAccepted),tasks=workItems(candidates);
 const cycle=candidates.filter(c=>c.cycleDays!==undefined);
 const starts=(end:string)=>active.filter(c=>c.start>'2024-11-15'&&c.start<=end).length;
 const readiness=['Ready','Attention Needed','Blocked','Not Started'].map(label=>({label,count:expected.filter(c=>c.readiness===label).length}));
 const monthly=['2024-11','2024-12','2025-01','2025-02','2025-03'].map(month=>['WBS','PCG','Other'].map(division=>active.filter(c=>c.start.startsWith(month)&&c.start>'2024-11-15'&&c.division===division).length));
 return {values:[active.length,expected.length,starts('2024-12-15'),Math.round(candidates.filter(c=>c.status==='On Track').length/Math.max(1,candidates.length)*100)+'%',candidates.filter(c=>c.status==='At Risk').length,tasks.filter(isOverdue).length,tasks.filter(t=>statusOf(t)==='Awaiting Approval').length,Math.round(cycle.reduce((n,c)=>n+c.cycleDays!,0)/Math.max(1,cycle.length))],
 pipeline:pipelineStages.map((_,i)=>active.filter(c=>pipelineStages.map(canonical).indexOf(c.stage==='Access'?'Equipment':c.stage==='U-4 / FINRA'?'Background':canonical(c.stage))>=i).length),
 stageDays:Array.from({length:8},(_,i)=>{const measured=candidates.filter(c=>c.stageDays);return Math.round(measured.reduce((n,c)=>n+c.stageDays![i],0)/Math.max(1,measured.length))}),
 starts:[starts('2024-12-15'),starts('2025-01-14'),starts('2025-02-13')],monthly,readiness,
 owners:ownerGroups.map(group=>tasks.filter(t=>t.group===group&&statusOf(t)!=='Completed').length)};
}
