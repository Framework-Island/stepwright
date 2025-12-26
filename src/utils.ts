import { Page, Locator } from 'playwright';
import { SelectorType } from './types';

// ----------------------------
// Internal helpers
// ----------------------------

/**
 * Replace index placeholders in a string.
 * 
 * @param {string} text - The text to replace placeholders in.
 * @param {number} i - The index to replace placeholders with.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {string} - The text with placeholders replaced.
 * @since v1.0.0
 * @company Framework Island
 */
export function replaceIndexPlaceholders(text: string | undefined, i: number, char: string = 'i'): string | undefined {
  if (!text) return text;
  const regex = new RegExp(`\\{\\{\\s*${char}\\s*\\}\\}`, 'g');
  const plus1Regex = new RegExp(`\\{\\{\\s*${char}_plus1\\s*\\}\\}`, 'g');
  return text.replace(regex, i.toString()).replace(plus1Regex, (i + 1).toString());
}

/**
 * Replace data placeholders like {{key}} with values from collector.
 * 
 * @param {string} text - The text to replace placeholders in.
 * @param {object} collector - The collector object.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {string} - The text with placeholders replaced.
 * @since v1.0.0
 * @company Framework Island
 */
export function replaceDataPlaceholders(text: string | undefined, collector: Record<string, any>): string | undefined {
  if (!text) return text;
  let result = text;
  
  // Replace any {{key}} placeholders with values from collector
  const placeholderRegex = /\{\{\s*([^}]+)\s*\}\}/g;
  result = result.replace(placeholderRegex, (match, key) => {
    const value = collector[key];
    if (value !== undefined && value !== null) {
      // Clean the value for filename use (remove special chars, trim whitespace)
      return String(value).trim().replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_');
    }
    return match; // Keep original if not found
  });
  
  return result;
}

/**
 * Get the locator for the given selector.
 * 
 * @param {object} page - The page object.
 * @param {string} type - The type of selector.
 * @param {string} selector - The selector.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {object} - The locator.
 * @since v1.0.0
 * @company Framework Island
 */
export function locatorFor(page: Page, type: SelectorType | undefined, selector: string): Locator {
  if (!type) return page.locator(selector);
  switch (type) {
    case 'id':
      return page.locator(`#${selector}`);
    case 'class':
      return page.locator(`.${selector}`);
    case 'tag':
      return page.locator(selector);
    case 'xpath':
      return page.locator(`xpath=${selector}`);
    default:
      return page.locator(selector);
  }
}

/**
 * Clone a step and apply index placeholders recursively.
 * 
 * @param {object} step - The step object.
 * @param {number} idx - The index to replace placeholders with.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {object} - The cloned step.
 * @since v1.0.0
 * @company Framework Island
 */
export function cloneStepWithIndex(step: import('./types').BaseStep, idx: number, char: string = 'i'): import('./types').BaseStep {
  const cloned: import('./types').BaseStep = { ...step };
  cloned.object = replaceIndexPlaceholders(cloned.object, idx, char);
  cloned.value = replaceIndexPlaceholders(cloned.value, idx, char);
  cloned.key = replaceIndexPlaceholders(cloned.key, idx, char);
  if (cloned.subSteps && cloned.subSteps.length > 0) {
    cloned.subSteps = cloned.subSteps.map((sub) => cloneStepWithIndex(sub, idx, char));
  }
  return cloned;
}

/**
 * Flatten nested foreach results into an array.
 * 
 * @param {object} item - Dictionary that may contain nested item_* keys.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {any} - Either a flattened array of items or the original item.
 * @since v1.0.0
 * @company Framework Island
 */
export function flattenNestedForeachResults(item: Record<string, any>): any {
  // Extract context keys (keys NOT starting with item_)
  const context: Record<string, any> = {};
  Object.keys(item).forEach(k => {
    if (!k.startsWith('item_')) {
      context[k] = item[k];
    }
  });

  // Check if item contains nested item_* keys (from nested foreach)
  const nestedItemKeys = Object.keys(item).filter(k => k.startsWith('item_'));
  if (nestedItemKeys.length > 0) {
    // Flatten nested items into an array
    const flattenedItems: any[] = [];
    const sortedKeys = nestedItemKeys.sort((a, b) => {
      const aIdx = parseInt(a.split('_')[1]);
      const bIdx = parseInt(b.split('_')[1]);
      return aIdx - bIdx;
    });

    for (const k of sortedKeys) {
      if (item[k] && Object.keys(item[k]).length > 0) {
        // Merge context into the nested item
        flattenedItems.push({ ...context, ...item[k] });
      }
    }
    return flattenedItems;
  } else {
    // No nested items, return item with context (already in item)
    return item;
  }
}
