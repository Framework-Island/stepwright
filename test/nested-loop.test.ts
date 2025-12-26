import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getBrowser, navigate } from '../src/scraper';
import { executeStep } from '../src/step-executor';
import { Browser, Page } from 'playwright';
import path from 'path';
import { BaseStep } from '../src/types';

describe('Nested Foreach Loops', () => {
  let browser: Browser;
  let page: Page;
  const testPagePath = path.join(__dirname, 'nested-loop.html');
  const testPageUrl = `file://${testPagePath}`;

  beforeAll(async () => {
    browser = await getBrowser({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should support nested loops and preserve parent context', async () => {
    await navigate(page, testPageUrl);

    const collector: Record<string, any> = {};
    const nestedStep: BaseStep = {
      id: 'loopOuter',
      action: 'foreach',
      object_type: 'xpath',
      object: "//div[@class='parent']",
      index_key: 'i',
      subSteps: [
        {
          id: 'meeting_title',
          action: 'data',
          object_type: 'xpath',
          object: ".//h1",
          key: 'meeting_title',
          data_type: 'text'
        },
        {
          id: 'loopInner',
          action: 'foreach',
          object_type: 'xpath',
          object: ".//div[@class='child']",
          index_key: 'j',
          subSteps: [
            {
              id: 'attachment_name',
              action: 'data',
              object_type: 'xpath',
              object: ".",
              key: 'attachment_name',
              data_type: 'text'
            }
          ]
        }
      ]
    };

    await executeStep(page, nestedStep, collector);

    // Verify structure
    // collector should have item_0 and item_1
    expect(collector.item_0).toBeDefined();
    expect(collector.item_1).toBeDefined();

    // item_0 should have meeting_title and item_0, item_1 (inner items)
    expect(collector.item_0.meeting_title).toBe('Meeting 1');
    expect(collector.item_0.item_0.attachment_name).toBe('Attachment 1.1');
    expect(collector.item_0.item_1.attachment_name).toBe('Attachment 1.2');

    // VERY IMPORTANT: Parent context (meeting_title) should be in inner items because we copy it now
    expect(collector.item_0.item_0.meeting_title).toBe('Meeting 1');
    expect(collector.item_0.item_1.meeting_title).toBe('Meeting 1');

    // Test flattening (implicitly happens in executeStep if we check final collector, 
    // but executeStep doesn't flatten the ROOT collector, it only flattens on emit or if we call it)
    
    // items should be available for Meeting 2 as well
    expect(collector.item_1.meeting_title).toBe('Meeting 2');
    expect(collector.item_1.item_0.attachment_name).toBe('Attachment 2.1');
    expect(collector.item_1.item_0.meeting_title).toBe('Meeting 2');
  });

  it('should correctly handle unique index placeholders {{i}} and {{j}}', async () => {
    await navigate(page, testPageUrl);

    const collector: Record<string, any> = {};
    const nestedStep: BaseStep = {
      id: 'loopOuter',
      action: 'foreach',
      object_type: 'xpath',
      object: "//div[@class='parent']",
      index_key: 'i',
      subSteps: [
        {
          id: 'loopInner',
          action: 'foreach',
          object_type: 'xpath',
          object: ".//div[@class='child']",
          index_key: 'j',
          subSteps: [
            {
              id: 'combined',
              action: 'data',
              object_type: 'xpath',
              // Use both indices in a locator (hypothetical)
              object: "//div[@id='p{{i}}c{{j}}']",
              key: 'val',
              data_type: 'text'
            }
          ]
        }
      ]
    };

    // We can't easily run this because the elements don't exist, 
    // but we can verify that the sub-steps are cloned with correct replacements.
    // Instead of executeStep, let's manually test cloneStepWithIndex.
    
    const { cloneStepWithIndex } = await import('../src/utils');
    
    // Outer loop idx 0
    const outerCloned = cloneStepWithIndex(nestedStep.subSteps![0], 0, 'i');
    
    // Now outerCloned is the inner loop. Its object should NOT have i replaced (it doesn't use it)
    // But its subSteps should have had {{i}} replaced if they used it.
    const innerLoop = outerCloned;
    const dataStep = innerLoop.subSteps![0];
    
    expect(dataStep.object).toBe("//div[@id='p0c{{j}}']");
    
    // Inner loop idx 5
    const innerCloned = cloneStepWithIndex(dataStep, 5, 'j');
    expect(innerCloned.object).toBe("//div[@id='p0c5']");
  });
});
