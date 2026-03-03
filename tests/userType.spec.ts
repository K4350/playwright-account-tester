import { test } from '@playwright/test';
import { getTestData } from '../utils/excelReader';
import { generateExcelReport, generateCSVReport, TestResult } from '../utils/reportGenerator';

const users: any = getTestData('./testData/Crr01.xlsx');
const testResults: TestResult[] = [];

users.forEach((user: any, index: number) => {

    test(`Row ${index + 1} - ${user.Username}`, async ({ page }) => {

        // Try to logout, but don't fail if it times out
        try {
            await page.goto('https://crr01-ss.nonp.deel-fe.services.vodafone.com.au/logout', {
                timeout: 10000,
                waitUntil: 'domcontentloaded'
            });
            console.log('✓ Logged out successfully');
        } catch (error) {
            console.log('⚠ Logout skipped (may already be logged out or page unavailable)');
        }

        // Navigate to login page
        console.log(`\n🔄 Testing user: ${user.Username}`);
        try {
            await page.goto('https://test04.nonp.deel-ciam.services.vodafone.com.au/u/login', {
                timeout: 30000,
                waitUntil: 'domcontentloaded'
            });
        } catch (error) {
            console.log('❌ Failed to load login page (network/server issue)\n');
            testResults.push({
                row: index + 1,
                username: user.Username,
                password: user.Password,
                productType: '',
                accountCount: 0,
                accounts: [],
                status: 'Failed - Network Issue',
                errorMessage: 'Unable to load login page'
            });
            return; // Exit gracefully
        }

        // Fill login credentials
        try {
            await page.getByRole('textbox', { name: 'Enter email address' }).fill(user.Username);
            await page.getByRole('textbox', { name: 'Password' }).fill(user.Password);
        } catch (error) {
            console.log('❌ Failed to fill login form\n');
            testResults.push({
                row: index + 1,
                username: user.Username,
                password: user.Password,
                productType: '',
                accountCount: 0,
                accounts: [],
                status: 'Failed - Network Issue',
                errorMessage: 'Unable to fill login form'
            });
            return;
        }

        // Set up API response listener right before clicking login
        const responsePromise = page.waitForResponse(
            response =>
                response.url().includes('/tpg-api/customerManagement/v1/customer/') &&
                response.request().method() === 'GET',
            { timeout: 25000 }
        );

        // Click login button
        try {
            await page.getByRole('button', { name: 'Log in' }).click({ timeout: 5000 });
        } catch (error) {
            console.log('⚠ Login button click timeout (but continuing...)');
        }

        // Wait for API response
        let body;
        try {
            const response = await responsePromise;
            body = await response.json();
            console.log('✓ API captured successfully');
        } catch (error) {
            // Check if we're still on login page or if there's an error message
            const currentUrl = page.url();
            
            console.log('❌ API not captured for:', user.Username);
            
            let status: TestResult['status'] = 'Failed - Unknown';
            let errorMessage = '';
            
            if (currentUrl.includes('/u/login')) {
                console.log('   → Still on login page (likely invalid credentials)\n');
                status = 'Failed - Invalid Credentials';
                errorMessage = 'Login failed - invalid credentials or account locked';
            } else if (currentUrl.includes('verification') || currentUrl.includes('mfa')) {
                console.log('   → MFA/2FA verification required\n');
                status = 'Failed - MFA Required';
                errorMessage = 'MFA/2FA verification required';
            } else {
                console.log('   → Unknown issue - URL:', currentUrl, '\n');
                errorMessage = `Unknown error - redirected to: ${currentUrl}`;
            }
            
            testResults.push({
                row: index + 1,
                username: user.Username,
                password: user.Password,
                productType: '',
                accountCount: 0,
                accounts: [],
                status: status,
                errorMessage: errorMessage
            });
            
            return; // Exit gracefully without data extraction
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

        console.log('============================');
        console.log('Row:', index + 1);
        console.log('User:', user.Username);
        console.log('Product Type:', productType);
        console.log('Accounts:');
        extractedAccounts.forEach((acc, i) => {
            console.log(`${i + 1}.`, acc);
        });
        console.log('============================');

        // Save results
        testResults.push({
            row: index + 1,
            username: user.Username,
            password: user.Password,
            productType: productType,
            accountCount: extractedAccounts.length,
            accounts: extractedAccounts,
            status: 'Success'
        });
    });

});

// Generate reports after all tests complete
test.afterAll(async () => {
    if (testResults.length > 0) {
        console.log('\n📊 Generating test summary reports...\n');
        
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
    }
});