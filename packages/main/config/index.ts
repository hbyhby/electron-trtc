// 环境类型定义
export const ENV_TYPES = {
  MOCK: 'mock',
  DEV: 'development',
  TEST: 'test',
  STAGING: 'staging',
  PROD: 'production'
} as const;

type EnvType = typeof ENV_TYPES[keyof typeof ENV_TYPES];

// 获取当前环境
const ENV = (process.env.NODE_ENV || 'production') as EnvType;

// 配置类型定义
interface EnvConfig {
  protocol: {
    name: string;
    scheme: string;
  };
  update: {
    url: string;
  };
}

// 不同环境的配置项
const CONFIG: Record<EnvType, EnvConfig> = {
  mock: {
    protocol: {
      name: 'trtcroom-mock',
      scheme: 'trtcroom-mock://'
    },
    update: {
      url: 'http://localhost:3000/mock/update'
    }
  },
  development: {
    protocol: {
      name: 'trtcroom-dev',
      scheme: 'trtcroom-dev://'
    },
    update: {
      url: 'http://dev-update.example.com'
    }
  },
  test: {
    protocol: {
      name: 'trtcroom-test',
      scheme: 'trtcroom-test://'
    },
    update: {
      url: 'https://test-update.example.com'
    }
  },
  staging: {
    protocol: {
      name: 'trtcroom-staging',
      scheme: 'trtcroom-staging://'
    },
    update: {
      url: 'https://staging-update.example.com'
    }
  },
  production: {
    protocol: {
      name: 'trtcroom',
      scheme: 'trtcroom://'
    },
    update: {
      url: 'https://update.example.com'
    }
  }
};

// 验证配置
function validateConfig(config: Record<EnvType, EnvConfig>) {
  const requiredFields = ['protocol.name', 'protocol.scheme', 'update.url'];
  
  for (const env in config) {
    for (const field of requiredFields) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], config[env as EnvType]);
      if (!value) {
        throw new Error(`Missing required config field: ${field} in ${env} environment`);
      }
    }
  }
}

// 验证配置
validateConfig(CONFIG);

// 确保环境变量有效
if (!CONFIG[ENV]) {
  throw new Error(`Invalid NODE_ENV: ${ENV}. Valid values are: ${Object.keys(CONFIG).join(', ')}`);
}

// 导出当前环境的配置
export const APP_CONFIG = CONFIG[ENV];

// 导出所有配置（用于调试）
export const ALL_CONFIG = CONFIG;

// 判断是否为开发环境（包括mock和dev）
export const isDevelopment = ENV === ENV_TYPES.MOCK || ENV === ENV_TYPES.DEV;

// 判断是否为生产环境
export const isProduction = ENV === ENV_TYPES.PROD;