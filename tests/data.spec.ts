import {test,expect} from '@playwright/test';
import {initialCandidates,restoreCandidates} from '../src/data';
import {dashboardData} from '../src/dashboard-data';
import {matchesTile,tileFilters} from '../src/candidate-filters';
import {workItems} from '../src/work-data';
test('source fixtures reconcile every dashboard cohort and chart',()=>{
 const d=dashboardData(initialCandidates);
 expect(new Set(initialCandidates.map(c=>c.id)).size).toBe(142);
 expect(d.values).toEqual([142,28,18,'76%',18,12,15,64]);
 expect(tileFilters.map(t=>initialCandidates.filter(c=>matchesTile(c,t.key)).length)).toEqual([142,28,18,108,18,12,15,142]);
 expect(d.pipeline).toEqual([142,118,96,81,68,54,42,28,18]);
 expect(d.starts).toEqual([18,26,34]);
 expect(d.readiness.map(r=>r.count)).toEqual([12,8,5,3]);
 expect(d.owners).toEqual([24,18,12,10,8,6]);
 expect(workItems(initialCandidates)).toHaveLength(78);
 expect(d.stageDays).toEqual([6,8,10,9,14,8,12,6]);
 expect(d.monthly.map(m=>m.reduce((a,b)=>a+b,0))).toEqual([0,19,8,7,0]);
 const migrated=restoreCandidates([{...initialCandidates[0],name:'Retained edit'}]);
 expect(migrated).toHaveLength(142);expect(migrated[0].name).toBe('Retained edit');expect(migrated[0].offerAccepted).toBe(true);
});
test('dashboard and drilldowns update after completing work and approving an offer',async({page})=>{
 await page.goto('/');await expect(page.locator('.metric strong')).toHaveText(['142','28','18','76%','18','12','15','64']);
 await page.getByLabel('Reporting period').selectOption('Last 90 Days');await expect(page.locator('.metric strong')).toHaveText(['142','28','18','76%','18','12','15','64']);
 await page.goto('/tasks');await page.getByLabel('Status for Follow up on fingerprint').selectOption('Completed');
 await page.getByRole('button',{name:'Approve advisor deal',exact:true}).click();await page.getByRole('button',{name:'Approve',exact:true}).click();
 await page.goto('/');await expect(page.getByRole('button',{name:'Overdue Tasks',exact:true}).locator('strong')).toHaveText('11');await expect(page.getByRole('button',{name:'Awaiting Approval',exact:true}).locator('strong')).toHaveText('14');
 await page.getByRole('button',{name:'Overdue Tasks',exact:true}).click();await expect(page.locator('.hires tbody tr')).toHaveCount(11);await expect(page.getByRole('link',{name:'David Chen',exact:true})).toHaveCount(0);
 await page.goto('/candidates?tile=approval');await expect(page.locator('.hires tbody tr')).toHaveCount(14);
});
