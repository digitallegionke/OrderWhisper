type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

class Logger {
  private static instance: Logger;
  private environment: string;

  private constructor() {
    this.environment = process.env.NODE_ENV || 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        environment: this.environment,
      },
    };
  }

  private output(entry: LogEntry): void {
    const logString = JSON.stringify(entry);
    
    switch (entry.level) {
      case 'debug':
        if (this.environment === 'development') {
          console.debug(logString);
        }
        break;
      case 'info':
        console.info(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'error':
        console.error(logString);
        break;
    }
  }

  public debug(message: string, context?: LogContext): void {
    this.output(this.formatLog('debug', message, context));
  }

  public info(message: string, context?: LogContext): void {
    this.output(this.formatLog('info', message, context));
  }

  public warn(message: string, context?: LogContext): void {
    this.output(this.formatLog('warn', message, context));
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    this.output(
      this.formatLog('error', message, {
        ...context,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : undefined,
      })
    );
  }
}

export const logger = Logger.getInstance(); 