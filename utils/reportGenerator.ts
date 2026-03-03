import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface TestResult {
    row: number;
    username: string;
    password?: string;
    name?: string;
    birthDate?: string;
    phoneNumber?: string;
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
            'Name': result.name || '',
            'Birth Date': result.birthDate || '',
            'Phone Number': result.phoneNumber || '',
            'productType': result.productType || (result.status === 'Success' ? 'N/A' : 'Failed'),
            'accountType': accountTypeFormatted
        });
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths (exact widths as specified)
    worksheet['!cols'] = [
        { wch: 8.83 },  // A - SL No
        { wch: 35.83 }, // B - Username
        { wch: 10.00 }, // C - Password
        { wch: 21.83 }, // D - Name
        { wch: 11.66 }, // E - Birth Date
        { wch: 13.66 }, // F - Phone Number
        { wch: 23.00 }, // G - productType
        { wch: 29.33 }  // H - accountType
    ];

    // Enable text wrapping for accountType column
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 7 }); // Column H (accountType)
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
    csvRows.push('SL No,Username,Password,Name,Birth Date,Phone Number,productType,accountType');

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
            `"${result.name || ''}"`,
            `"${result.birthDate || ''}"`,
            `"${result.phoneNumber || ''}"`,
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
