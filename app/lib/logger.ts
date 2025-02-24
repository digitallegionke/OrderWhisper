interface LogMessage {
  message: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  timestamp: string;
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(message: LogMessage): string {
    const base = {
      ...message,
      environment: process.env.NODE_ENV,
      service: 'orderwhisper',
      render_instance: process.env.RENDER_INSTANCE_ID || 'local',
    };

    return this.isProduction
      ? JSON.stringify(base)
      : `[${base.timestamp}] ${base.level.toUpperCase()}: ${base.message}`;
  }

  public info(message: string, meta: object = {}): void {
    const logMessage = this.formatMessage({
      message,
      level: 'info',
      timestamp: new Date().toISOString(),
      ...meta
    });
    console.log(logMessage);
  }

  public error(message: string, error?: Error, meta: object = {}): void {
    const logMessage = this.formatMessage({
      message,
      level: 'error',
      timestamp: new Date().toISOString(),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      ...meta
    });
    console.error(logMessage);
  }

  public warn(message: string, meta: object = {}): void {
    const logMessage = this.formatMessage({
      message,
      level: 'warn',
      timestamp: new Date().toISOString(),
      ...meta
    });
    console.warn(logMessage);
  }

  public debug(message: string, meta: object = {}): void {
    if (!this.isProduction) {
      const logMessage = this.formatMessage({
        message,
        level: 'debug',
        timestamp: new Date().toISOString(),
        ...meta
      });
      console.debug(logMessage);
    }
  }
}

export const logger = Logger.getInstance();
export default logger; 