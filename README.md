# User Account Testing Framework

## Overview
Automated Playwright-based testing framework that extracts user account data from API responses, with advanced retry logic, smart error detection, and configurable performance settings.

## 📋 Prerequisites

**⚠️ First Time Setup?** See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed installation instructions.

**Required:**
- Node.js 16+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)
- Git ([Download](https://git-scm.com/))

**Quick Install:**
```bash
# Clone repository
git clone <repository-url>
cd playwright-account-tester

# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Configure environment
cp .env.example .env
# Edit .env with your settings
```

## Features

### ✅ Auto-Retry & Error Detection
- **Configurable retry attempts** (default: 3 attempts)
- **Smart error classification:**
  - Invalid credentials (no retry)
  - MFA/2FA required (no retry)
  - Network errors (retries automatically)
  - Unknown errors (retries with exponential backoff)
- **Detailed error reporting** with specific failure reasons

### ⚡ Performance Optimizations
- **Configurable parallel execution** via `WORKERS` setting
- **Optional logout skip** to reduce test time (set `SKIP_LOGOUT=true`)
- **Progress bar** showing real-time test completion status
- **Sequential mode by default** for report generation reliability

### 🔒 Security Best Practices
- **Environment-based configuration** (`.env` file)
- **Credentials excluded from git** (in `.gitignore`)
- **Sensitive data protection** for test data files
- **Centralized config management** via `utils/config.ts`

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and customize settings:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
# URLs
LOGIN_URL=https://your-app.example.com/u/login
LOGOUT_URL=https://your-app.example.com/logout
API_ENDPOINT=/api/customerManagement/v1/customer/

# Test Data
TEST_DATA_FILE=./testData/TestData.xlsx

# Timeouts (milliseconds)
TIMEOUT_NAVIGATION=30000
TIMEOUT_LOGIN=25000
TIMEOUT_LOGOUT=10000
TIMEOUT_ACTION=10000
TIMEOUT_TEST=60000

# Test Execution
RETRY_ATTEMPTS=3
WORKERS=1
SKIP_LOGOUT=false

# Reports
REPORT_PATH=./test-results
```

### 3. Prepare Test Data
Place your Excel file with user credentials at `./testData/TestData.xlsx`

Expected columns:
- `Username` - Email address
- `Password` - User password

## Usage

### Run Tests
```bash
npx playwright test
```

### Run with Specific Settings
Override environment variables:
```bash
RETRY_ATTEMPTS=5 WORKERS=3 npx playwright test
```

### View Results
After test completion, reports are generated:
- `test-results/test-summary-report.xlsx` - Excel format
- `test-results/test-summary-report.csv` - CSV format
- `playwright-report/index.html` - Playwright HTML report

## Configuration Options

### Retry Attempts
Set `RETRY_ATTEMPTS` to control how many times a failed test will retry:
- Default: `3`
- Network errors retry automatically
- Credential/MFA errors skip retry

### Workers (Parallel Execution)
Set `WORKERS` to control parallel test execution:
- `1` - Sequential (safest, best for report generation)
- `2-5` - Parallel (faster but may have race conditions)
- Default: `1`

### Skip Logout
Set `SKIP_LOGOUT=true` to skip logout between tests:
- Pros: Faster execution
- Cons: May cause session conflicts
- Default: `false`

## Report Format

### Excel/CSV Columns
1. **SL No** - Row number
2. **Username** - Email address
3. **Password** - User password
4. **Name** - User's full name (First Name + Last Name)
5. **Birth Date** - User's date of birth (format: DD/MM/YYYY)
6. **Phone Number** - User's contact phone number
7. **productType** - Account product type (e.g., postpaid, prepaid)
8. **accountType** - Detailed account information

### Account Type Format
Multi-line pipe-separated format:
```
1. AccountType|MSISDN|ServiceType
2. AccountType|MSISDN|ServiceType
3. AccountType|MSISDN|ServiceType
```

Example:
```
1. Postpaid|0412345678|Postpaid Voice
2. Prepaid|0423456789|Prepaid Data
```

## Error Types

| Error Type | Description | Retry? |
|------------|-------------|--------|
| `Failed - Invalid Credentials` | Username/password incorrect or account locked | ❌ No |
| `Failed - MFA Required` | 2FA/MFA verification needed | ❌ No |
| `Failed - Network Issue` | Connection timeout or server unavailable | ✅ Yes |
| `Failed - Unknown` | Unexpected error or redirect | ✅ Yes |

## Troubleshooting

### Tests timing out
- Increase `TIMEOUT_NAVIGATION` and `TIMEOUT_LOGIN` in `.env`
- Check network connectivity
- Verify URLs are accessible

### All tests failing
- Verify credentials in Excel file
- Check if login page URL has changed
- Review API endpoint path

### Reports not generated
- Ensure tests complete (not interrupted)
- Check `REPORT_PATH` directory exists
- Verify write permissions

### Parallel execution issues
- Reduce `WORKERS` to `1`
- Enable `SKIP_LOGOUT=false`
- Check for session management conflicts

## File Structure
```
.
├── .env                    # Environment configuration (not in git)
├── .env.example            # Template for environment variables
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
├── playwright.config.ts    # Playwright configuration
├── testData/
│   └── TestData.xlsx      # Test data with credentials (not in git)
├── tests/
│   └── userType.spec.ts   # Main test file
├── utils/
│   ├── config.ts          # Configuration management
│   ├── excelReader.ts     # Excel file parser
│   ├── reportGenerator.ts # Report generation
│   └── testHelpers.ts     # Retry & error detection utilities
└── test-results/          # Generated reports (not in git)
```

## Best Practices

1. **Never commit `.env` file** - Contains credentials and sensitive data
2. **Use sequential execution** (`WORKERS=1`) for production data collection
3. **Review failed tests** - Check if it's network (retry) or credentials (fix data)
4. **Keep test data secure** - Excel files with passwords are in `.gitignore`
5. **Monitor retry attempts** - High retry rates may indicate systemic issues

## Advanced Usage

### Custom Error Detection
Edit `utils/testHelpers.ts` → `detectErrorType()` to add custom error patterns:
```typescript
if (bodyText.includes('your-custom-error')) {
    return {
        type: 'custom_error',
        message: 'Your custom error description'
    };
}
```

### Add Progress Tracking
Progress bar automatically shows during test execution:
```
[████████████████░░░░░░░░░░░░░░] 55% (21/39)
```

### Batch Processing
For large datasets, split Excel files into batches and run separately to avoid resource exhaustion.

## Support
For issues or questions, review error logs in console output or check `test-results/` directory for detailed error contexts.
