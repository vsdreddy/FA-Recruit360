import {test,expect} from '@playwright/test';

test('contract gates, shared tasks and documents, advance, persistence and reopening',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/candidates/001235');
 await page.getByRole('button',{name:'Contract: In Progress',exact:true}).click();
 const drawer=page.getByRole('dialog',{name:'Contract workflow'});
 await expect(drawer.getByRole('button',{name:'Complete Stage & Continue'})).toBeDisabled();
 await drawer.getByRole('button',{name:'Complete mock task'}).first().click();
 await expect(drawer.getByRole('alert')).toContainText('evidence note');
 await drawer.getByLabel('Evidence note').fill('Demo agreement REF-101');
 await drawer.getByRole('button',{name:'Complete mock task'}).first().click();
 await drawer.getByRole('button',{name:'Complete mock task'}).first().click();
 await drawer.getByRole('button',{name:'Simulate reviewed document'}).click();
 await expect(drawer.getByRole('button',{name:'Complete Stage & Continue'})).toBeDisabled();
 await page.getByLabel('Close stage').click();
 await page.goto('/tasks');await page.getByPlaceholder('Search tasks, candidates, or owners...').fill('Simulate firm signature');
 await page.getByRole('button',{name:'Simulate firm signature',exact:true}).click();
 await page.getByRole('button',{name:'Mark Complete',exact:true}).click();
 await page.goto('/candidates/001235');await page.getByRole('button',{name:'Contract: In Progress',exact:true}).click();
 await expect(drawer.getByRole('button',{name:'Complete Stage & Continue'})).toBeEnabled();
 await drawer.getByRole('button',{name:'Complete Stage & Continue'}).click();
 await page.getByLabel('Close stage').click();
 await expect(page.getByRole('button',{name:'Pre-Registration: In Progress',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('button',{name:'Contract: Completed',exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'Documents',exact:true}).click();
 await expect(page.locator('.wf-documents tr').filter({hasText:'Executed agreement'})).toContainText('Reviewed');
 await page.getByRole('button',{name:'Contract: Completed',exact:true}).click();
 await drawer.getByRole('button',{name:'Reopen stage'}).click();await expect(drawer.getByRole('alert')).toContainText('reason');
 await drawer.getByLabel('Evidence note').fill('Terms changed; signatures require revalidation');
 await drawer.getByRole('button',{name:'Reopen stage'}).click();
 await expect(drawer.getByRole('button',{name:'Complete Stage & Continue'})).toBeDisabled();
 await page.getByLabel('Close stage').click();
 await page.getByRole('tab',{name:'Activity & Audit',exact:true}).click();await expect(page.getByText(/Terms changed; signatures require revalidation/)).toBeVisible();
 await page.screenshot({path:'artifacts/workflow-audit.png',fullPage:true});expect(errors).toEqual([]);
});

test('parallel equipment work retains primary stage and cannot bypass dependencies',async({page})=>{
 await page.goto('/candidates/001234');await page.getByRole('button',{name:'Equipment: Not Started',exact:true}).click();
 await page.getByLabel('Evidence note').fill('Mock equipment request EQ-100');
 await page.getByRole('button',{name:'Complete mock task'}).first().click();
 await page.getByLabel('Close stage').click();
 await expect(page.getByRole('button',{name:'Pre-Registration: In Progress',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Equipment: In Progress',exact:true})).toBeVisible();
 await page.goto('/candidates?stage=Equipment');await expect(page.locator('.hires tbody')).not.toContainText('Michael A. Thompson');
 await page.goto('/candidates/001240');await page.getByRole('button',{name:'Equipment: Not Started',exact:true}).click();
 await expect(page.locator('.wf-blockers')).toContainText('Complete Contract');
});

test('configuration drafts publish immutable versions and migration revalidates',async({page})=>{
 await page.goto('/admin');await page.getByLabel('Stage label',{exact:true}).fill('Advisor Discovery');
 await page.getByLabel('Owner / approver').fill('Lead Recruiter');await page.getByRole('button',{name:'Save Draft',exact:true}).click();await page.reload();
 await expect(page.getByLabel('Stage label',{exact:true})).toHaveValue('Advisor Discovery');
 await page.getByRole('button',{name:'Publish Version',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Published new version');
 await page.screenshot({path:'artifacts/workflow-configuration.png',fullPage:true});
 await page.goto('/candidates/001240');await expect(page.getByRole('button',{name:'Discovery: In Progress',exact:true})).toContainText('Discovery');
 await page.goto('/admin');await page.getByLabel('Candidate to migrate').selectOption('001240');await page.getByLabel('Migration reason').fill('Adopt new recruiting checklist');await page.getByRole('button',{name:'Migrate to latest version'}).click();
 await page.goto('/candidates/001240');await expect(page.getByRole('button',{name:'Discovery: In Progress',exact:true})).toContainText('Advisor Discovery');
 await page.getByRole('button',{name:'Discovery: In Progress',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Workflow v2');
});

test('all eleven stages require evidence and end at Started',async({page})=>{
 await page.goto('/candidates/001240');
 const stages=['Discovery','Deal Review','Approval','Contract','Pre-Registration','Background','U-4 / FINRA','Hire Processing','Equipment','Access','Ready to Start'];
 for(const stage of stages){
  await page.locator('.stage-timeline').getByRole('button',{name:stage+': In Progress',exact:true}).click();
  const drawer=page.getByRole('dialog');await drawer.getByLabel('Evidence note').fill('Verified simulated '+stage+' evidence');
  const actions=drawer.locator('.wf-requirement button.primary');
  while(await actions.count())await actions.first().click();
  await drawer.getByRole('button',{name:'Complete Stage & Continue'}).click();
  if(stage==='Ready to Start'){await drawer.getByRole('button',{name:'Mark Started (mock)'}).click();await expect(drawer.getByRole('button',{name:'Started',exact:true})).toBeDisabled()}
  await page.getByLabel('Close stage').click();
 }
 await expect(page.locator('.stage-timeline .completed')).toHaveCount(11);await expect(page.locator('.health-progress strong')).toHaveText('100%');await page.reload();await expect(page.locator('.health-progress strong')).toHaveText('100%');
});

test('reviewing supporting files updates workflow evidence and reset restores the snapshot',async({page})=>{
 await page.goto('/candidates/001234');await page.getByRole('tab',{name:'Documents',exact:true}).click();
 await page.getByRole('button',{name:'Upload Document',exact:true}).click();
 await page.locator('input[name="name"]').fill('Pre-Reg Disclosure Form');
 await page.locator('input[type="file"]').setInputFiles({name:'disclosure.pdf',mimeType:'application/pdf',buffer:Buffer.from('Mock disclosure')});
 await page.getByRole('button',{name:'Upload for Review'}).click();
 await page.getByLabel('Review Pre-Reg Disclosure Form',{exact:true}).click();
 await page.getByRole('button',{name:'Mark Reviewed',exact:true}).click();await page.getByLabel('Close document details').click();
 await expect(page.locator('.wf-documents tr').filter({hasText:'Pre-Reg Disclosure Form'})).toContainText('Reviewed');
 await page.getByRole('button',{name:'Pre-Registration: In Progress',exact:true}).click();
 await expect(page.locator('.wf-requirement').filter({hasText:'Pre-Reg Disclosure Form'})).toContainText('Supporting file reviewed: disclosure.pdf');
 await page.getByLabel('Close stage').click();await page.goto('/admin');
 await page.getByRole('button',{name:'Reset Demo Data',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Reset Demo Data',exact:true}).click();await page.getByRole('button',{name:'Confirm reset',exact:true}).click();
 await page.goto('/');await expect(page.locator('.metric strong')).toHaveText(['142','28','18','76%','18','12','15','64']);
});
