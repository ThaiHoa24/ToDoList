export interface EnvironmentVariables {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const errors: string[] = [];

  const port = parseInt((config.PORT as string) ?? '3000', 10);
  if (isNaN(port)) {
    errors.push('PORT must be a valid integer number');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.join(', ')}`);
  }

  return {
    NODE_ENV: (config.NODE_ENV as string) || 'development',
    PORT: port,
    DATABASE_URL: config.DATABASE_URL as string | undefined,
    JWT_SECRET: (config.JWT_SECRET as string) || 'secretKey',
    JWT_EXPIRES_IN: (config.JWT_EXPIRES_IN as string) || '1d',
  };
}
