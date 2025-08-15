import { Page, Locator } from 'playwright';
import {
  getBrowser,
  navigate,
  input,
  click,
  getData,
  elem,
} from './scraper';
import fs from 'fs';
import path from 'path';
import { BaseStep, SelectorType } from './types';
import { locatorFor, replaceDataPlaceholders, cloneStepWithIndex } from './utils';

// Import global types
import './global-types';

/**
 * Execute a step in the context of a specific element.
 * 
 * @param {object} page - The page object.
 * @param {object} contextElement - The context element.
 * @param {object} step - The step object.
 * @param {object} collector - The collector object.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {void} - Nothing.
 * @since v1.0.0
 * @company Framework Island
 */
export async function executeStepInContext(
  page: Page,
  contextElement: Locator,
  step: BaseStep,
  collector: Record<string, any>
): Promise<void> {
  console.log(`➡️  Step \`${step.id}\` (${step.action}) in context`);
  
  switch (step.action) {
    case 'data': {
      try {
        // Find element within the context
        let targetElement: Locator;
        if (step.object_type === 'tag') {
          targetElement = contextElement.locator(step.object ?? '');
        } else if (step.object_type === 'class') {
          targetElement = contextElement.locator(`.${step.object ?? ''}`);
        } else if (step.object_type === 'id') {
          targetElement = contextElement.locator(`#${step.object ?? ''}`);
        } else if (step.object_type === 'xpath') {
          targetElement = contextElement.locator(`xpath=${step.object ?? ''}`);
        } else {
          targetElement = contextElement.locator(step.object ?? '');
        }
        
        const count = await targetElement.count();
        
        if (count === 0) {
          console.log(`   ⚠️  Element not found in context: ${step.object} - skipping data extraction`);
          const key = step.key || step.id || 'data';
          collector[key] = '';
          return;
        }
        
        // Get data from the first matching element
        let value: string;
        switch (step.data_type) {
          case 'text':
            value = (await targetElement.first().textContent()) ?? '';
            break;
          case 'html':
            value = await targetElement.first().innerHTML();
            break;
          case 'value':
            value = await targetElement.first().getAttribute('href') ?? '';
            break;
          default:
            value = await targetElement.first().innerText();
        }
        
        const key = step.key || step.id || 'data';
        collector[key] = value;
        console.log(`Step Data: ${key}: ${value}`);
      } catch (err: any) {
        console.log(`   ⚠️  Data extraction failed in context for ${step.object}: ${err.message}`);
        const key = step.key || step.id || 'data';
        collector[key] = '';
      }
      break;
    }
    default:
      // For other actions, fall back to regular executeStep
      await executeStep(page, step, collector);
  }

  if (step.wait && step.wait > 0) {
    await page.waitForTimeout(step.wait);
  }
}

/**
 * Execute a step.
 * 
 * @param {object} page - The page object.
 * @param {object} step - The step object.
 * @param {object} collector - The collector object.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {void} - Nothing.
 * @since v1.0.0
 * @company Framework Island
 */
export async function executeStep(
  page: Page,
  step: BaseStep,
  collector: Record<string, any>
): Promise<void> {
  console.log(`➡️  Step \`${step.id}\` (${step.action})`);
  switch (step.action) {
    case 'navigate': {
      await navigate(page, step.value ?? '');
      break;
    }
    case 'input': {
      await input(
        page,
        step.object_type as SelectorType,
        step.object ?? '',
        step.value ?? '',
        step.wait ?? 0
      );
      break;
    }
    case 'click': {
      try {
        // Check if element exists first
        const locator = locatorFor(page, step.object_type as SelectorType | undefined, step.object ?? '');
        const count = await locator.count();
        
        if (count === 0) {
          console.log(`   ⚠️  Element not found: ${step.object} - skipping click action`);
          return;
        }
        
        await click(page, step.object_type as SelectorType, step.object ?? '');
      } catch (err: any) {
        console.log(`   ⚠️  Click failed for ${step.object}: ${err.message}`);
        // Don't throw error, just continue
      }
      break;
    }
    case 'data': {
      try {
        // Check if element exists first
        const locator = locatorFor(page, step.object_type as SelectorType | undefined, step.object ?? '');
        const count = await locator.count();
        
        if (count === 0) {
          console.log(`   ⚠️  Element not found: ${step.object} - skipping data extraction`);
          const key = step.key || step.id || 'data';
          collector[key] = ''; // Set to empty string when element not found
          return;
        }
        
        const value = await getData(
          page,
          step.object_type as SelectorType,
          step.object ?? '',
          step.data_type ?? 'default',
          step.wait ?? 0
        );
        const key = step.key || step.id || 'data';
        collector[key] = value;
        console.log(`Step Data: ${key}: ${value}`);
      } catch (err: any) {
        console.log(`   ⚠️  Data extraction failed for ${step.object}: ${err.message}`);
        const key = step.key || step.id || 'data';
        collector[key] = ''; // Set to empty string when data can't be extracted
        // Don't throw error, just continue
      }
      break;
    }
    case 'download': {
      // check if element exists.
      // Save downloaded file to path provided in step.value (defaults ./downloads)
      if (!step.value) {
        throw new Error(`download step ${step.id} requires 'value' as target filepath`);
      }

      // Determine the key under which to store the downloaded file path
      const collectorKey = step.key || step.id || 'file';
      let savedPath: string | null = null;

      try {
        const targetLocator = await elem(page, step.object_type as SelectorType, step.object ?? '');
        if (targetLocator) {
          const isVisible = await targetLocator.isVisible().catch(() => false);
          if (isVisible) {
            const dlPromise = page.waitForEvent('download', { timeout: 10000 });
            await targetLocator.click();
            const dl = await dlPromise;
            const savePath = step.value;
            const dir = path.dirname(savePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            await dl.saveAs(savePath);
            savedPath = savePath;
            console.log(`   📥 Saved to ${savePath}`);
          } else {
            console.log(`   📥 Element not visible or not found: ${step.object}`);
          }
        } else {
          console.log(`   📥 Element not found: ${step.object}`);
        }
      } catch (err: any) {
        console.log(`   📥 Download failed for ${step.object}: ${err.message}`);
        // Don't throw error, just continue
      } finally {
        // Record the file path (or null if not downloaded) in the collector
        collector[collectorKey] = savedPath;
      }
      break;
    }
    case 'foreach': {
      if (!step.object) throw new Error('foreach step requires object as locator');
      if (!step.subSteps || step.subSteps.length === 0) {
        throw new Error('foreach step requires subSteps');
      }
      const locatorAll = locatorFor(page, step.object_type as SelectorType | undefined, step.object);
      try {
        await locatorAll.first().waitFor({ state: 'attached', timeout: step.wait ?? 5000 });
      } catch {}

      const count = await locatorAll.count();
      console.log(`   🔁 foreach found ${count} items for selector ${step.object}`);
      for (let idx = 0; idx < count; idx++) {
        const current = locatorAll.nth(idx);
        await current.scrollIntoViewIfNeeded();
        
        // Create a separate collector for each iteration
        const itemCollector: Record<string, any> = {};
        
        // For each subStep clone and replace placeholders
        for (const s of step.subSteps) {
          const cloned = cloneStepWithIndex(s, idx);
          try {
            // Execute step in the context of the current item
            await executeStepInContext(page, current, cloned, itemCollector);
          } catch (err: any) {
            console.log(`⚠️  sub-step '${cloned.id}' failed: ${err.message}`);
            if (cloned.terminateonerror) throw err;
          }
        }
        
        // Store the item collector with a unique key for this iteration
        collector[`item_${idx}`] = itemCollector;
        
        // If we have collected data for this item, emit it immediately for streaming
        if (Object.keys(itemCollector).length > 0) {
          console.log(`   📋 Collected data for item ${idx}:`, Object.keys(itemCollector));
          
          // Emit the result immediately for streaming
          // We need to access the onResult callback from the parent context
          // This is a bit of a hack, but it works for immediate streaming
          if ((global as any).onResultCallback) {
            try {
              await (global as any).onResultCallback(itemCollector, idx);
            } catch (err) {
              console.log(`   ⚠️  Callback failed for item ${idx}: ${err}`);
            }
          }
        }
      }
      break;
    }
    case 'open': {
      if (!step.object) throw new Error('open step requires object locator');
      if (!step.subSteps || step.subSteps.length === 0) throw new Error('open step needs subSteps');

      console.log(`   🔗 Opening link/tab from selector ${step.object}`);
      
      try {
        // locate link and check if it exists
        const linkLoc = locatorFor(page, step.object_type as SelectorType | undefined, step.object);
        const count = await linkLoc.count();
        
        if (count === 0) {
          console.log(`   ⚠️  Element not found: ${step.object} - skipping open action`);
          return;
        }
        
        let href = await linkLoc.getAttribute('href');

        let newPage: Page | null = null;
        const context = page.context();

        if (href) {
          // absolute or relative URL
          if (!href.startsWith('http')) {
            const base = page.url();
            href = new URL(href, base).toString();
          }
          newPage = await context.newPage();
          await newPage.goto(href, { waitUntil: 'networkidle' });
        } else {
          // fallback: click with modifier to open new tab
          const pagePromise = context.waitForEvent('page');
          await linkLoc.click({ modifiers: ['Meta'] }).catch(() => linkLoc.click());
          newPage = await pagePromise;
          await newPage.waitForLoadState('networkidle');
        }

        // Pass the parent collector data to subSteps so they can access meeting_title, meeting_date, etc.
        const innerCollected: Record<string, any> = { ...collector };
        for (const s of step.subSteps) {
          const cloned: BaseStep = { ...s };
          try {
            await executeStep(newPage, cloned, innerCollected);
          } catch (err: any) {
            console.log(`   ⚠️  Sub-step in open failed: ${err.message}`);
            if (cloned.terminateonerror) throw err;
          }
        }

        // merge into collector
        Object.assign(collector, innerCollected);
        console.log('   🔙 Closed child tab');

        await newPage.close();
      } catch (err: any) {
        console.log(`   ⚠️  Open action failed for ${step.object}: ${err.message}`);
        if (step.terminateonerror) throw err;
      }
      break;
    }
    case 'scroll': {
      // Scroll the page by given offset or full height
      const offset = step.value ? parseInt(step.value, 10) : await page.evaluate(() => window.innerHeight);
      await page.evaluate((y: number) => window.scrollBy(0, y), offset);
      break;
    }
    case 'savePDF': {
      // Save PDF content from current page to file
      if (!step.value) {
        throw new Error(`savePDF step ${step.id} requires 'value' as target filepath`);
      }

      const collectorKey = step.key || step.id || 'file';
      let savedPath: string | null = null;

      try {
        console.log(`   📄 Waiting for PDF content to load...`);
        
        // Strategy 1: Wait for DOM content loaded first, //timeout 10 minutes
        try {
          await page.waitForLoadState('domcontentloaded', { timeout: step.wait ?? 600000 });
          console.log(`   📄 DOM content loaded`);
        } catch (domErr) {
          console.log(`   📄 DOM content timeout, continuing anyway`);
        }
        
        // Strategy 2: Wait for PDF-specific elements or indicators
        let pdfReady = false;
        const maxAttempts = 15; // Increased attempts for PDF loading
        let attempts = 0;
        
        while (!pdfReady && attempts < maxAttempts) {
          attempts++;
          console.log(`   📄 Checking PDF readiness (attempt ${attempts}/${maxAttempts})`);
          
          try {
            // Check if page has PDF content indicators
            const hasPdfContent = await page.evaluate(() => {
              // Check for PDF viewer elements
              const pdfViewer = document.querySelector('embed[type="application/pdf"]') ||
                               document.querySelector('object[type="application/pdf"]') ||
                               document.querySelector('iframe[src*=".pdf"]') ||
                               document.querySelector('.pdf-viewer') ||
                               document.querySelector('[data-pdf]');
              
              // Check if page content is substantial (not just loading screen)
              const bodyText = document.body ? document.body.innerText : '';
              const hasSubstantialContent = bodyText.length > 200; // Increased threshold
              
              // Check if page is visible
              const isVisible = document.body && 
                               document.body.style.display !== 'none' && 
                               document.body.style.visibility !== 'hidden';
              
              // Check for PDF-specific content
              const hasPdfText = bodyText.includes('PDF') || 
                                bodyText.includes('Page') || 
                                bodyText.includes('Agenda') ||
                                bodyText.includes('Meeting');
              
              return {
                hasPdfViewer: !!pdfViewer,
                hasSubstantialContent,
                isVisible,
                bodyTextLength: bodyText.length,
                hasPdfText
              };
            });
            
            console.log(`   📄 PDF check:`, hasPdfContent);
            
            // Only consider ready if we have substantial content OR PDF text
            if (hasPdfContent.hasSubstantialContent || hasPdfContent.hasPdfText) {
              pdfReady = true;
              console.log(`   📄 PDF content appears ready (substantial content or PDF text found)`);
              break;
            } else {
              console.log(`   📄 PDF not ready yet - content: ${hasPdfContent.hasSubstantialContent}, text length: ${hasPdfContent.bodyTextLength}, hasPdfText: ${hasPdfContent.hasPdfText}`);
            }
            
            // Wait a bit before next check
            await page.waitForTimeout(2000); // Increased wait time
            
          } catch (checkErr: any) {
            console.log(`   📄 PDF check failed: ${checkErr.message}`);
            await page.waitForTimeout(2000);
          }
        }
        
        // Strategy 3: Additional wait for any dynamic content
        if (step.wait && step.wait > 0) {
          console.log(`   📄 Additional wait: ${step.wait}ms`);
          await page.waitForTimeout(step.wait);
        }
        
        console.log(`   📄 Capturing PDF...`);
        // Get the PDF content as buffer
        const pdfBuffer = await page.pdf({ format: 'A4' });
        
        // Ensure directory exists
        const savePath = replaceDataPlaceholders(step.value, collector) || step.value || '';
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save the PDF
        fs.writeFileSync(savePath, pdfBuffer);
        savedPath = savePath;
        console.log(`   📄 PDF saved to ${savePath}`);
      } catch (err: any) {
        console.log(`   📄 PDF save failed: ${err.message}`);
        // Don't throw error, just continue
      } finally {
        // Record the file path (or null if not saved) in the collector
        collector[collectorKey] = savedPath;
      }
      break;
    }
    case 'printToPDF': {
      // Click button to open print dialog and save as PDF
      if (!step.value) {
        throw new Error(`printToPDF step ${step.id} requires 'value' as target filepath`);
      }

      const collectorKey = step.key || step.id || 'file';
      let savedPath: string | null = null;

      try {
        // Check if element exists first
        const locator = locatorFor(page, step.object_type as SelectorType | undefined, step.object ?? '');
        const count = await locator.count();
        
        if (count === 0) {
          console.log(`   ⚠️  Element not found: ${step.object} - skipping printToPDF action`);
          return;
        }

        console.log(`   🖨️  Attempting to print PDF from element: ${step.object}`);
        
        // Set up download listener with shorter timeout
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
        
        // Click the button that opens print dialog
        await locator.click();
        console.log(`   🖨️  Clicked print button`);
        
        // Wait a moment for print dialog to appear
        await page.waitForTimeout(2000);
        
        // Try multiple approaches to handle print dialog
        let download = null;
        
        try {
          // Approach 1: Try keyboard shortcuts
          console.log(`   🖨️  Trying keyboard shortcuts (Ctrl+P)`);
          await page.keyboard.press('Control+P');
          await page.waitForTimeout(2000);
          await page.keyboard.press('Enter');
          
          // Wait for download with shorter timeout
          download = await downloadPromise;
        } catch (keyboardErr: any) {
          console.log(`   🖨️  Keyboard shortcuts failed: ${keyboardErr.message}`);
          
          // Approach 2: Try clicking the print button again if it's still there
          try {
            console.log(`   🖨️  Trying direct print button click`);
            await locator.click();
            await page.waitForTimeout(3000);
            download = await page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
          } catch (clickErr: any) {
            console.log(`   🖨️  Direct click also failed: ${clickErr.message}`);
          }
        }
        
        if (download) {
          // Ensure directory exists
          const savePath = step.value;
          const dir = path.dirname(savePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          // Save the downloaded file
          await download.saveAs(savePath);
          savedPath = savePath;
          console.log(`   🖨️  Print PDF saved to ${savePath}`);
        } else {
          console.log(`   🖨️  No download event detected - print dialog may not have worked`);
        }
        
      } catch (err: any) {
        console.log(`   🖨️  PrintToPDF failed: ${err.message}`);
        // Don't throw error, just continue
      } finally {
        // Record the file path (or null if not saved) in the collector
        collector[collectorKey] = savedPath;
      }
      break;
    }
    default:
      // Unhandled action – ignore to be future-proof
      break;
  }

  if (step.wait && step.wait > 0) {
    await page.waitForTimeout(step.wait);
  }
}

/**
 * Execute a step list.
 * 
 * @param {object} page - The page object.
 * @param {object} steps - The steps object.
 * @param {object} collected - The collected object.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {void} - Nothing.
 * @since v1.0.0
 * @company Framework Island
 */
export async function executeStepList(page: Page, steps: BaseStep[], collected: Record<string, any>): Promise<void> {
  console.log(`📝 Executing ${steps.length} step(s)`);
  for (const step of steps) {
    try {
      await executeStep(page, step, collected);
    } catch (err) {
      if (step.terminateonerror) {
        throw err;
      }
    }
  }
}
