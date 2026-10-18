import {test,expect} from '@playwright/test';
test('all metric tiles navigate to the matching candidate cohort and preserve filters on reload',async({page})=>{
 const cohorts=[['Active Recruits','active',142],['Expected Hires','expected',28],['Starting in Next 30 Days','starting-soon',18],['On Track','on-track',108],['At Risk','at-risk',18],['Overdue Tasks','overdue',12],['Awaiting Approval','approval',15],['Average Cycle Time','cycle-time',142]] as const;
 for(const [label,key,count] of cohorts){
  await page.goto('/');await page.getByRole('button',{name:label,exact:true}).click();
  await expect(page).toHaveURL(new RegExp('/candidates\\?tile='+key+'$'));
  await expect(page.locator('.tile-filter b')).toHaveText(label);
  await expect(page.locator('.hires tbody tr')).toHaveCount(count);
  await page.reload();await expect(page.locator('.hires tbody tr')).toHaveCount(count);
 }
 await expect(page.getByRole('columnheader',{name:'Cycle Days',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Clear tile filter'}).click();await expect(page.locator('.tile-filter')).toHaveCount(0);
 await page.goto('/candidates?tile=at-risk');await page.getByLabel('Search candidate table').fill('David');await expect(page.locator('.hires tbody tr')).toHaveCount(1);
 await page.getByRole('link',{name:'David Chen',exact:true}).click();await page.goBack();await expect(page.locator('.tile-filter b')).toHaveText('At Risk');
});
test('dashboard matches content, filters hires and navigates to profile',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'Welcome back, Jennifer'})).toBeVisible();
 await expect(page.locator('.metric')).toHaveCount(8);
 await page.screenshot({path:'artifacts/dashboard.png',fullPage:true});
 await page.getByRole('button',{name:'Filters',exact:true}).click();await page.getByLabel('Filter status').selectOption('At Risk');
 await expect(page.locator('.hires tbody tr')).toHaveCount(2);
 await page.getByLabel('Search candidate table').fill('David');await expect(page.locator('.hires tbody tr')).toHaveCount(1);
 await page.getByRole('link',{name:'David Chen',exact:true}).click();await expect(page.getByRole('heading',{name:'David Chen',exact:true})).toBeVisible();
 expect(errors).toEqual([]);
});
test('candidate tabs, document review, edit persistence, and task completion',async({page})=>{
 await page.goto('/candidates/001234');await page.screenshot({path:'artifacts/candidate.png',fullPage:true});
 for(const name of ['Candidate & Deal','Compliance','Contract & Payment','Onboarding','Documents','Activity & Audit','Overview']){await page.getByRole('tab',{name,exact:true}).click();await expect(page.getByRole('tab',{name,exact:true})).toHaveAttribute('aria-selected','true')}
 await page.getByRole('button',{name:'Edit',exact:true}).click();await page.locator('input[name="name"]').fill('Michael A. Thompson Jr.');await page.getByRole('button',{name:'Save Changes'}).click();await page.reload();await expect(page.getByRole('heading',{name:'Michael A. Thompson Jr.',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'View Task',exact:true}).click();await expect(page.getByRole('dialog',{name:'Pre-Registration workflow'})).toBeVisible();await expect(page.getByRole('button',{name:'Complete Stage & Continue'})).toBeDisabled();await page.getByLabel('Evidence note').fill('Verified CRD mock record');await page.getByRole('button',{name:'Complete mock task'}).first().click();await page.getByLabel('Close stage').click();await expect(page.getByRole('button',{name:'Pre-Registration: In Progress',exact:true})).toBeVisible();
});
test('create candidate and find through global search',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'New Candidate',exact:true}).click();await page.locator('input[name="name"]').fill('Alex Parker');await page.locator('input[name="firm"]').fill('Example Financial');await page.locator('input[name="manager"]').fill('Sarah Williams');await page.locator('input[name="start"]').fill('2025-02-10');await page.getByRole('button',{name:'Create Candidate'}).click();
 await page.getByLabel('Search candidates',{exact:true}).fill('Alex Parker');await page.locator('.search-results button').click();await expect(page.getByRole('heading',{name:'Alex Parker',exact:true})).toBeVisible();
});
test('mobile pages fit viewport and dialogs remain usable',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.getByRole('heading',{name:'Welcome back, Jennifer'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.screenshot({path:'artifacts/dashboard-mobile.png',fullPage:true});await page.goto('/candidates/001234');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.screenshot({path:'artifacts/candidate-mobile.png',fullPage:true});
});

test('candidate KPI filters change cohorts and handle trailing slash links',async({page})=>{
 await page.goto('/candidates/?tile=at-risk');await page.getByRole('button',{name:'Filters',exact:true}).click();
 await expect(page.locator('.hires tbody tr')).toHaveCount(18);
 await expect(page.locator('.candidate-kpis button[aria-pressed="true"]')).toHaveAccessibleName('At Risk');
 await expect(page.locator('.candidate-kpis strong').nth(0)).toHaveText('18');await expect(page.locator('.candidate-kpis strong').nth(4)).toHaveText('18');
 await page.getByLabel('Search candidate table').fill('David');await expect(page.locator('.hires tbody tr')).toHaveCount(1);
 await page.locator('.candidate-kpis').getByRole('button',{name:'Expected Hires',exact:true}).click();await expect(page.locator('.hires tbody tr')).toHaveCount(28);await expect(page.getByLabel('Search candidate table')).toHaveValue('');
 await page.reload();await expect(page.locator('.hires tbody tr')).toHaveCount(28);
 await page.getByRole('button',{name:'Filters',exact:true}).click();await page.locator('.candidate-kpis').getByRole('button',{name:'On Track',exact:true}).click();await expect(page.locator('.hires tbody tr')).toHaveCount(108);
 await page.goBack();await expect(page.locator('.hires tbody tr')).toHaveCount(28);
 await page.screenshot({path:'artifacts/candidates-kpi-strip.png',fullPage:true});
});

test('grid status bar follows filtering and selection',async({page})=>{
 await page.goto('/candidates?tile=at-risk');const footer=page.getByRole('status',{name:'Candidate grid status'});
 await expect(footer).toContainText('18 of 142 candidates');await expect(footer).toContainText('0 selected');
 await page.getByLabel('Select David Chen',{exact:true}).check();await expect(footer).toContainText('1 selected');
 await page.getByLabel('Search candidate table').fill('David');await expect(footer).toContainText('1 of 142 candidates');await expect(footer).toContainText('Search: David');
 await page.getByLabel('Search candidate table').fill('no such candidate');await expect(footer).toContainText('0 of 142 candidates');await expect(footer).toContainText('0 selected');
});

test('process steps filter the candidate grid and preserve selection on reload',async({page})=>{
 await page.goto('/candidates');
 await expect(page.locator('.candidate-kpis')).toHaveCount(0);
 const steps=page.getByRole('group',{name:'Filter candidates by process step'});
 await expect(steps.getByRole('button')).toHaveCount(11);
 await steps.getByRole('button',{name:'Contract',exact:true}).click();
 await expect(page.locator('.hires tbody tr')).toHaveCount(13);
 await expect(page.locator('.hires tbody tr .stage-tag')).toHaveText(Array(13).fill('Contracting'));
 await page.reload();await expect(steps.getByRole('button',{name:'Contract',exact:true})).toHaveAttribute('aria-pressed','true');
 await steps.getByRole('button',{name:'Contract',exact:true}).click();await expect(page.locator('.hires tbody tr')).toHaveCount(142);
 await steps.getByRole('button',{name:'Pre-Registration',exact:true}).click();await expect(page.locator('.hires tbody tr')).toHaveCount(14);
 await page.screenshot({path:'artifacts/candidate-process-steps.png',fullPage:false});
});

test('candidate chips reflect searched and stage-filtered grid rows',async({page})=>{
 await page.goto('/candidates');
 const steps=page.getByRole('group',{name:'Filter candidates by process step'});
 await page.getByLabel('Search candidate table').fill('Sarah Mitchell');
 await expect(page.locator('.hires tbody tr')).toHaveCount(1);
 await expect(steps.getByRole('button',{name:'Contract',exact:true}).locator('strong')).toHaveText('1');
 await expect(steps.getByRole('button',{name:'Discovery',exact:true}).locator('strong')).toHaveText('0');
 await page.getByRole('button',{name:'Filters',exact:true}).click();
 await expect(page.locator('.candidate-kpis strong').nth(0)).toHaveText('1');
 await expect(page.locator('.candidate-kpis strong').nth(3)).toHaveText('100%');
 await page.getByLabel('Search candidate table').fill('no match candidate');
 await expect(page.locator('.hires tbody tr')).toHaveCount(0);
 await expect(steps.locator('strong')).toHaveText(Array(11).fill('0'));
 await expect(page.locator('.candidate-kpis strong')).toHaveText(['0','0','0','0%','0','0','0','0 days']);
});

test('Next 30 Days distributes all 18 rows into process chips exactly once',async({page})=>{
 await page.goto('/candidates?tile=starting-soon');
 await expect(page.locator('.hires tbody tr')).toHaveCount(18);
 const chips=page.getByRole('group',{name:'Filter candidates by process step'});
 await expect(chips.locator('strong')).toHaveText(['16','0','0','1','0','0','0','0','1','0','0']);
 const counts=await chips.locator('strong').allTextContents();
 expect(counts.reduce((sum,count)=>sum+Number(count),0)).toBe(await page.locator('.hires tbody tr').count());
 await chips.getByRole('button',{name:'Equipment',exact:true}).click();
 await expect(page.locator('.hires tbody tr')).toHaveCount(1);
 await expect(page.locator('.hires tbody tr')).toContainText('Amanda Lewis');
 await expect(chips.getByRole('button',{name:'Access',exact:true}).locator('strong')).toHaveText('0');
 await chips.getByRole('button',{name:'Equipment',exact:true}).click();
 await expect(page.locator('.hires tbody tr')).toHaveCount(18);
 await page.goto('/candidates');
 const allCounts=await chips.locator('strong').allTextContents();
 expect(allCounts.reduce((sum,count)=>sum+Number(count),0)).toBe(await page.locator('.hires tbody tr').count());
});

test('stage chip counts retain the date-filter distribution while Discovery is selected',async({page})=>{
 await page.goto('/candidates?tile=starting-soon&stage=Discovery');
 const chips=page.getByRole('group',{name:'Filter candidates by process step'});
 await expect(page.locator('.hires tbody tr')).toHaveCount(16);
 await expect(chips.locator('strong')).toHaveText(['16','0','0','1','0','0','0','0','1','0','0']);
 await chips.getByRole('button',{name:'Equipment',exact:true}).click();
 await expect(page.locator('.hires tbody tr')).toHaveCount(1);
 await expect(page.locator('.hires tbody tr')).toContainText('Amanda Lewis');
 await expect(chips.getByRole('button',{name:'Discovery',exact:true}).locator('strong')).toHaveText('16');
 await page.reload();await expect(chips.getByRole('button',{name:'Equipment',exact:true}).locator('strong')).toHaveText('1');
});

test('detail timeline and milestone summary derive from each saved candidate stage',async({page})=>{
 for(const [id,stage,index] of [['001240','Discovery',0],['001238','Deal Review',1],['001235','Contract',3],['001234','Pre-Registration',4],['001239','Equipment',8]] as const){
 await page.goto('/candidates/'+id);
 const timeline=page.locator('.stage-timeline');
 await expect(timeline.locator('.current')).toHaveText(stage+'In Progress');
 await expect(timeline.locator('.completed')).toHaveCount(index);
 await expect(page.locator('.status-summary strong')).toHaveText([String(index),'1',String(10-index),['001240','001238','001234'].includes(id)?'1':'0']);
 await timeline.getByRole('button',{name:'Ready to Start: Not Started',exact:true}).click();
 await page.getByLabel('Close stage').click();
 await expect(timeline.locator('.current')).toHaveText(stage+'In Progress');
 await page.getByRole('tab',{name:'Onboarding',exact:true}).click();
 await expect(page.locator('.milestone-list>div').nth(index)).toContainText(stage+'In Progress');
 await expect(page.locator('.milestone-list .green')).toHaveCount(index);
 }
});
