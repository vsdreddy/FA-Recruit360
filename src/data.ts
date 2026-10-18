export type Candidate={id:string;name:string;firm:string;division:string;manager:string;stage:string;progress:number;start:string;days:number;status:string;action:string;offerAccepted?:boolean;cycleDays?:number;readiness?:string;stageDays?:number[]};
const referenceCandidates:Candidate[]=[
{id:'001234',name:'Michael A. Thompson',firm:'Merrill Lynch',division:'WBS',manager:'Sarah Williams',stage:'Pre-Registration',progress:68,start:'2025-01-15',days:8,status:'At Risk',action:'Complete Pre-Registration Package'},
{id:'001235',name:'Sarah Mitchell',firm:'Morgan Stanley',division:'WBS',manager:'Michael Torres',stage:'Contracting',progress:60,start:'2024-12-02',days:5,status:'On Track',action:'Review contract'},
{id:'001236',name:'David Chen',firm:'UBS',division:'PCG',manager:'Amy Richards',stage:'Background',progress:45,start:'2025-01-06',days:12,status:'At Risk',action:'Follow up on fingerprint'},
{id:'001237',name:'Jennifer Walsh',firm:'Merrill Lynch',division:'WBS',manager:'Robert Klein',stage:'Pre-Registration',progress:40,start:'2024-12-16',days:8,status:'On Track',action:'Complete U4 package'},
{id:'001238',name:'Michael Rivera',firm:'Raymond James',division:'PCG',manager:'Lisa Greene',stage:'Deal Review',progress:25,start:'2025-01-13',days:15,status:'At Risk',action:'Deal team review'},
{id:'001239',name:'Amanda Lewis',firm:'Edward Jones',division:'WBS',manager:'Kevin Patel',stage:'Equipment & Access',progress:80,start:'2024-12-09',days:6,status:'On Track',action:'Confirm equipment delivery'}];
export const stages=['Discovery','Deal Review','Approval','Contract','Pre-Registration','Background','U-4 / FINRA','Hire Processing','Equipment','Access','Ready to Start'];
const riskDistribution=[['CRD escalation',5],['Background escalation',3],['Contract pending signature',4],['Missing required documents',6],['Start date inconsistency',4],['Equipment not scheduled',3],['Access provisioning failure',2],['Approval approaching SLA',7]] as const;
export const documents=[['Candidate One Pager','Completed','Oct 1, 2024','pdf'],['Deal Model Summary','Completed','Oct 10, 2024','xls'],['Contract - Draft','Sent for Signature','Oct 15, 2024','doc'],['Pre-Reg Disclosure Form','Not Started','—','pdf'],['Background Check Authorization','Not Started','—','pdf']];
export const dependencies=[['CRD review pending additional information','Oct 25, 2024'],['Background check not yet initiated','Oct 28, 2024'],['Equipment request not yet submitted','Dec 15, 2024'],['Access provisioning dependent on ELID','Jan 5, 2025']];

// Deterministic reporting snapshot. All dashboard aggregates are derived from these records.
export const reportingDate='2024-11-15';
export const pipelineStages=['Discovery','Deal Review','Approved','Contracting','Pre-Registration','Background','Hire Processing','Equipment & Access','Ready to Start'];
const populations=[24,22,15,13,14,12,14,10,18];
const remaining=populations.map((n,i)=>n-referenceCandidates.filter(c=>c.stage===pipelineStages[i]).length);
const generatedStages=remaining.flatMap((n,i)=>Array(n).fill(pipelineStages[i]));
const firstNames=['Olivia','Ethan','Ava','Noah','Sophia','Liam','Isabella','Mason','Mia','Lucas','Charlotte','Logan','Amelia','James','Harper','Benjamin','Evelyn'];
const lastNames=['Adams','Brooks','Carter','Diaz','Evans','Foster','Garcia','Hayes'];
export const initialCandidates:Candidate[]=[...referenceCandidates,...generatedStages.map((stage,i)=>({id:String(1240+i).padStart(6,'0'),name:firstNames[i%17]+' '+lastNames[Math.floor(i/17)],firm:['UBS','Morgan Stanley','Merrill Lynch','Edward Jones'][i%4],division:['WBS','PCG','Other'][i%3],manager:['Sarah Williams','Michael Torres','Amy Richards'][i%3],stage,progress:Math.min(95,10+pipelineStages.indexOf(stage)*10),start:i<16?'2024-12-05':i<21?'2025-01-05':i<28?'2025-02-05':'2025-04-15',days:5+i%10,status:i<15?'At Risk':i<120?'On Track':'Attention Needed',action:'Review onboarding for '+firstNames[i%17]+' '+lastNames[Math.floor(i/17)]}))].map((c,i)=>({...c,offerAccepted:[0,1,3,5].includes(i)||(i>=6&&i<30),cycleDays:i<6?[70,60,68,55,71,60][i]:i%2?68:60,stageDays:[6,8,10,9,14,8,12,6].map(n=>n+(i%2?1:-1))}));
initialCandidates.filter(c=>c.offerAccepted).forEach((c,i)=>c.readiness=i<12?'Ready':i<20?'Attention Needed':i<25?'Blocked':'Not Started');
export function restoreCandidates(saved:Candidate[]|null):Candidate[]{
 if(!Array.isArray(saved))return initialCandidates;
 const overrides=new Map(saved.map(c=>[c.id,c]));
 return [...initialCandidates.map(c=>({...c,...overrides.get(c.id)})),...saved.filter(c=>!initialCandidates.some(seed=>seed.id===c.id))];
}

export const riskRecords=riskDistribution.flatMap(([category,count],i)=>Array.from({length:count},(_,j)=>({id:'risk-'+i+'-'+j,category,candidateId:initialCandidates[(i*5+j)%initialCandidates.length].id})));
export const risks=riskDistribution.map(([category])=>[category,riskRecords.filter(r=>r.category===category).length] as const);
// Explicit historical mock snapshots for the comparison selector (not multipliers).
export const historicalMetrics:Record<string,number[]>={
 'Last 30 Days':[127,26,12,72,15,9,12,78],
 'Last 60 Days':[118,24,10,70,14,8,10,80],
 'Last 90 Days':[105,22,9,68,12,7,9,84]
};
