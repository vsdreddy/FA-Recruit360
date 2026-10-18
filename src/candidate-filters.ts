import {type Candidate} from './data';
import {workItems,isOverdue,statusOf} from './work-data';

export const tileFilters = [
  {key:'active',label:'Active Recruits',description:'Candidates with an active recruiting record.'},
  {key:'expected',label:'Expected Hires',description:'Candidates with an accepted offer and a projected start date.'},
  {key:'starting-soon',label:'Starting in Next 30 Days',description:'Projected start from Nov 16 through Dec 15, 2024, relative to the dashboard reporting date.'},
  {key:'on-track',label:'On Track',description:'Candidates whose current status is On Track.'},
  {key:'at-risk',label:'At Risk',description:'Candidates whose current status is At Risk.'},
  {key:'overdue',label:'Overdue Tasks',description:'Candidates with an incomplete task due before Nov 15, 2024.'},
  {key:'approval',label:'Awaiting Approval',description:'Candidates with a pending approval request.'},
  {key:'cycle-time',label:'Average Cycle Time',description:'Candidates included in the cycle-time calculation. Cycle days are shown in the table.'},
] as const;

export const cycleDays=(candidate:Candidate)=>candidate.cycleDays;
export function matchesTile(candidate:Candidate,key:string|null){
 switch(key){
 case 'active':return candidate.progress<100;
 case 'expected':return Boolean(candidate.offerAccepted)&&candidate.progress<100;
 case 'starting-soon':return candidate.progress<100&&candidate.start>'2024-11-15'&&candidate.start<='2024-12-15';
 case 'on-track':return candidate.status==='On Track';
 case 'at-risk':return candidate.status==='At Risk';
 case 'overdue':return workItems([candidate]).some(isOverdue);
 case 'approval':return workItems([candidate]).some(t=>t.type==='Approval'&&statusOf(t)==='Awaiting Approval');
 case 'cycle-time':return candidate.cycleDays!==undefined;
 default:return true;
 }
}
