import { test, expect } from '@playwright/test';

test.describe('Authentication Flow E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should display login page', async ({ page }) => {
        // Check for login form elements - using id selectors
        await expect(page.locator('#username')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should login with valid credentials', async ({ page }) => {
        // Fill login form using id selectors
        await page.fill('#username', 'testuser999');
        await page.fill('#password', 'test999');

        // Click login button
        await page.click('button[type="submit"]');

        // Wait for redirect to chat page
        await page.waitForURL('**/chat', { timeout: 10000 });

        // Verify we're on chat page
        await expect(page.url()).toContain('/chat');
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.fill('#username', 'wronguser');
        await page.fill('#password', 'wrongpass');

        await page.click('button[type="submit"]');

        // Wait for error message (red background class)
        await expect(page.locator('.bg-red-500\\/10')).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to register page', async ({ page }) => {
        // Click sign up link
        await page.click('a:has-text("Sign up")');

        // Should go to register page
        await expect(page).toHaveURL(/register/);
    });

    test('should show connection status on login', async ({ page }) => {
        // Check for connection indicator on login page
        const connectedText = page.getByText(/connected to server|connected/i);
        const connectingText = page.getByText(/connecting/i);

        // Wait for either to appear
        await page.waitForTimeout(2000);

        // At least one should be visible
        const hasConnection = await connectedText.count() > 0 || await connectingText.count() > 0;
        expect(hasConnection).toBe(true);
    });
});

test.describe('Chat UI E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('#username', 'testuser999');
        await page.fill('#password', 'test999');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/chat', { timeout: 10000 });
    });

    test('should display chat interface after login', async ({ page }) => {
        // Check for chat elements
        await expect(page.url()).toContain('/chat');

        // Should have message input
        const messageInput = page.locator('input[placeholder*="Type a message" i]');
        await expect(messageInput).toBeVisible({ timeout: 5000 });
    });

    test('should show connection status in chat', async ({ page }) => {
        // Look for connection status in chat header
        await page.waitForTimeout(2000);

        // Check for "Connected" text in chat
        const connectedStatus = page.getByText('Connected');
        const connectingStatus = page.getByText('Connecting...');

        const hasStatus = await connectedStatus.isVisible() || await connectingStatus.isVisible();
        expect(hasStatus).toBe(true);
    });

    test('should send a message', async ({ page }) => {
        // Wait for page to fully load
        await page.waitForTimeout(2000);

        // Find message input
        const messageInput = page.locator('input[placeholder*="Type a message" i]');
        await expect(messageInput).toBeVisible({ timeout: 5000 });

        const testMessage = `E2E Test ${Date.now()}`;

        // Type message
        await messageInput.fill(testMessage);

        // Press Enter to send
        await messageInput.press('Enter');

        // Wait longer for message to appear
        await page.waitForTimeout(2000);

        // Message should appear somewhere in the page
        const messageExists = await page.getByText(testMessage).count() > 0;
        expect(messageExists).toBe(true);
    });

    test('should display logout button', async ({ page }) => {
        // Look for logout button
        const logoutButton = page.getByRole('button', { name: /logout/i });
        await expect(logoutButton).toBeVisible({ timeout: 3000 });
    });

    test('should show username in header', async ({ page }) => {
        // Username should be displayed
        await page.waitForTimeout(1000);
        const usernameElement = page.getByText('testuser999');
        await expect(usernameElement).toBeVisible({ timeout: 3000 });
    });
});

test.describe('Registration Flow E2E Tests', () => {
    test('should display registration page', async ({ page }) => {
        await page.goto('/register');

        // Check for registration form elements
        await expect(page.locator('#username')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.getByRole('button', { name: /sign up|register/i })).toBeVisible();
    });

    test('should navigate to login from register', async ({ page }) => {
        await page.goto('/register');

        // Click sign in link
        await page.click('a:has-text("Sign in")');

        // Should go to login page
        await expect(page).toHaveURL(/login/);
    });
});
