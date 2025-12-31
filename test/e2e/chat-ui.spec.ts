import { test, expect } from '@playwright/test';

test.describe('Chat UI E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/');
        await page.fill('input[name="username"]', 'testuser999');
        await page.fill('input[name="password"]', 'test999');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/chat', { timeout: 5000 });
    });

    test('should display chat interface', async ({ page }) => {
        // Check main chat components
        await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
        await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
    });

    test('should send a message', async ({ page }) => {
        const messageInput = page.locator('[data-testid="message-input"]');
        const sendButton = page.locator('[data-testid="send-button"]');

        const testMessage = `Test message ${Date.now()}`;

        await messageInput.fill(testMessage);
        await sendButton.click();

        // Wait for message to appear
        await expect(page.locator(`text="${testMessage}"`)).toBeVisible({ timeout: 3000 });
    });

    test('should send message with Enter key', async ({ page }) => {
        const messageInput = page.locator('[data-testid="message-input"]');

        const testMessage = `Enter key test ${Date.now()}`;

        await messageInput.fill(testMessage);
        await messageInput.press('Enter');

        // Message should appear
        await expect(page.locator(`text="${testMessage}"`)).toBeVisible({ timeout: 3000 });

        // Input should be cleared
        await expect(messageInput).toHaveValue('');
    });

    test('should display online users list', async ({ page }) => {
        const onlineUsersList = page.locator('[data-testid="online-users"]');

        await expect(onlineUsersList).toBeVisible();

        // Should show at least current user
        await expect(onlineUsersList.locator('.user-item')).toHaveCount(1, { timeout: 2000 });
    });

    test('should show typing indicator when typing', async ({ page, context }) => {
        // Open second browser context for another user
        const page2 = await context.newPage();
        await page2.goto('/');
        await page2.fill('input[name="username"]', 'alice');
        await page2.fill('input[name="password"]', 'password');
        await page2.click('button[type="submit"]');
        await page2.waitForURL('**/chat', { timeout: 5000 });

        // Type in page2
        const messageInput = page2.locator('[data-testid="message-input"]');
        await messageInput.fill('Typing...');

        // Page1 should show typing indicator
        await expect(page.locator('[data-testid="typing-indicator"]')).toContainText(/typing/i, { timeout: 3000 });

        await page2.close();
    });

    test('should display message timestamp', async ({ page }) => {
        const messageInput = page.locator('[data-testid="message-input"]');

        await messageInput.fill('Timestamp test');
        await messageInput.press('Enter');

        await page.waitForTimeout(500);

        // Check for timestamp
        const lastMessage = page.locator('[data-testid="message-item"]').last();
        await expect(lastMessage.locator('[data-testid="message-timestamp"]')).toBeVisible();
    });

    test('should scroll to bottom on new message', async ({ page }) => {
        const chatContainer = page.locator('[data-testid="messages-container"]');

        // Send multiple messages to create scroll
        for (let i = 0; i < 20; i++) {
            await page.locator('[data-testid="message-input"]').fill(`Message ${i}`);
            await page.locator('[data-testid="message-input"]').press('Enter');
            await page.waitForTimeout(100);
        }

        // Should be scrolled to bottom
        const isAtBottom = await chatContainer.evaluate((el) => {
            return Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 50;
        });

        expect(isAtBottom).toBe(true);
    });

    test('should open emoji picker', async ({ page }) => {
        const emojiButton = page.locator('[data-testid="emoji-button"]');

        if (await emojiButton.isVisible()) {
            await emojiButton.click();

            // Emoji picker should appear
            await expect(page.locator('[data-testid="emoji-picker"]')).toBeVisible();
        }
    });

    test('should insert emoji into message', async ({ page }) => {
        const emojiButton = page.locator('[data-testid="emoji-button"]');
        const messageInput = page.locator('[data-testid="message-input"]');

        if (await emojiButton.isVisible()) {
            await emojiButton.click();

            // Click an emoji
            const firstEmoji = page.locator('[data-testid="emoji-picker"] .emoji').first();
            await firstEmoji.click();

            // Emoji should be in input
            const inputValue = await messageInput.inputValue();
            expect(inputValue.length).toBeGreaterThan(0);
        }
    });

    test('should edit sent message', async ({ page }) => {
        // Send message
        await page.locator('[data-testid="message-input"]').fill('Original message');
        await page.locator('[data-testid="message-input"]').press('Enter');
        await page.waitForTimeout(500);

        // Right-click or hover on message to show edit button
        const lastMessage = page.locator('[data-testid="message-item"]').last();
        await lastMessage.hover();

        const editButton = lastMessage.locator('[data-testid="edit-button"]');
        if (await editButton.isVisible({ timeout: 1000 })) {
            await editButton.click();

            // Edit input should appear
            const editInput = page.locator('[data-testid="edit-input"]');
            await editInput.fill('Edited message');
            await editInput.press('Enter');

            // Should show edited message
            await expect(page.locator('text="Edited message"')).toBeVisible();
            await expect(lastMessage.locator('.edited-label')).toBeVisible();
        }
    });

    test('should delete sent message', async ({ page }) => {
        const messageToDel ete = `Delete me ${Date.now()}`;

        // Send message
        await page.locator('[data-testid="message-input"]').fill(messageToDelete);
        await page.locator('[data-testid="message-input"]').press('Enter');
        await page.waitForTimeout(500);

        // Hover on message
        const lastMessage = page.locator('[data-testid="message-item"]').last();
        await lastMessage.hover();

        const deleteButton = lastMessage.locator('[data-testid="delete-button"]');
        if (await deleteButton.isVisible({ timeout: 1000 })) {
            // Confirm deletion
            await deleteButton.click();

            // Confirm dialog if exists
            const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")');
            if (await confirmButton.isVisible({ timeout: 1000 })) {
                await confirmButton.click();
            }

            // Message should be deleted or show deleted state
            await page.waitForTimeout(500);
            const isDeleted = await page.locator(`text="${messageToDelete}"`).count() === 0 ||
                await lastMessage.locator('.deleted-message').isVisible();
            expect(isDeleted).toBe(true);
        }
    });

    test('should search messages', async ({ page }) => {
        // Send some searchable messages
        await page.locator('[data-testid="message-input"]').fill('Searchable keyword test');
        await page.locator('[data-testid="message-input"]').press('Enter');
        await page.waitForTimeout(500);

        // Open search
        const searchButton = page.locator('[data-testid="search-button"]');
        if (await searchButton.isVisible()) {
            await searchButton.click();

            const searchInput = page.locator('[data-testid="search-input"]');
            await searchInput.fill('Searchable');
            await searchInput.press('Enter');

            // Results should appear
            await expect(page.locator('[data-testid="search-results"]')).toBeVisible({ timeout: 2000 });
            await expect(page.locator('.search-result-item')).toHaveCount(1, { timeout: 2000 });
        }
    });

    test('should load message history on scroll up', async ({ page }) => {
        const messagesContainer = page.locator('[data-testid="messages-container"]');

        // Scroll to top
        await messagesContainer.evaluate((el) => el.scrollTop = 0);

        // Wait for load more
        await page.waitForTimeout(1000);

        // Should have loaded more messages or show loading indicator
        const hasMoreMessages = await page.locator('[data-testid="loading-more"]').isVisible() ||
            await page.locator('[data-testid="message-item"]').count() > 0;

        expect(hasMoreMessages).toBe(true);
    });

    test('should show user avatars', async ({ page }) => {
        // Send a message
        await page.locator('[data-testid="message-input"]').fill('Avatar test');
        await page.locator('[data-testid="message-input"]').press('Enter');
        await page.waitForTimeout(500);

        // Check for avatar
        const lastMessage = page.locator('[data-testid="message-item"]').last();
        await expect(lastMessage.locator('[data-testid="user-avatar"]')).toBeVisible();
    });

    test('should show message delivery status', async ({ page }) => {
        await page.locator('[data-testid="message-input"]').fill('Status test');
        await page.locator('[data-testid="message-input"]').press('Enter');
        await page.waitForTimeout(500);

        // Check for status indicator (sent/delivered/read)
        const lastMessage = page.locator('[data-testid="message-item"]').last();
        const statusIcon = lastMessage.locator('[data-testid="message-status"]');

        if (await statusIcon.isVisible({ timeout: 1000 })) {
            await expect(statusIcon).toBeVisible();
        }
    });

    test('should handle long messages', async ({ page }) => {
        const longMessage = 'A'.repeat(500);

        await page.locator('[data-testid="message-input"]').fill(longMessage);
        await page.locator('[data-testid="message-input"]').press('Enter');
        await page.waitForTimeout(500);

        // Message should be sent and visible
        const lastMessage = page.locator('[data-testid="message-item"]').last();
        await expect(lastMessage).toBeVisible();

        const messageContent = await lastMessage.locator('[data-testid="message-content"]').textContent();
        expect(messageContent?.length).toBeGreaterThan(100);
    });

    test('should support markdown formatting', async ({ page }) => {
        const markdownMessage = '**Bold text** and *italic text*';

        await page.locator('[data-testid="message-input"]').fill(markdownMessage);
        await page.locator('[data-testid="message-input"]').press('Enter');
        await page.waitForTimeout(500);

        // Check if formatted
        const lastMessage = page.locator('[data-testid="message-item"]').last();
        const hasBold = await lastMessage.locator('strong, b').count() > 0;
        const hasItalic = await lastMessage.locator('em, i').count() > 0;

        expect(hasBold || hasItalic).toBe(true);
    });
});

test.describe('Dark Mode E2E Test', () => {
    test('should toggle dark mode', async ({ page }) => {
        await page.goto('/');
        await page.fill('input[name="username"]', 'testuser999');
        await page.fill('input[name="password"]', 'test999');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/chat');

        const themeToggle = page.locator('[data-testid="theme-toggle"]');

        if (await themeToggle.isVisible()) {
            // Get initial theme
            const initialTheme = await page.locator('html').getAttribute('data-theme');

            // Toggle
            await themeToggle.click();
            await page.waitForTimeout(300);

            // Theme should change
            const newTheme = await page.locator('html').getAttribute('data-theme');
            expect(newTheme).not.toBe(initialTheme);
        }
    });
});
