import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface TestResult {
    row: number;
    username: string;
    password?: string;
    productType: string;
    accountCount: number;
    accounts: Array<{
        accountType: string;
        msisdn: string;
        serviceType: string;
    }>;
    status: 'Success' | 'Failed - Invalid Credentials' | 'Failed - Network Issue' | 'Failed - MFA Required' | 'Failed - Unknown';
    errorMessage?: string;
}

export function generateExcelReport(results: TestResult[], outputPath: string = './test-results/test-summary-report.xlsx'): void {
    // Prepare data for Excel in the requested format
    const excelData: any[] = [];

    results.forEach(result => {
        // Format accountType column with all accounts in numbered list with pipe-separated values
        let accountTypeFormatted = '';
        
        if (result.accounts.length === 0) {
            accountTypeFormatted = result.errorMessage || 'N/A';
        } else {
            accountTypeFormatted = result.accounts
                .map((account, index) => `${index + 1}. ${account.accountType}|${account.msisdn}|${account.serviceType}`)
                .join('\n');
        }

        excelData.push({
            'SL No': result.row,
            'Username': result.username,
            'Password': result.password || '',
            'productType': result.productType || (result.status === 'Success' ? 'N/A' : 'Failed'),
            'accountType': accountTypeFormatted
        });
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 8 },  // SL No
        { wch: 40 }, // Username
        { wch: 15 }, // Password
        { wch: 25 }, // productType
        { wch: 60 }  // accountType (wider for multi-line content)
    ];

    // Enable text wrapping for accountType column
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 4 }); // Column E (accountType)
        if (worksheet[cellAddress]) {
            if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
            worksheet[cellAddress].s.alignment = { wrapText: true, vertical: 'top' };
        }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Results');

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    XLSX.writeFile(workbook, outputPath);
    console.log(`\n✅ Excel report generated: ${outputPath}`);
}

export function generateCSVReport(results: TestResult[], outputPath: string = './test-results/test-summary-report.csv'): void {
    const csvRows: string[] = [];
    
    // Header
    csvRows.push('SL No,Username,Password,productType,accountType');

    results.forEach(result => {
        // Format accountType column with all accounts in numbered list with pipe-separated values
        let accountTypeFormatted = '';
        
        if (result.accounts.length === 0) {
            accountTypeFormatted = result.errorMessage || 'N/A';
        } else {
            accountTypeFormatted = result.accounts
                .map((account, index) => `${index + 1}. ${account.accountType}|${account.msisdn}|${account.serviceType}`)
                .join('\n');
        }

        csvRows.push([
            result.row,
            `"${result.username}"`,
            `"${result.password || ''}"`,
            `"${result.productType || (result.status === 'Success' ? 'N/A' : 'Failed')}"`,
            `"${accountTypeFormatted}"`
        ].join(','));
    });

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(outputPath, csvRows.join('\n'));
    console.log(`✅ CSV report generated: ${outputPath}`);
}
