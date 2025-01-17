import { Logger } from './Logger';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    memory: ComponentHealth;
  };
  metrics: {
    memoryUsage: number;
  };
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: string;
  message?: string;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  component: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class Monitor {
  private static instance: Monitor;
  private alerts: Alert[] = [];
  private readonly maxAlerts = 1000;
  private readonly healthCheckInterval: NodeJS.Timeout;
  private readonly memoryThresholds = {
    warning: 0.8, // 80% usage
    critical: 0.9, // 90% usage
  };
  private readonly errorRateThresholds = {
    warning: 0.05, // 5% error rate
    critical: 0.1, // 10% error rate
  };

  private constructor() {
    // Start health checks
    this.healthCheckInterval = setInterval(
      () => this.performHealthCheck(),
      60000 // Run every minute
    );

    // Setup error tracking
    this.setupErrorTracking();
  }

  public static getInstance(): Monitor {
    if (!Monitor.instance) {
      Monitor.instance = new Monitor();
    }
    return Monitor.instance;
  }

  /**
   * Performs a comprehensive health check of the system
   */
  private async performHealthCheck(): Promise<SystemHealth> {
    const timestamp = new Date().toISOString();
    const memoryUsage = process.memoryUsage();
    const heapUsed = memoryUsage.heapUsed / memoryUsage.heapTotal;

    // Check memory health
    const memoryHealth = this.checkMemoryHealth(heapUsed);

    const health: SystemHealth = {
      status: 'healthy',
      timestamp,
      components: {
        memory: memoryHealth,
      },
      metrics: {
        memoryUsage: heapUsed,
      },
    };

    // Determine overall system status
    if (memoryHealth.status === 'unhealthy') {
      health.status = 'unhealthy';
    } else if (memoryHealth.status === 'degraded') {
      health.status = 'degraded';
    }

    // Log health status
    Logger.info('System health check completed', { health });

    // Generate alerts if needed
    this.generateHealthAlerts(health);

    return health;
  }

  /**
   * Checks memory health
   */
  private checkMemoryHealth(heapUsage: number): ComponentHealth {
    const health: ComponentHealth = {
      status: 'healthy',
      lastChecked: new Date().toISOString(),
    };

    if (heapUsage > this.memoryThresholds.critical) {
      health.status = 'unhealthy';
      health.message = 'Critical memory usage detected';
    } else if (heapUsage > this.memoryThresholds.warning) {
      health.status = 'degraded';
      health.message = 'High memory usage detected';
    }

    return health;
  }

  /**
   * Generates alerts based on health check results
   */
  private generateHealthAlerts(health: SystemHealth): void {
    // Check memory health
    if (health.components.memory.status === 'unhealthy') {
      this.addAlert({
        severity: 'critical',
        component: 'memory',
        message: health.components.memory.message || 'Critical memory usage',
        metadata: {
          memoryUsage: health.metrics.memoryUsage,
        },
      });
    }
  }

  /**
   * Adds a new alert
   */
  public addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
    const newAlert: Alert = {
      ...alert,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.alerts.unshift(newAlert);

    // Trim alerts if we exceed max size
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }

    // Log the alert
    Logger[alert.severity === 'critical' ? 'error' : 'warn'](
      `[${alert.component}] ${alert.message}`,
      alert.metadata
    );
  }

  /**
   * Sets up global error tracking
   */
  private setupErrorTracking(): void {
    if (typeof window !== 'undefined') {
      // Browser environment
      window.addEventListener('error', (event) => {
        this.addAlert({
          severity: 'error',
          component: 'frontend',
          message: event.message,
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.addAlert({
          severity: 'error',
          component: 'frontend',
          message: 'Unhandled Promise Rejection',
          metadata: {
            reason: event.reason,
          },
        });
      });
    } else {
      // Node.js environment
      process.on('uncaughtException', (error) => {
        this.addAlert({
          severity: 'critical',
          component: 'backend',
          message: 'Uncaught Exception',
          metadata: {
            error: error.message,
            stack: error.stack,
          },
        });
      });

      process.on('unhandledRejection', (reason) => {
        this.addAlert({
          severity: 'error',
          component: 'backend',
          message: 'Unhandled Promise Rejection',
          metadata: {
            reason,
          },
        });
      });
    }
  }

  /**
   * Gets recent alerts
   */
  public getAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(0, limit);
  }

  /**
   * Gets alerts by severity
   */
  public getAlertsBySeverity(severity: Alert['severity']): Alert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Gets alerts by component
   */
  public getAlertsByComponent(component: string): Alert[] {
    return this.alerts.filter(alert => alert.component === component);
  }

  /**
   * Clears all alerts
   */
  public clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Stops the monitor
   */
  public stop(): void {
    clearInterval(this.healthCheckInterval);
  }
}

// Export singleton instance
export const monitor = Monitor.getInstance();
