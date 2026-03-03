import { test } from '@playwright/test';
import { getTestData } from '../utils/excelReader';
import { generateExcelReport, generateCSVReport, TestResult } from '../utils/reportGenerator';
import config from '../utils/config';
import { retryOperation, smartLogin, detectErrorType, captureAPIWithRetry, getProgressBar } from '../utils/testHelpers';
import * as fs from 'fs';
import * as path from 'path';

const users: any = getTestData(config.testData.filePath);
const resultsDir = './test-results/json-results';

// Create results directory if it doesn't exist
if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
}

// Clean up old JSON results before tests start
test.beforeAll(async () => {
    const files = fs.readdirSync(resultsDir);
    for (const file of files) {
        if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(resultsDir, file));
        }
    }
    console.log('🧹 Cleaned up old test results');
});

users.forEach((user: any, index: number) => {

    test(`Row ${index + 1} - ${user.Username}`, async ({ page }) => {
        let success = false;
        let lastError: TestResult | undefined;

        // Retry loop for each test
        for (let attempt = 1; attempt <= config.test.retryAttempts; attempt++) {
            if (attempt > 1) {
                console.log(`\n🔄 Retry attempt ${attempt}/${config.test.retryAttempts} for ${user.Username}`);
            }

            // Logout (conditional based on config)
            if (!config.test.skipLogout) {
                try {
                    await page.goto(config.urls.logout, {
                        timeout: config.timeouts.logout,
                        waitUntil: 'domcontentloaded'
                    });
                    console.log('✓ Logged out successfully');
                } catch (error) {
                    console.log('⚠ Logout skipped (may already be logged out or page unavailable)');
                }
            }

            // Navigate to login page
            console.log(`\n🔄 Testing user: ${user.Username}`);
            try {
                await page.goto(config.urls.login, {
                    timeout: config.timeouts.navigation,
                    waitUntil: 'domcontentloaded'
                });
            } catch (error) {
                console.log('❌ Failed to load login page (network/server issue)');
                lastError = {
                    row: index + 1,
                    username: user.Username,
                    password: user.Password,
                    productType: '',
                    accountCount: 0,
                    accounts: [],
                    status: 'Failed - Network Issue',
                    errorMessage: 'Unable to load login page'
                };
                continue; // Retry
            }

            // Fill login credentials
            try {
                await page.getByRole('textbox', { name: 'Enter email address' }).fill(user.Username);
                await page.getByRole('textbox', { name: 'Password' }).fill(user.Password);
            } catch (error) {
                console.log('❌ Failed to fill login form');
                lastError = {
                    row: index + 1,
                    username: user.Username,
                    password: user.Password,
                    productType: '',
                    accountCount: 0,
                    accounts: [],
                    status: 'Failed - Network Issue',
                    errorMessage: 'Unable to fill login form'
                };
                continue; // Retry
            }

            // Click login button and set up API listeners
            let body;
            let personalInfo: any = {};
            const apiCalls: Array<{url: string, method: string}> = [];
            
            try {
                // Log all API calls for debugging
                page.on('response', async (response) => {
                    const url = response.url();
                    const method = response.request().method();
                    
                    // Only log API calls (not static resources)
                    if (url.includes('/api/') || url.includes('-api.')) {
                        apiCalls.push({ url, method });
                    }
                });

                // Set up API response listeners before clicking login
                const responsePromise = page.waitForResponse(
                    response =>
                        response.url().includes(config.api.endpoint) &&
                        response.request().method() === 'GET',
                    { timeout: config.timeouts.login }
                ).catch(() => null); // Gracefully handle if not received

                // Try multiple personal info API patterns
                const personalInfoPromise = page.waitForResponse(
                    response =>
                        response.url().includes('/tmf-api/party/v4/individual/') &&
                        response.url().includes('mode=accountManagement') &&
                        response.request().method() === 'GET',
                    { timeout: config.timeouts.login }
                ).catch(() => null);

                // Alternative: dashboard mode
                const personalInfoDashboardPromise = page.waitForResponse(
                    response =>
                        response.url().includes('/tmf-api/party/v4/individual/') &&
                        response.url().includes('mode=dashboard') &&
                        response.request().method() === 'GET',
                    { timeout: config.timeouts.login }
                ).catch(() => null);

                // Click login button
                try {
                    await page.getByRole('button', { name: 'Log in' }).click({ timeout: config.timeouts.action });
                } catch (error) {
                    console.log('⚠ Login button click timeout (but continuing...)');
                }

                // Wait for main API response
                const response = await responsePromise;
                if (!response) {
                    throw new Error('API response not received');
                }
                
                body = await response.json();
                console.log('✓ API captured successfully');

                // Try to capture personal info API (try both modes)
                const personalResponse = await personalInfoPromise;
                const dashboardResponse = await personalInfoDashboardPromise;
                
                if (personalResponse) {
                    personalInfo = await personalResponse.json();
                    console.log('✓ Personal info API captured (accountManagement mode)');
                } else if (dashboardResponse) {
                    personalInfo = await dashboardResponse.json();
                    console.log('✓ Personal info API captured (dashboard mode)');
                } else {
                    console.log('⚠ Personal info API not captured (continuing without it)');
                    console.log('📋 API calls made:', apiCalls.slice(0, 10).map(call => `${call.method} ${call.url.split('?')[0]}`).join('\n   '));
                }
            } catch (error) {
                // Detect error type
                const errorInfo = await detectErrorType(page);
                
                console.log(`❌ API not captured for: ${user.Username}`);
                console.log(`   → ${errorInfo.message}`);

                let status: TestResult['status'] = 'Failed - Unknown';
                
                switch (errorInfo.type) {
                    case 'invalid_credentials':
                        status = 'Failed - Invalid Credentials';
                        break;
                    case 'mfa_required':
                        status = 'Failed - MFA Required';
                        break;
                    case 'network_error':
                        status = 'Failed - Network Issue';
                        break;
                    default:
                        status = 'Failed - Unknown';
                }
                
                lastError = {
                    row: index + 1,
                    username: user.Username,
                    password: user.Password,
                    productType: '',
                    accountCount: 0,
                    accounts: [],
                    status: status,
                    errorMessage: errorInfo.message
                };

                // Don't retry if it's credentials or MFA issue
                if (errorInfo.type === 'invalid_credentials' || errorInfo.type === 'mfa_required') {
                    break; // Exit retry loop
                }
                
                continue; // Retry for network issues
            }

            const productType =
                body.accountDetails.accountDetail.productType;

            const billingAccounts =
                body.accountDetails.accountDetail.billingAccount;

            const extractedAccounts: any[] = [];

            for (const account of billingAccounts) {
                if (account.asset) {
                    for (const asset of account.asset) {
                        extractedAccounts.push({
                            accountType: asset.accountType,
                            msisdn: asset.msisdn,
                            serviceType: asset.serviceType
                        });
                    }
                }
            }

            // Extract personal information from second API
            let name = '';
            let birthDate = '';
            let phoneNumber = '';

            if (personalInfo.firstName) {
                const firstName = personalInfo.firstName || '';
                const lastName = personalInfo.lastName || '';
                name = `${firstName} ${lastName}`.trim();
                birthDate = personalInfo.birthDate || '';
                
                // Extract phone number from contactMedium
                const phoneContact = personalInfo.contactMedium?.find(
                    (medium: any) => medium.mediumType === 'PhoneContactMedium'
                );
                phoneNumber = phoneContact?.characteristic?.phoneNumber || '';
            }

            console.log('============================');
            console.log('Row:', index + 1);
            console.log('User:', user.Username);
            console.log('Name:', name);
            console.log('Birth Date:', birthDate);
            console.log('Phone:', phoneNumber);
            console.log('Product Type:', productType);
            console.log('Accounts:');
            extractedAccounts.forEach((acc, i) => {
                console.log(`${i + 1}.`, acc);
            });
            console.log('============================');

            // Save results to individual JSON file (parallel-safe)
            const result: TestResult = {
                row: index + 1,
                username: user.Username,
                password: user.Password,
                name: name,
                birthDate: birthDate,
                phoneNumber: phoneNumber,
                productType: productType,
                accountCount: extractedAccounts.length,
                accounts: extractedAccounts,
                status: 'Success'
            };
            
            fs.writeFileSync(
                path.join(resultsDir, `result-${index + 1}.json`),
                JSON.stringify(result, null, 2)
            );

            success = true;
            break; // Exit retry loop on success
        }

        // If all retries failed, save the last error
        if (!success && lastError) {
            fs.writeFileSync(
                path.join(resultsDir, `result-${index + 1}.json`),
                JSON.stringify(lastError, null, 2)
            );
        }
    });

});

// Generate reports after all tests complete
test.afterAll(async () => {
    console.log('\n📊 Generating test summary reports...\n');
    
    // Read all JSON result files
    const testResults: TestResult[] = [];
    const files = fs.readdirSync(resultsDir);
    
    for (const file of files) {
        if (file.endsWith('.json')) {
            const content = fs.readFileSync(path.join(resultsDir, file), 'utf-8');
            testResults.push(JSON.parse(content));
        }
    }
    
    if (testResults.length === 0) {
        console.log('⚠ No test results found');
        return;
    }
    
    // Sort results by row number
    testResults.sort((a, b) => a.row - b.row);
    
    // Generate Excel report
    generateExcelReport(testResults);
    
    // Generate CSV report
    generateCSVReport(testResults);
    
    // Print summary
    const successCount = testResults.filter(r => r.status === 'Success').length;
    const failedCount = testResults.length - successCount;
    
    console.log('\n📈 Test Summary:');
    console.log(`   Total Tests: ${testResults.length}`);
    console.log(`   ✅ Passed: ${successCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log('\n');
});