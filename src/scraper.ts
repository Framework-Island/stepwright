import { Browser, LaunchOptions, Page, Locator, chromium } from 'playwright';
import { SelectorType } from './types';

/**
 * Get the browser and page.
 * 
 * @param {object} params - The browser params.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {object} - The browser.
 * @since v1.0.0
 * @company Framework Island
 */
const getBrowser = async (params: LaunchOptions = {}): Promise<Browser> => {
    const browser = await chromium.launch(params);
    return browser;
}

/**
 * Wait for the given time.
 * 
 * @param {number} wait - The time to wait.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {object} - The browser and page.
 * @since v1.0.0
 * @company Framework Island
 */
const _wait = (wait: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, wait));

/**
 * Navigate to the given url.
 * 
 * @param {object} page - The page object.
 * @param {string} url - The url to navigate.
 * @param {number} wait - The time to wait.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {object} - The page object.
 * @since v1.0.0
 * @company Framework Island
 */
const navigate = async (page: Page, url: string, wait: number = 0): Promise<Page> => {
    // validate the url.
    if (!url)
        throw new Error('Url is required');
    // navigate to the url.
    await page.goto(url, { waitUntil: 'networkidle' });

    // wait for the given time.
    if (wait > 0) await _wait(wait);

    // return the page.
    return page;
}

/**
 * Get the element.
 * 
 * @param {object} page - The page object.
 * @param {string} type - The type of selector.
 * @param {string} selector - The selector.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {object} - The element.
 * @since v1.0.0
 * @company Framework Island
 */
const elem = async (
    page: Page,
    type: SelectorType,
    selector: string,
    wait: number = 0
): Promise<Locator> => {
    let element: Locator | Page = page;
    if (!selector)
        throw new Error('Selector is required');
    // ID, CLASS, TAG, XPATH, and, Attribute.
    switch (type) {
        case 'id':
            element = page.locator(`#${selector}`);
            break;
        case 'class':
            element = page.locator(`.${selector}`);
            break;
        case 'tag':
            element = page.locator(selector);
            break;
        case 'xpath':
            element = page.locator(`xpath=${selector}`);
            break;
        default:
            throw new Error('Invalid selector type');
    }
    if (wait > 0) {
        await page.waitForTimeout(wait);
    }
    if (!element) {
        throw new Error('Element not found');
    }

    // Type assertion since we know it's a Locator after processing
    return element as Locator;
}

/**
 * Input the value in the given selector.
 * 
 * @param {object} page - The page object.
 * @param {string} type - The type of selector.
 * @param {string} selector - The selector.
 * @param {string} value - The value to input.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {object} - The page object.
 * @since v1.0.0
 * @company Framework Island
 */
const input = async (
    page: Page,
    type: SelectorType,
    selector: string,
    value: string,
    wait: number = 0
): Promise<Page> => {
    const element = await elem(page, type, selector, wait);
    await element.type(value);
    return page;
}

/**
 * Click on the given selector.
 * 
 * @param {object} page - The page object.
 * @param {string} type - The type of selector.
 * @param {string} selector - The selector.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {object} - The page object.
 * @since v1.0.0
 * @company Framework Island
 */
const click = async (
    page: Page,
    type: SelectorType,
    selector: string
): Promise<Page> => {
    const element = await elem(page, type, selector);
    await element.click();
    return page;
}

/**
 * Double click on the given selector.
 * 
 * @param {object} page - The page object.
 * @param {string} type - The type of selector.
 * @param {string} selector - The selector.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {object} - The page object.
 * @since v1.0.0
 * @company Framework Island
 */
const doubleClick = async (
    page: Page,
    type: SelectorType,
    selector: string
): Promise<Page> => {
    const element = await elem(page, type, selector);
    await element.dblclick();
    return page;
}

/**
 * Click on the checkbox.
 * 
 * @param {object} page - The page object.
 * @param {string} type - The type of selector.
 * @param {string} selector - The selector.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {object} - The page object.
 * @since v1.0.0
 * @company Framework Island
 */
const clickCheckBox = async (
    page: Page,
    type: SelectorType,
    selector: string
): Promise<Page> => {
    const element = await elem(page, type, selector);
    await element.check();
    return page;
}

/**
 * Get the data from the given selector.
 * 
 * @param {object} page - The page object.
 * @param {string} type - The type of selector.
 * @param {string} selector - The selector.
 * @param {string} data_type - The type of data to get.
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * 
 * @returns {string} - The data.
 * @since v1.0.0
 * @company Framework Island
 */
const getData = async (
    page: Page,
    type: SelectorType,
    selector: string,
    data_type: 'text' | 'html' | 'value' | 'default' = 'default',
    wait: number = 0
): Promise<string> => {
    try {
        const element = await elem(page, type, selector, wait);
        
        // Check if element exists before trying to get data
        const count = await element.count();
        if (count === 0) {
            return '';
        }
        
        switch (data_type) {
            case 'text':
                return (await element.textContent()) ?? '';
            case 'html':
                return await element.innerHTML();
            case 'value':
                return await element.inputValue();
            default:
                return await element.innerText();
        }
    } catch (error) {
        // Return empty string if element is not found
        return '';
    }
};

export {
    getBrowser,
    navigate,
    elem,
    input,
    click,
    doubleClick,
    clickCheckBox,
    getData,
};
