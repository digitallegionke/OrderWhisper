export const logError = (error: Error, context: Record<string, any> = {}) => {
  // In production, you would send this to your error monitoring service
  // Example: Sentry.captureException(error, { extra: context });
  console.error('Error:', error.message, {
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
  });
};

export const logInfo = (message: string, data: Record<string, any> = {}) => {
  // In production, you would send this to your logging service
  console.info('Info:', message, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

export const trackMetric = (name: string, value: number, tags: Record<string, string> = {}) => {
  // In production, you would send this to your metrics service
  // Example: StatsD, Datadog, etc.
  console.log('Metric:', {
    name,
    value,
    tags,
    timestamp: new Date().toISOString(),
  });
}; 