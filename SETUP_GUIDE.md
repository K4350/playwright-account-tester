# Setup Guide - Automated User Account Testing Framework

## 📋 Prerequisites

Before cloning and running this project, ensure you have the following installed:

### 1. **Node.js** (Required)
- **Version:** Node.js 16.x or higher (recommended: 18.x or 20.x)
- **Download:** [https://nodejs.org/](https://nodejs.org/)
- **Verify installation:**
  ```bash
  node --version   # Should show v16.x or higher
  npm --version    # Should show 8.x or higher
  ```

### 2. **Git** (Required)
- **Download:** [https://git-scm.com/downloads](https://git-scm.com/downloads)
- **Verify installation:**
  ```bash
  git --version   # Should show git version 2.x or higher
  ```

### 3. **Code Editor** (Recommended)
- **Visual Studio Code:** [https://code.visualstudio.com/](https://code.visualstudio.com/)
- Or any editor of your choice

### 4. **Operating System**
- ✅ macOS
- ✅ Windows 10/11
- ✅ Linux (Ubuntu 20.04+)

---

## 🚀 Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the project
git clone https://github.com/K4350/playwright-account-tester.git

# Navigate to project directory
cd playwright-account-tester
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install
```

This will install:
- `@playwright/test` - Test framework
- `xlsx` - Excel file processing
- `dotenv` - Environment configuration
- `@types/node` - TypeScript type definitions

### Step 3: Install Playwright Browsers

```bash
# Install Chromium browser for Playwright
npx playwright install chromium

# Optional: Install all browsers (Chrome, Firefox, Safari)
npx playwright install
```

### Step 4: Configure Environment Variables

```bash
# Create your .env file from the template
cp .env.example .env
```

Edit `.env` file with your specific configuration:

```env
# URLs - REQUIRED: Update with your application URLs
LOGIN_URL=https://your-login-url.example.com/u/login
LOGOUT_URL=https://your-logout-url.example.com/logout

# API Endpoint - REQUIRED: Update with your API path
API_ENDPOINT=/api/customerManagement/v1/customer/

# Test Data - REQUIRED: Update with your Excel file name
TEST_DATA_FILE=./testData/YourTestData.xlsx

# Timeouts (in milliseconds) - Optional: Adjust as needed
NAVIGATION_TIMEOUT=20000
LOGIN_TIMEOUT=20000
LOGOUT_TIMEOUT=5000
ACTION_TIMEOUT=5000
TEST_TIMEOUT=60000

# Test Configuration - Optional: Adjust as needed
RETRY_ATTEMPTS=3
WORKERS=3
SKIP_LOGOUT=true

# Report Configuration - Optional: Change output path
REPORT_PATH=./test-results/test-summary-report
```

### Step 5: Prepare Test Data

Create an Excel file in the `testData/` folder with your test credentials:

**File Format:** `testData/YourTestData.xlsx`

**Required Columns:**
| Username | Password |
|----------|----------|
| user1@example.com | password123 |
| user2@example.com | password456 |

**Guidelines:**
- Column names MUST be: `Username` and `Password`
- Add as many rows as needed
- Save as `.xlsx` format

### Step 6: Verify Setup

Run a test to verify everything is configured correctly:

```bash
# Run tests
npx playwright test --project=chromium

# If successful, you should see:
# - Test execution progress
# - Report generation
# - Success/failure summary
```

---

## 📦 Project Dependencies

### Production Dependencies
```json
{
  "dotenv": "^17.3.1",     // Environment variable management
  "xlsx": "^0.18.5"        // Excel file reading/writing
}
```

### Development Dependencies
```json
{
  "@playwright/test": "^1.58.2",  // Test framework
  "@types/node": "^25.3.3"        // TypeScript type definitions
}
```

---

## 🛠️ Tools & Technologies

| Tool | Purpose | Installation |
|------|---------|--------------|
| **Node.js** | Runtime environment | [nodejs.org](https://nodejs.org/) |
| **npm** | Package manager | Included with Node.js |
| **Playwright** | Browser automation | `npm install` |
| **TypeScript** | Type-safe JavaScript | Included as dependency |
| **Chromium** | Test browser | `npx playwright install chromium` |
| **Git** | Version control | [git-scm.com](https://git-scm.com/) |

---

## 📂 Required Files Checklist

Before running tests, ensure you have:

- ✅ `.env` file (created from `.env.example`)
- ✅ Excel test data file in `testData/` folder
- ✅ Node modules installed (`node_modules/` folder exists)
- ✅ Chromium browser installed (via Playwright)

**Files that will be auto-generated:**
- `test-results/` - Test execution results
- `test-results/json-results/` - Individual test JSON files
- `test-results/test-summary-report.xlsx` - Final Excel report
- `test-results/test-summary-report.csv` - Final CSV report
- `playwright-report/` - Playwright HTML report

---

## ⚙️ Configuration Guide

### Environment Variables Explained

#### Required Configuration
```env
# Your application login page URL
LOGIN_URL=https://your-app.example.com/u/login

# Your application logout page URL
LOGOUT_URL=https://your-app.example.com/logout

# API endpoint path that returns customer data
API_ENDPOINT=/api/customerManagement/v1/customer/

# Path to your Excel test data file
TEST_DATA_FILE=./testData/TestData.xlsx
```

#### Optional Configuration
```env
# Number of parallel test workers (1-10)
# Higher = faster, but more resource intensive
WORKERS=3

# Number of retry attempts for failed tests
RETRY_ATTEMPTS=3

# Skip logout step to speed up tests
SKIP_LOGOUT=true

# Timeout values in milliseconds
NAVIGATION_TIMEOUT=20000  # Page load timeout
LOGIN_TIMEOUT=20000       # Login action timeout
LOGOUT_TIMEOUT=5000       # Logout action timeout
ACTION_TIMEOUT=5000       # General action timeout
TEST_TIMEOUT=60000        # Overall test timeout
```

---

## 🔧 System Requirements

### Minimum Requirements
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Disk:** 1 GB free space
- **Internet:** Stable connection required

### Recommended Requirements
- **CPU:** 4+ cores
- **RAM:** 8 GB
- **Disk:** 2 GB free space
- **Internet:** High-speed connection

---

## 📝 Post-Installation Steps

### 1. Verify Installation
```bash
# Check all tools are installed
node --version
npm --version
git --version
npx playwright --version
```

### 2. Run Sample Test
```bash
# Run tests with a small dataset first
npx playwright test --project=chromium
```

### 3. View Results
```bash
# Open Excel report
open test-results/test-summary-report.xlsx   # macOS
start test-results/test-summary-report.xlsx  # Windows
xdg-open test-results/test-summary-report.xlsx  # Linux

# Open HTML report
npx playwright show-report
```

### 4. Validate Output
Check that the Excel report contains:
- ✅ All 9 columns (SL No, Username, Password, Name, Birth Date, Phone Number, productType, Customer Accounts, accountType)
- ✅ All your test users
- ✅ Correct data for each user

---

## 🚨 Troubleshooting

### Issue: `npm install` fails
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Playwright browsers not found
**Solution:**
```bash
# Reinstall Playwright browsers
npx playwright install chromium --with-deps
```

### Issue: `.env` file not being read
**Solution:**
- Ensure `.env` is in the root directory (same level as `package.json`)
- Check file name is exactly `.env` (not `.env.txt`)
- No spaces in variable names: `LOGIN_URL=value` (not `LOGIN_URL = value`)

### Issue: Test data Excel file not found
**Solution:**
- Check file path in `.env` matches actual file location
- Ensure Excel file has `.xlsx` extension
- Verify columns are named `Username` and `Password` (case-sensitive)

### Issue: Tests timeout or fail
**Solution:**
- Increase timeout values in `.env`
- Reduce `WORKERS` to 1 for debugging
- Check your application URLs are correct
- Verify network connectivity

### Issue: "Module not found" errors
**Solution:**
```bash
# Reinstall dependencies
npm install

# Install missing TypeScript types
npm install --save-dev @types/node
```

---

## 🎯 Quick Start Commands

```bash
# Complete setup from scratch
git clone <repository-url>
cd playwright-account-tester
npm install
npx playwright install chromium
cp .env.example .env
# Edit .env with your values
# Add your test data Excel file
npx playwright test --project=chromium
open test-results/test-summary-report.xlsx
```

---

## 📚 Additional Resources

### Documentation
- [Playwright Documentation](https://playwright.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [dotenv Documentation](https://www.npmjs.com/package/dotenv)
- [xlsx Documentation](https://www.npmjs.com/package/xlsx)

### Project Documentation
- `README.md` - Project overview, features, and usage
- `SETUP_GUIDE.md` - Detailed installation and configuration guide

### Support
- Create an issue on GitHub
- Contact project maintainer
- Check existing issues for solutions

---

## ✅ Pre-Run Checklist

Before running tests, verify:

- [ ] Node.js 16+ installed
- [ ] npm packages installed (`npm install` completed)
- [ ] Playwright Chromium installed (`npx playwright install chromium`)
- [ ] `.env` file created and configured
- [ ] Test data Excel file created in `testData/` folder
- [ ] Excel file has `Username` and `Password` columns
- [ ] Application URLs in `.env` are correct
- [ ] Internet connection is stable

---

## 🎉 You're Ready!

Once all prerequisites are met and configuration is complete, run:

```bash
npx playwright test --project=chromium
```

Your automated tests will:
1. ✅ Read test data from Excel
2. ✅ Log into your application
3. ✅ Capture API responses
4. ✅ Extract user information
5. ✅ Generate Excel/CSV reports

**Expected execution time:** ~6 minutes for 39 users (with 3 workers)

---

## 🔄 Regular Maintenance

### Update Dependencies
```bash
# Check for outdated packages
npm outdated

# Update all packages
npm update

# Update Playwright specifically
npm install @playwright/test@latest
npx playwright install chromium
```

### Update Test Data
- Edit your Excel file in `testData/` folder
- Add/remove users as needed
- Re-run tests to generate updated reports

### Backup Important Files
Always backup before making changes:
- `.env` (your configuration)
- `testData/*.xlsx` (your test credentials)
- Reports (if needed for historical comparison)

---

*For questions or issues, refer to project documentation or create a GitHub issue.*
