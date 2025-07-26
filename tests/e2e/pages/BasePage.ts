/** @format */

import { Page, Locator, expect } from "@playwright/test";

/**
 * Base Page Object Model class providing common page interactions and utilities
 * All page objects should extend this class to inherit common functionality
 */
export class BasePage {
  protected readonly page: Page;
  protected readonly baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = process.env.BASE_URL || "http://localhost:4173";
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string = "/"): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for an element to be visible with retry logic
   */
  async waitForElement(
    selector: string,
    options: { timeout?: number; visible?: boolean } = {}
  ): Promise<Locator> {
    const { timeout = 5000, visible = true } = options;
    const element = this.page.locator(selector);

    if (visible) {
      await element.waitFor({ state: "visible", timeout });
    } else {
      await element.waitFor({ state: "hidden", timeout });
    }

    return element;
  }

  /**
   * Click an element with retry logic and wait for stability
   */
  async clickElement(
    selector: string,
    options: { timeout?: number; force?: boolean } = {}
  ): Promise<void> {
    const { timeout = 5000, force = false } = options;
    const element = await this.waitForElement(selector, { timeout });

    // Wait for element to be stable before clicking
    await element.waitFor({ state: "attached" });
    await this.page.waitForTimeout(100); // Small delay for stability

    await element.click({ force, timeout });
  }

  /**
   * Fill input field with text
   */
  async fillInput(
    selector: string,
    text: string,
    options: { clear?: boolean; timeout?: number } = {}
  ): Promise<void> {
    const { clear = true, timeout = 5000 } = options;
    const element = await this.waitForElement(selector, { timeout });

    if (clear) {
      await element.clear();
    }

    await element.fill(text);
  }

  /**
   * Get text content from an element
   */
  async getElementText(
    selector: string,
    options: { timeout?: number } = {}
  ): Promise<string> {
    const { timeout = 5000 } = options;
    const element = await this.waitForElement(selector, { timeout });
    const text = await element.textContent();
    return text?.trim() || "";
  }

  /**
   * Get attribute value from an element
   */
  async getElementAttribute(
    selector: string,
    attribute: string,
    options: { timeout?: number } = {}
  ): Promise<string | null> {
    const { timeout = 5000 } = options;
    const element = await this.waitForElement(selector, { timeout });
    return await element.getAttribute(attribute);
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(
    selector: string,
    options: { timeout?: number } = {}
  ): Promise<boolean> {
    const { timeout = 2000 } = options;
    try {
      const element = this.page.locator(selector);
      await element.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if element is enabled
   */
  async isElementEnabled(
    selector: string,
    options: { timeout?: number } = {}
  ): Promise<boolean> {
    const { timeout = 2000 } = options;
    try {
      const element = await this.waitForElement(selector, { timeout });
      return await element.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Wait for element to contain specific text
   */
  async waitForText(
    selector: string,
    expectedText: string,
    options: { timeout?: number; exact?: boolean } = {}
  ): Promise<void> {
    const { timeout = 5000, exact = false } = options;
    const element = this.page.locator(selector);

    if (exact) {
      await expect(element).toHaveText(expectedText, { timeout });
    } else {
      await expect(element).toContainText(expectedText, { timeout });
    }
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForURL(
    pattern: string | RegExp,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const { timeout = 5000 } = options;
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Take a screenshot with automatic naming
   */
  async takeScreenshot(name?: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const screenshotName = name
      ? `${name}-${timestamp}`
      : `screenshot-${timestamp}`;
    await this.page.screenshot({
      path: `test-results/${screenshotName}.png`,
      fullPage: true,
    });
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Hover over an element
   */
  async hoverElement(
    selector: string,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const { timeout = 5000 } = options;
    const element = await this.waitForElement(selector, { timeout });
    await element.hover();
  }

  /**
   * Press a key
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(options: { timeout?: number } = {}): Promise<void> {
    const { timeout = 5000 } = options;
    await this.page.waitForLoadState("networkidle", { timeout });
  }

  /**
   * Get all elements matching selector
   */
  async getAllElements(selector: string): Promise<Locator[]> {
    const elements = this.page.locator(selector);
    const count = await elements.count();
    const locators: Locator[] = [];

    for (let i = 0; i < count; i++) {
      locators.push(elements.nth(i));
    }

    return locators;
  }

  /**
   * Wait for element count to match expected value
   */
  async waitForElementCount(
    selector: string,
    expectedCount: number,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const { timeout = 5000 } = options;
    await expect(this.page.locator(selector)).toHaveCount(expectedCount, {
      timeout,
    });
  }

  /**
   * Check for console errors on the page
   */
  async getConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];

    this.page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    return errors;
  }

  /**
   * Reload the current page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Get current page URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Execute JavaScript in the browser context
   */
  async evaluateScript<T>(
    script: string | Function,
    ...args: any[]
  ): Promise<T> {
    return await this.page.evaluate(script, ...args);
  }

  /**
   * Wait for a custom condition to be met
   */
  async waitForCondition(
    condition: () => Promise<boolean> | boolean,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.page.waitForTimeout(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Assert element is visible
   */
  async assertElementVisible(
    selector: string,
    message?: string
  ): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element, message).toBeVisible();
  }

  /**
   * Assert element contains text
   */
  async assertElementText(
    selector: string,
    expectedText: string,
    options: { exact?: boolean } = {}
  ): Promise<void> {
    const { exact = false } = options;
    const element = this.page.locator(selector);

    if (exact) {
      await expect(element).toHaveText(expectedText);
    } else {
      await expect(element).toContainText(expectedText);
    }
  }

  /**
   * Assert element is enabled/disabled
   */
  async assertElementEnabled(
    selector: string,
    enabled: boolean = true
  ): Promise<void> {
    const element = this.page.locator(selector);

    if (enabled) {
      await expect(element).toBeEnabled();
    } else {
      await expect(element).toBeDisabled();
    }
  }
}
