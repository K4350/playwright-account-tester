import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

export interface TestConfig {
    urls: {
        login: string;
        logout: string;
    };
    api: {
        endpoint: string;
    };
    testData: {
        filePath: string;
    };
    timeouts: {
        navigation: number;
        login: number;
        logout: number;
        action: number;
        test: number;
    };
    test: {
        retryAttempts: number;
        workers: number;
        skipLogout: boolean;
    };
    report: {
        path: string;
    };
}

export const config: TestConfig = {
    urls: {
        login: process.env.LOGIN_URL || 'https://your-app.example.com/u/login',
        logout: process.env.LOGOUT_URL || 'https://your-app.example.com/logout'
    },
    api: {
        endpoint: process.env.API_ENDPOINT || '/api/customerManagement/v1/customer/'
    },
    testData: {
        filePath: process.env.TEST_DATA_FILE || './testData/TestData.xlsx'
    },
    timeouts: {
        navigation: parseInt(process.env.NAVIGATION_TIMEOUT || '30000'),
        login: parseInt(process.env.LOGIN_TIMEOUT || '25000'),
        logout: parseInt(process.env.LOGOUT_TIMEOUT || '10000'),
        action: parseInt(process.env.ACTION_TIMEOUT || '5000'),
        test: parseInt(process.env.TEST_TIMEOUT || '60000')
    },
    test: {
        retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
        workers: parseInt(process.env.WORKERS || '1'),
        skipLogout: process.env.SKIP_LOGOUT === 'true'
    },
    report: {
        path: process.env.REPORT_PATH || './test-results/test-summary-report'
    }
};

export default config;
