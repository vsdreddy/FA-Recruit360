import {test,expect} from '@playwright/test';
test('document library filters, reviews, uploads and isolates candidate records',async({page})=>{
 await page.goto('/candidates/001234');await page.getByRole('tab',{name:'Documents',exact:true}).click();
 await expect(page.locator('.doc-library tbody tr')).toHaveCount(12);
 await page.screenshot({path:'artifacts/documents-library.png',fullPage:true});
 await page.getByRole('button',{name:'Sent for Signature 2',exact:true}).click();await expect(page.locator('.doc-library tbody tr')).toHaveCount(2);
 await page.getByRole('button',{name:'Review Contract - Draft',exact:true}).click();await expect(page.getByRole('dialog',{name:'Document details'})).toBeVisible();await page.getByRole('button',{name:'Mark Reviewed',exact:true}).click();await page.getByLabel('Close document details').click();await expect(page.locator('.doc-library tbody tr')).toHaveCount(1);
 await page.reload();await page.getByRole('tab',{name:'Documents',exact:true}).click();await expect(page.locator('.doc-library tbody tr').filter({hasText:'Contract - Draft'})).toContainText('Completed');
 await page.getByRole('button',{name:'Upload Document',exact:true}).click();await page.getByLabel('Document name',{exact:true}).fill('Advisor Certification');await page.locator('input[type=file]').setInputFiles({name:'certification.pdf',mimeType:'application/pdf',buffer:Buffer.from('Mock document')});await page.getByRole('button',{name:'Upload for Review'}).click();await expect(page.locator('.doc-library tbody tr')).toHaveCount(13);
 await page.getByLabel('Search documents').fill('Certification');await expect(page.locator('.doc-library tbody tr')).toHaveCount(1);await expect(page.locator('.doc-library tbody')).toContainText('Pending Review');
 await page.goto('/candidates/001235');await page.getByRole('tab',{name:'Documents',exact:true}).click();await expect(page.locator('.doc-library tbody tr')).toHaveCount(12);
 await page.getByRole('button',{name:'Filters',exact:true}).click();await page.getByLabel('Document category').selectOption('Onboarding');await expect(page.locator('.doc-library tbody tr')).toHaveCount(2);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('candidate Documents tab shows only the file library, without the workflow documents table',async({page})=>{
 await page.goto('/candidates/001234');await page.getByRole('tab',{name:'Documents',exact:true}).click();
 await expect(page.locator('.doc-library')).toBeVisible();
 await expect(page.locator('.wf-documents')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Workflow documents'})).toHaveCount(0);
});
