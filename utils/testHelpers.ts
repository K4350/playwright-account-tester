import { Page } from '@playwright/test';
import config from './config';

export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    attempts: number;
}

export async function retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = config.test.retryAttempts,
    operationName: string = 'Operation'
): Promise<RetryResult<T>> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const result = await operation();
            if (attempt > 1) {
                console.log(`✓ ${operationName} succeeded on attempt ${attempt}`);
            }
            return {
                success: true,
                data: result,
                attempts: attempt
            };
        } catch (error) {
            lastError = error as Error;
            if (attempt < maxAttempts) {
                console.log(`⚠ ${operationName} failed (attempt ${attempt}/${maxAttempts}), retrying...`);
                await delay(1000 * attempt); // Exponential backoff
            }
        }
    }
    
    return {
        success: false,
        error: lastError?.message || 'Unknown error',
        attempts: maxAttempts
    };
}

export async function smartLogin(
    page: Page,
    username: string,
    password: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Navigate to login page
        await page.goto(config.urls.login, {
            timeout: config.timeouts.navigation,
            waitUntil: 'domcontentloaded'
        });
        
        // Fill credentials
        await page.getByRole('textbox', { name: 'Enter email address' }).fill(username);
        await page.getByRole('textbox', { name: 'Password' }).fill(password);
        
        // Click login
        await page.getByRole('button', { name: 'Log in' }).click({ timeout: config.timeouts.action });
        
        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Login failed' 
        };
    }
}

export async function detectErrorType(page: Page): Promise<{
    type: 'invalid_credentials' | 'mfa_required' | 'network_error' | 'unknown';
    message: string;
}> {
    const currentUrl = page.url();
    
    // Check for login page (credentials issue)
    if (currentUrl.includes('/u/login')) {
        return {
            type: 'invalid_credentials',
            message: 'Still on login page - invalid credentials or account locked'
        };
    }
    
    // Check for MFA/verification
    if (currentUrl.includes('verification') || currentUrl.includes('mfa') || currentUrl.includes('2fa')) {
        return {
            type: 'mfa_required',
            message: 'MFA/2FA verification required'
        };
    }
    
    // Check page content for error messages
    try {
        const bodyText = await page.textContent('body', { timeout: 2000 }) || '';
        
        if (bodyText.toLowerCase().includes('network') || bodyText.toLowerCase().includes('connection')) {
            return {
                type: 'network_error',
                message: 'Network or connection error detected'
            };
        }
        
        if (bodyText.toLowerCase().includes('unauthorized') || bodyText.toLowerCase().includes('forbidden')) {
            return {
                type: 'invalid_credentials',
                message: 'Access denied - unauthorized'
            };
        }
    } catch (e) {
        // Ignore timeout on body text check
    }
    
    // Unknown error
    return {
        type: 'unknown',
        message: `Unexpected redirect to: ${currentUrl}`
    };
}

export async function captureAPIWithRetry(
    page: Page,
    username: string,
    maxAttempts: number = 2
): Promise<RetryResult<any>> {
    return retryOperation(async () => {
        const responsePromise = page.waitForResponse(
            response =>
                response.url().includes(config.api.endpoint) &&
                response.request().method() === 'GET',
            { timeout: config.timeouts.login }
        );
        
        const response = await responsePromise;
        return await response.json();
    }, maxAttempts, `API capture for ${username}`);
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getProgressBar(current: number, total: number, width: number = 30): string {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((width * current) / total);
    const empty = width - filled;
    
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}% (${current}/${total})`;
}
