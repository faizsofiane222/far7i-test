// Secure logging utility for production environments

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private sanitizeError(error: unknown): string {
    if (error instanceof Error) {
      // En production, ne pas exposer les stack traces
      return isProduction ? error.message : error.stack || error.message;
    }
    return String(error);
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;
    
    // Filtrer les données sensibles
    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  error(message: string, error?: unknown, context?: LogContext) {
    const sanitizedContext = this.sanitizeContext(context);
    
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error, sanitizedContext);
    } else {
      // En production, logger uniquement le message
      console.error(`[ERROR] ${message}`);
      
      // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
      // if (window.Sentry) {
      //   window.Sentry.captureException(error, {
      //     extra: sanitizedContext,
      //     tags: { message }
      //   });
      // }
    }
  }

  warn(message: string, context?: LogContext) {
    const sanitizedContext = this.sanitizeContext(context);
    
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, sanitizedContext);
    }
  }

  info(message: string, context?: LogContext) {
    const sanitizedContext = this.sanitizeContext(context);
    
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, sanitizedContext);
    }
  }

  debug(message: string, context?: LogContext) {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }
}

export const logger = new Logger();
