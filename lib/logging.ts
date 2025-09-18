/**
 * Consistent logging utility for the application
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  component?: string;
  userId?: string;
  userRole?: string;
  clubId?: string;
  teamId?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = __DEV__;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.log(formattedMessage);
        }
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (error) {
          console.error('Error details:', error);
        }
        break;
    }

    // In production, you might want to send logs to a service
    if (!this.isDevelopment && (level === LogLevel.ERROR || level === LogLevel.WARN)) {
      this.sendToLogService(level, message, context, error);
    }
  }

  private sendToLogService(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    // Example: Send to external logging service
    // LoggingService.send({
    //   level,
    //   message,
    //   context,
    //   error: error ? {
    //     message: error.message,
    //     stack: error.stack,
    //   } : undefined,
    //   timestamp: new Date().toISOString(),
    // });
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Specific logging methods for common scenarios
  apiCall(endpoint: string, method: string, context?: LogContext) {
    this.info(`API ${method} ${endpoint}`, {
      ...context,
      action: 'api_call',
      endpoint,
      method,
    });
  }

  apiError(endpoint: string, method: string, error: Error, context?: LogContext) {
    this.error(`API ${method} ${endpoint} failed`, {
      ...context,
      action: 'api_error',
      endpoint,
      method,
    }, error);
  }

  navigation(from: string, to: string, context?: LogContext) {
    this.info(`Navigation: ${from} → ${to}`, {
      ...context,
      action: 'navigation',
      from,
      to,
    });
  }

  roleSwitch(fromRole: string, toRole: string, context?: LogContext) {
    this.info(`Role switch: ${fromRole} → ${toRole}`, {
      ...context,
      action: 'role_switch',
      fromRole,
      toRole,
    });
  }

  deepLink(url: string, context?: LogContext) {
    this.info(`Deep link: ${url}`, {
      ...context,
      action: 'deep_link',
      url,
    });
  }

  userAction(action: string, context?: LogContext) {
    this.info(`User action: ${action}`, {
      ...context,
      action: 'user_action',
      userAction: action,
    });
  }

  performance(operation: string, duration: number, context?: LogContext) {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      ...context,
      action: 'performance',
      operation,
      duration,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, context?: LogContext, error?: Error) => logger.error(message, context, error);

// Export specific logging functions
export const logApiCall = (endpoint: string, method: string, context?: LogContext) => logger.apiCall(endpoint, method, context);
export const logApiError = (endpoint: string, method: string, error: Error, context?: LogContext) => logger.apiError(endpoint, method, error, context);
export const logNavigation = (from: string, to: string, context?: LogContext) => logger.navigation(from, to, context);
export const logRoleSwitch = (fromRole: string, toRole: string, context?: LogContext) => logger.roleSwitch(fromRole, toRole, context);
export const logDeepLink = (url: string, context?: LogContext) => logger.deepLink(url, context);
export const logUserAction = (action: string, context?: LogContext) => logger.userAction(action, context);
export const logPerformance = (operation: string, duration: number, context?: LogContext) => logger.performance(operation, duration, context);
