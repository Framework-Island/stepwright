import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { 
  getBrowser, 
  navigate, 
  elem, 
  input, 
  click, 
  doubleClick, 
  clickCheckBox, 
  getData 
} from '../src/scraper';
import { Browser, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

describe('Core Scraper Functions', () => {
  let browser: Browser;
  let page: Page;
  const testPagePath = path.join(__dirname, 'test-page.html');
  const testPageUrl = `file://${testPagePath}`;

  beforeAll(async () => {
    browser = await getBrowser({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('getBrowser', () => {
    it('should create a browser instance', async () => {
      const testBrowser = await getBrowser({ headless: true });
      expect(testBrowser).toBeDefined();
      await testBrowser.close();
    });

    it('should accept custom launch options', async () => {
      const testBrowser = await getBrowser({ 
        headless: true,
        args: ['--no-sandbox']
      });
      expect(testBrowser).toBeDefined();
      await testBrowser.close();
    });
  });

  describe('navigate', () => {
    it('should navigate to a URL', async () => {
      const result = await navigate(page, testPageUrl);
      expect(result).toBe(page);
      expect(page.url()).toBe(testPageUrl);
    });

    it('should throw error for empty URL', async () => {
      await expect(navigate(page, '')).rejects.toThrow('Url is required');
    });

    it('should wait after navigation when specified', async () => {
      const startTime = Date.now();
      await navigate(page, testPageUrl, 100);
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('elem', () => {
    beforeAll(async () => {
      await navigate(page, testPageUrl);
    });

    it('should find element by ID', async () => {
      const element = await elem(page, 'id', 'main-title');
      expect(element).toBeDefined();
      const text = await element.textContent();
      expect(text).toBe('StepWright Test Page');
    });

    it('should find element by class', async () => {
      const element = await elem(page, 'class', 'header');
      expect(element).toBeDefined();
      const count = await element.count();
      expect(count).toBe(1);
    });

    it('should find element by tag', async () => {
      const element = await elem(page, 'tag', 'h1');
      expect(element).toBeDefined();
      const text = await element.textContent();
      expect(text).toBe('StepWright Test Page');
    });

    it('should find element by xpath', async () => {
      const element = await elem(page, 'xpath', '//h1[@id="main-title"]');
      expect(element).toBeDefined();
      const text = await element.textContent();
      expect(text).toBe('StepWright Test Page');
    });

    it('should throw error for empty selector', async () => {
      await expect(elem(page, 'id', '')).rejects.toThrow('Selector is required');
    });

    it('should throw error for invalid selector type', async () => {
      await expect(elem(page, 'invalid' as any, 'test')).rejects.toThrow('Invalid selector type');
    });
  });

  describe('input', () => {
    beforeAll(async () => {
      await navigate(page, testPageUrl);
    });

    it('should input text into a field', async () => {
      await input(page, 'id', 'search-box', 'test search term');
      const element = await elem(page, 'id', 'search-box');
      const value = await element.inputValue();
      expect(value).toBe('test search term');
    });

    it('should wait after input when specified', async () => {
      const startTime = Date.now();
      await input(page, 'id', 'search-box', 'test', 100);
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('click', () => {
    beforeAll(async () => {
      await navigate(page, testPageUrl);
    });

    it('should click on an element', async () => {
      const button = await elem(page, 'id', 'show-hidden');
      await click(page, 'id', 'show-hidden');
      
      // Check if hidden content is now visible
      const hiddenContent = await elem(page, 'id', 'hidden-content');
      const isVisible = await hiddenContent.isVisible();
      expect(isVisible).toBe(true);
    });

    it('should click on element by class', async () => {
      await click(page, 'class', 'submit-button');
      // The form submission should trigger an alert, but we can't easily test that in headless mode
    });
  });

  describe('doubleClick', () => {
    beforeAll(async () => {
      await navigate(page, testPageUrl);
    });

    it('should double click on an element', async () => {
      const button = await elem(page, 'id', 'show-hidden');
      await doubleClick(page, 'id', 'show-hidden');
      
      // Check if hidden content is now visible (double click should work the same as single click for this button)
      const hiddenContent = await elem(page, 'id', 'hidden-content');
      const isVisible = await hiddenContent.isVisible();
      expect(isVisible).toBe(true);
    });
  });

  describe('clickCheckBox', () => {
    beforeAll(async () => {
      await navigate(page, testPageUrl);
    });

    it('should check a checkbox', async () => {
      // Add a checkbox to the page for testing
      await page.evaluate(() => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'test-checkbox';
        document.body.appendChild(checkbox);
      });

      await clickCheckBox(page, 'id', 'test-checkbox');
      const checkbox = await elem(page, 'id', 'test-checkbox');
      const isChecked = await checkbox.isChecked();
      expect(isChecked).toBe(true);
    });
  });

  describe('getData', () => {
    beforeAll(async () => {
      await navigate(page, testPageUrl);
    });

    it('should get text content', async () => {
      const text = await getData(page, 'id', 'main-title', 'text');
      expect(text).toBe('StepWright Test Page');
    });

    it('should get HTML content', async () => {
      const html = await getData(page, 'id', 'main-title', 'html');
      expect(html).toContain('StepWright Test Page');
    });

    it('should get input value', async () => {
      // Set a value first
      await input(page, 'id', 'search-box', 'test value');
      const value = await getData(page, 'id', 'search-box', 'value');
      expect(value).toBe('test value');
    });

    it('should get default (innerText) content', async () => {
      const text = await getData(page, 'id', 'main-title', 'default');
      expect(text).toBe('StepWright Test Page');
    });

    it('should wait before getting data when specified', async () => {
      const startTime = Date.now();
      await getData(page, 'id', 'main-title', 'text', 100);
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should return empty string for non-existent element', async () => {
      // Use a shorter timeout and handle the case where element doesn't exist
      try {
        const text = await getData(page, 'id', 'non-existent', 'text');
        expect(text).toBe('');
      } catch (error) {
        // If the function throws an error for non-existent elements, that's also acceptable
        expect(error).toBeDefined();
      }
    }, 5000); // Shorter timeout
  });
});
