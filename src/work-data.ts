import {journey,versionFor} from './workflow';
import {initialCandidates,reportingDate,type Candidate} from './data';
export const statuses=['Not Started','In Progress','Awaiting Approval','Completed'] as const;
export type Status=typeof statuses[number];
export type Saved={status?:Status;notes?:string};
export type Task={workflowStage?:string;requirementId?:string;id:string;candidate:Candidate;title:string;type:'Task'|'Approval';owner:string;group:string;due:string;priority:string;initial:Status};
export const storageKey='recruit360-work-items';
export function readSaved():Record<string,Saved>{try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}}}
export const ownerGroups=['Recruiters','Hiring Managers','Deals Team','Registration','Background / Compliance','Operations'];
const owners=['Jennifer Davis','Sarah Williams','Robert Chen','Angela Turner','Pat Morgan','Mark Kim'];
const groupAssignments=[24,18,12,10,8,6].flatMap((n,i)=>Array(n).fill(i));
const approvalIds=['001234','001238',...initialCandidates.slice(16,29).map(c=>c.id)];
const workIds=[...initialCandidates.slice(0,63).map(c=>'task-'+c.id),...approvalIds.map(id=>'approval-'+id)];
export function workItems(candidates:Candidate[]):Task[]{
 const tasks:Task[]=candidates.filter(c=>initialCandidates.slice(0,63).some(seed=>seed.id===c.id)||!initialCandidates.some(seed=>seed.id===c.id)).map((candidate)=>{const i=initialCandidates.findIndex(c=>c.id===candidate.id);return ({id:'task-'+candidate.id,candidate,title:candidate.action,type:'Task',owner:'',group:'',due:i===0?'2024-10-22':i===2||i>=6&&i<16?'2024-11-12':'2024-11-25',priority:candidate.status==='At Risk'?'High':'Normal',initial:i>=0&&i<3?'In Progress':'Not Started'})});
 for(const id of approvalIds){const candidate=candidates.find(c=>c.id===id);if(candidate)tasks.push({id:'approval-'+id,candidate,title:id==='001234'?'Approve pre-registration package':id==='001238'?'Approve advisor deal':'Approve offer for '+candidate.name,type:'Approval',owner:'',group:'',due:'2024-11-18',priority:'High',initial:'Awaiting Approval'})}
 const legacy=tasks.filter(t=>!journey(t.candidate).activated).map(task=>({...task,owner:owners[groupAssignments[workIds.indexOf(task.id)]??0],group:ownerGroups[groupAssignments[workIds.indexOf(task.id)]??0]}));
 const workflow:Task[]=candidates.filter(c=>journey(c).activated).flatMap(candidate=>versionFor(candidate).stages.filter(s=>s.enabled).flatMap(s=>s.requirements.filter(r=>r.kind!=='Document').map(r=>{const due=new Date(candidate.start+'T12:00:00');due.setDate(due.getDate()-s.daysBeforeStart);return {id:'wf-'+candidate.id+'-'+r.id,candidate,title:r.label,type:r.kind as 'Task'|'Approval',owner:s.owner,group:s.owner==='Operations'?'Operations':s.owner==='Registration'?'Registration':s.owner==='Compliance'?'Background / Compliance':s.owner==='Deals Team'?'Deals Team':s.owner==='Hiring Manager'?'Hiring Managers':'Recruiters',due:due.toISOString().slice(0,10),priority:r.required?'High':'Normal',initial:(r.kind==='Approval'&&journey(candidate).primary===s.id?'Awaiting Approval':'Not Started') as Status,workflowStage:s.id,requirementId:r.id}})));
 return [...legacy,...workflow];
}
export function statusOf(task:Task,saved=readSaved()):Status{
 if(task.requirementId)return journey(task.candidate).evidence[task.requirementId]?.done?'Completed':saved[task.id]?.status==='Completed'?'Not Started':saved[task.id]?.status||task.initial;
 try{if(task.type==='Task'&&localStorage.getItem('recruit360-task-'+task.candidate.id)==='done')return 'Completed'}catch{}
 return saved[task.id]?.status||task.initial;
}
export const isOverdue=(task:Task)=>task.due<reportingDate&&statusOf(task)!=='Completed';
