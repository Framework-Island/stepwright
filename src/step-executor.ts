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
import { request } from 'playwright';
import { BaseStep, SelectorType } from './types';
import { locatorFor, replaceDataPlaceholders, cloneStepWithIndex, flattenNestedForeachResults } from './utils';

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
  collector: Record<string, any>,
  onResult?: (result: Record<string, any>, index: number) => void | Promise<void>,
  scopeLocator?: Locator
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
        // For attribute extraction, strip /@attribute from selector when checking existence
        let checkSelector = step.object ?? '';
        if (step.data_type === 'attribute' && checkSelector.match(/\/@\w+$/)) {
          checkSelector = checkSelector.replace(/\/@\w+$/, '');
        }

        // Check if element exists first - use scopeLocator if provided (for foreach context)
        const locator = scopeLocator
          ? locatorFor(
              scopeLocator as any,
              step.object_type as SelectorType | undefined,
              checkSelector
            )
          : locatorFor(
              page,
              step.object_type as SelectorType | undefined,
              checkSelector
            );
        const count = await locator.count();

        if (count === 0) {
          console.log(
            `   ⚠️  Element not found: ${checkSelector} - skipping data extraction`
          );
          const key = step.key || step.id || 'data';
          collector[key] = null; // Set to null when element not found
          return;
        }

        // Extract data from the scoped locator
        let value: string;
        if (step.data_type === 'text') {
          value = (await locator.first().textContent()) ?? '';
        } else if (step.data_type === 'html') {
          value = await locator.first().innerHTML();
        } else if (step.data_type === 'value') {
          value = await locator.first().inputValue();
        } else if (step.data_type === 'attribute') {
          const attrMatch = step.object?.match(/\/@(\w+)$/);
          if (attrMatch) {
            const attrName = attrMatch[1];
            value = (await locator.first().getAttribute(attrName)) ?? '';
          } else {
            value = (await locator.first().textContent()) ?? '';
          }
        } else {
          // default
          value = (await locator.first().textContent()) ?? '';
        }
        const key = step.key || step.id || 'data';
        collector[key] = value;
        console.log(`Step Data: ${key}: ${value}`);
      } catch (err: any) {
        console.log(
          `   ⚠️  Data extraction failed for ${step.object}: ${err.message}`
        );
        const key = step.key || step.id || 'data';
        collector[key] = null; // Set to null when data can't be extracted
        // Don't throw error, just continue
      }
      break;
    }
    case 'eventBaseDownload': {
      // check if element exists.
      // Save downloaded file to path provided in step.value (defaults ./downloads)
      if (!step.value) {
        throw new Error(`eventBaseDownload step ${step.id} requires 'value' as target filepath`);
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

        // Only scroll if autoScroll is not explicitly set to false
        if (step.autoScroll !== false) {
          await current.scrollIntoViewIfNeeded();
        }

        // Create a separate collector for each iteration
        const itemCollector: Record<string, any> = {};

        // For each subStep clone and replace placeholders
        for (const s of step.subSteps) {
          const cloned = cloneStepWithIndex(s, idx);
          try {
            await executeStep(page, cloned, itemCollector, onResult, current);
          } catch (err: any) {
            console.log(`⚠️  sub-step '${cloned.id}' failed: ${err.message}`);
            if (cloned.terminateonerror) throw err;
          }
        }

        // Store the item collector with a unique key for this iteration
        collector[`item_${idx}`] = itemCollector;

        // If we have collected data for this item, emit it immediately for streaming
        if (Object.keys(itemCollector).length > 0) {
          console.log(
            `   📋 Collected data for item ${idx}:`,
            Object.keys(itemCollector)
          );

          // Emit the result immediately for streaming
          // We need to access the onResult callback from the parent context
          // This is a bit of a hack, but it works for immediate streaming
          if ((global as any).onResultCallback) {
            try {
              const flattenedResult = flattenNestedForeachResults(itemCollector);
              await (global as any).onResultCallback(flattenedResult, idx);
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
          if (href.startsWith('//')) {
            href = 'https:' + href;
          } else if (!href.startsWith('http')) {
            const base = page.url();
            href = new URL(href, base).toString();
          }
          newPage = await context.newPage();
          try {
            await newPage.goto(href, { waitUntil: 'networkidle' });
          } catch (err: any) {
            console.log(`   ⚠️  Navigation failed for ${href}: ${err.message}`);
            throw err;
          }
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
      // Save the actual PDF binary from the current page or embedded viewer
      if (!step.value) {
        throw new Error(`savePDF step ${step.id} requires 'value' as target filepath`);
      }

      const collectorKey = step.key || step.id || 'file';
      let savedPath: string | null = null;
      const targetPathBase: string = step.value as string;
      const resolvedPath: string = replaceDataPlaceholders(targetPathBase, collector) || targetPathBase;
      const dir = path.dirname(resolvedPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let pdfSaved = false;
      const interceptedData: { buffer: Buffer | null } = { buffer: null };

      try {
        // Ensure the page finished initial navigation
        try {
          await page.waitForLoadState('domcontentloaded', { timeout: step.wait ?? 600000 });
        } catch {}

        // Intercept responses to capture PDF even when displayed inline
        await page.route('**/*', async route => {
          const response = await route.fetch();
          const contentType = response.headers()['content-type'] || '';
          const url = route.request().url();

          // Check if this is a PDF response
          if (contentType.includes('application/pdf') || url.includes('.pdf')) {
            const buffer = await response.body();
            if (!pdfSaved && buffer.length > 0) {
              interceptedData.buffer = buffer;
              // Save immediately when intercepted
              try {
                fs.writeFileSync(resolvedPath, buffer);
                savedPath = resolvedPath;
                pdfSaved = true;
                console.log(
                  `   📄 PDF intercepted and saved (${(buffer.length / 1024).toFixed(2)} KB) to ${resolvedPath}`
                );
              } catch (saveErr: any) {
                console.log(`   📄 Failed to save intercepted PDF: ${saveErr.message}`);
              }
            }
          }

          // Continue with the normal response
          await route.fulfill({ response });
        });

        const currentUrl = page.url();
        console.log(`   📄 Current URL: ${currentUrl}`);

        // Check if we're already on a PDF URL - wait a bit for interception
        const isPdfUrl = currentUrl.includes('.pdf') || /\.pdf(\?|$)/i.test(currentUrl);
        if (isPdfUrl && !pdfSaved) {
          // Wait a moment for route interception to catch the PDF if it's already loading
          await page.waitForTimeout(1000);
        }

        // Try both approaches: wait for download event OR intercept response
        try {
          // Reload the page to trigger route interception (unless already saved)
          const [response, download] = await Promise.all([
            !pdfSaved ? page.reload({ waitUntil: 'networkidle' }).catch(() => null) : Promise.resolve(null),
            page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
          ]);

          if (download) {
            // If download event occurred, save it
            await download.saveAs(resolvedPath);
            savedPath = resolvedPath;
            pdfSaved = true;
            console.log(`   📄 PDF saved via download event to ${resolvedPath}`);
          } else if (response) {
            // Check if the response itself is a PDF
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('application/pdf') && !pdfSaved) {
              const buffer = await response.body();
              if (buffer.length > 0) {
                fs.writeFileSync(resolvedPath, buffer);
                savedPath = resolvedPath;
                pdfSaved = true;
                console.log(
                  `   📄 PDF saved via response body (${(buffer.length / 1024).toFixed(2)} KB) to ${resolvedPath}`
                );
              }
            } else {
              // Wait a bit for route interception to capture it
              await page.waitForTimeout(2000);
              if (interceptedData.buffer && !pdfSaved && interceptedData.buffer.length > 0) {
                fs.writeFileSync(resolvedPath, interceptedData.buffer);
                savedPath = resolvedPath;
                pdfSaved = true;
                console.log(
                  `   📄 PDF saved via intercepted response (${(interceptedData.buffer.length / 1024).toFixed(2)} KB) to ${resolvedPath}`
                );
              }
            }
          } else if (interceptedData.buffer && !pdfSaved && interceptedData.buffer.length > 0) {
            // Fallback: use intercepted buffer
            fs.writeFileSync(resolvedPath, interceptedData.buffer);
            savedPath = resolvedPath;
            pdfSaved = true;
            console.log(
              `   📄 PDF saved via intercepted response (${(interceptedData.buffer.length / 1024).toFixed(2)} KB) to ${resolvedPath}`
            );
          }
        } catch (error: any) {
          console.log(`   📄 Error during PDF save: ${error.message}`);
          // Still try to save intercepted buffer if available
          if (interceptedData.buffer && !pdfSaved && interceptedData.buffer.length > 0) {
            fs.writeFileSync(resolvedPath, interceptedData.buffer);
            savedPath = resolvedPath;
            pdfSaved = true;
            console.log(
              `   📄 PDF saved via intercepted response (${(interceptedData.buffer.length / 1024).toFixed(2)} KB) to ${resolvedPath}`
            );
          }
        }
      } catch (err: any) {
        console.log(`   📄 savePDF failed: ${err.message}`);
      } finally {
        // Unroute to clean up
        try {
          await page.unroute('**/*');
        } catch {}

        // Verify file was saved
        if (!pdfSaved && savedPath && fs.existsSync(savedPath)) {
          pdfSaved = true;
        }

        collector[collectorKey] = savedPath;
        if (pdfSaved || savedPath) {
          console.log(`   ✓ PDF successfully saved to ${savedPath}`);
        } else {
          console.log(`   ✗ Failed to save PDF`);
        }
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
    case 'downloadFile':
    case 'downloadPDF': {
      if (!step.object) throw new Error('downloadPDF requires object locator');
      if (!step.value)
        throw new Error(
          `downloadPDF step ${step.id} requires 'value' as target filepath`
        );

      const collectorKey = step.key || step.id || 'file';
      let savedPath: string | null = null;

      try {
        // 1) Find the link and get its href
        const link = locatorFor(
          page,
          step.object_type as SelectorType | undefined,
          step.object
        );
        const present = (await link.count()) > 0;
        if (!present) {
          console.log(`   ⚠️  PDF link not found: ${step.object}`);
          collector[collectorKey] = null;
          break;
        }

        let href = await link.getAttribute('href');

        // Fallback: if no href (javascript: handler), open in a new tab and use that URL
        if (!href || href.startsWith('javascript')) {
          const ctx = page.context();
          const pagePromise = ctx
            .waitForEvent('page', { timeout: 5000 })
            .catch(() => null);
          await link.click({ modifiers: ['Meta'] }).catch(() => link.click());
          const newPage = await pagePromise;
          if (newPage) {
            await newPage
              .waitForLoadState('domcontentloaded', { timeout: 15000 })
              .catch(() => {});
            href = newPage.url();
            await newPage.close().catch(() => {});
          }
        }

        if (!href) {
          console.log(`   ⚠️  Could not resolve PDF URL from ${step.object}`);
          collector[collectorKey] = null;
          break;
        }

        // 2) Resolve to absolute URL
        const hrefAbs = href.startsWith('http')
          ? href
          : new URL(href, page.url()).toString();

        // 3) Download the binary with cookies + referer
        const ctx = page.context();
        const cookies = await ctx.cookies(hrefAbs);
        const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        const api = await request.newContext({
          extraHTTPHeaders: {
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
            Referer: page.url(),
            'User-Agent': 'Mozilla/5.0'
          }
        });

        const res = await api.get(hrefAbs);
        if (!res.ok()) {
          console.log(
            `   📄 GET ${hrefAbs} -> ${res.status()} ${res.statusText()}`
          );
          await api.dispose();
          collector[collectorKey] = null;
          break;
        }

        const buffer = await res.body();
        await api.dispose();

        // 4) Save to disk (supports your {{placeholders}})
        const resolvedPath =
          replaceDataPlaceholders(step.value, collector) || step.value;
        const dir = path.dirname(resolvedPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(resolvedPath, buffer);
        savedPath = resolvedPath;
        console.log(`   📄 PDF saved to ${resolvedPath}`);
      } catch (err: any) {
        console.log(`   📄 downloadPDF failed: ${err.message}`);
      } finally {
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
export async function executeStepList(
  page: Page, 
  steps: BaseStep[], 
  collected: Record<string, any>,
  onResult?: (result: Record<string, any>, index: number) => void | Promise<void>
): Promise<void> {
  console.log(`📝 Executing ${steps.length} step(s)`);
  for (const step of steps) {
    try {
      await executeStep(page, step, collected, onResult);
    } catch (err) {
      if (step.terminateonerror) {
        throw err;
      }
    }
  }
}
