import { Page } from 'playwright';
import { click } from './scraper';
import { TabTemplate, PaginationConfig } from './types';
import { locatorFor } from './utils';
import { executeStepList } from './step-executor';

// Import global types
import './global-types';

/**
 * Execute a tab.
 * 
 * @param {object} page - The page object.
 * @param {object} template - The template object.
 * @param {function} onResult - The onResult function.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {string} - The data.
 * @since v1.0.0
 * @company Framework Island
 */
export async function executeTab(
  page: Page,
  template: TabTemplate,
  onResult?: (result: Record<string, any>, index: number) => void | Promise<void>
): Promise<Record<string, any>[]> {
  const results: Record<string, any>[] = [];

  // Set global callback for immediate streaming
  if (onResult) {
    (global as any).onResultCallback = async (result: Record<string, any>, index: number) => {
      await onResult(result, index);
    };
  } else {
    (global as any).onResultCallback = null;
  }

  console.log(`=== TAB ${template.tab} ===`);

  // 1. Execute init steps once if provided
  if (template.initSteps && template.initSteps.length > 0) {
    console.log('--- Running initSteps ---');
    await executeStepList(page, template.initSteps, {});
  }

  const { pagination } = template;

  // Helper to run pagination action (next/scroll)
  async function runPagination(page: Page, pagination: PaginationConfig, logPrefix = ''): Promise<boolean> {
    if (pagination.strategy === 'next' && pagination.nextButton) {
      console.log(`${logPrefix}👉 Clicking next button`);
      try {
        // Check if next button exists and is enabled
        const nextButton = locatorFor(page, pagination.nextButton.object_type, pagination.nextButton.object);
        const count = await nextButton.count();
        
        if (count === 0) {
          console.log(`${logPrefix}👉 Next button not found - end of pagination`);
          return false;
        }
        
        const isDisabled = await nextButton.isDisabled().catch(() => false);
        if (isDisabled) {
          console.log(`${logPrefix}👉 Next button is disabled - end of pagination`);
          return false;
        }
        
        await click(page, pagination.nextButton.object_type, pagination.nextButton.object);
        if (pagination.nextButton.wait) {
          await page.waitForTimeout(pagination.nextButton.wait);
        } else {
          await page.waitForLoadState('networkidle');
        }
        return true;
      } catch (err) {
        // Next button missing – end of pagination
        console.log(`${logPrefix}👉 Next button click failed: ${err}`);
        return false;
      }
    } else if (pagination.strategy === 'scroll') {
      console.log(`${logPrefix}🖱️  Scrolling for pagination`);
      const offset = pagination.scroll?.offset ?? (await page.evaluate(() => window.innerHeight));
      await page.evaluate((y: number) => window.scrollBy(0, y), offset);
      const delay = pagination.scroll?.delay ?? 1000;
      await page.waitForTimeout(delay);
      return true;
    }
    return false;
  }

  // If paginateAllFirst is set, run all pagination actions first
  if (pagination && pagination.paginateAllFirst) {
    let pageIndex = 0;
    while (true) {
      if (pagination.maxPages && pageIndex >= pagination.maxPages) {
        break;
      }
      const paginated = await runPagination(page, pagination, '[paginateAllFirst] ');
      if (!paginated) break;
      pageIndex++;
    }
    // After all pagination, run perPageSteps once
    const collected: Record<string, any> = {};
    const stepsForPage = template.perPageSteps && template.perPageSteps.length > 0 ? template.perPageSteps : (template.steps ?? []);
    await executeStepList(page, stepsForPage, collected);
    if (Object.keys(collected).length > 0) {
      const itemKeys = Object.keys(collected).filter(key => key.startsWith('item_'));
      let resultIndex = 0;
      if (itemKeys.length > 0) {
        for (const key of itemKeys) {
          const itemData = collected[key];
          if (itemData && Object.keys(itemData).length > 0) {
            results.push(itemData);
            if (onResult && !(global as any).onResultCallback) {
              await onResult(itemData, resultIndex);
            }
            resultIndex++;
          }
        }
      } else {
        results.push(collected);
        if (onResult) {
          await onResult(collected, resultIndex);
        }
      }
    }
    return results;
  }

  // Default behavior (pagination per page)
  let pageIndex = 0;
  let resultIndex = 0;
  while (true) {
    console.log(`--- Page iteration ${pageIndex} ---`);
    const collected: Record<string, any> = {};

    // If paginationFirst is set, run pagination action before perPageSteps (except on first page)
    if (pagination && pagination.paginationFirst && pageIndex > 0) {
      const paginated = await runPagination(page, pagination, '[paginationFirst] ');
      if (!paginated) break;
    }

    const stepsForPage = template.perPageSteps && template.perPageSteps.length > 0 ? template.perPageSteps : (template.steps ?? []);

    await executeStepList(page, stepsForPage, collected);

    // after gathering data for this page
    if (Object.keys(collected).length > 0) {
      // Check if we have indexed items from foreach (like item_0, item_1, etc.)
      const itemKeys = Object.keys(collected).filter(key => key.startsWith('item_'));
      if (itemKeys.length > 0) {
        // Convert indexed items to separate result objects
        for (const key of itemKeys) {
          const itemData = collected[key];
          if (itemData && Object.keys(itemData).length > 0) {
            results.push(itemData);
            // Call callback if provided (but only if not already called by foreach)
            if (onResult && !(global as any).onResultCallback) {
              await onResult(itemData, resultIndex);
            }
            resultIndex++;
          }
        }
      } else {
        // Normal case - push the collected object as is
        results.push(collected);
        // Call callback if provided
        if (onResult) {
          await onResult(collected, resultIndex);
        }
        resultIndex++;
      }
    }

    // Handle pagination (if not using paginationFirst, or for loop control)
    if (!pagination) {
      console.log('No pagination configured, finishing tab');
      break; // no pagination -> done
    }

    pageIndex += 1;
    if (pagination.maxPages && pageIndex >= pagination.maxPages) {
      break;
    }

    // If paginationFirst is NOT set, run pagination action after perPageSteps (current behavior)
    if (!pagination.paginationFirst) {
      const paginated = await runPagination(page, pagination, '');
      if (!paginated) break;
    }
  }

  console.log(`=== Finished tab ${template.tab} - collected ${results.length} record(s) ===`);

  return results;
}
