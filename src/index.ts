// ----------------------------
// Public API
// ----------------------------

import { getBrowser } from './scraper';
import { TabTemplate, RunOptions } from './types';
import { executeTab } from './tab-executor';

// Re-export types
export * from './types';

// Re-export utility functions
export * from './utils';

// Re-export step executor functions
export * from './step-executor';

// Re-export tab executor functions
export * from './tab-executor';

/**
 * Run the scraper.
 * 
 * @param {object} page - The page object.
 * @param {object} options - The options object.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {object} - The data.
 * @since v1.0.0
 * @company Framework Island
 */
export async function runScraper(
  templates: TabTemplate[],
  options: RunOptions = {}
): Promise<Record<string, any>[]> {
  const browser = await getBrowser(options.browser || { headless: true });
  const context = await browser.newContext();

  const allResults: Record<string, any>[] = [];

  // Run each tab sequentially – adjust to parallel if desired
  for (const tmpl of templates) {
    const page = await context.newPage();
    try {
      const tabResults = await executeTab(page, tmpl, options.onResult);
      allResults.push(...tabResults);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  return allResults;
}

/**
 * Run the scraper with a callback. This is a simpler alternative to async generators for real-time processing.
 * 
 * @param {object} page - The page object.
 * @param {function} onResult - The onResult function.
 * @param {object} options - The options object.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {void} - Nothing.
 * @since v1.0.0
 * @company Framework Island
 */
export async function runScraperWithCallback(
  templates: TabTemplate[],
  onResult: (result: Record<string, any>, index: number) => void | Promise<void>,
  options: RunOptions = {}
): Promise<void> {
  const browser = await getBrowser(options.browser || { headless: true });
  const context = await browser.newContext();

  try {
    // Run each tab sequentially
    for (const tmpl of templates) {
      const page = await context.newPage();
      try {
        await executeTab(page, tmpl, onResult);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
