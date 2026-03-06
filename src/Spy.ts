import { LogEntry, SpyOptions, LogType } from './types';

/**
 * TestGenSpy - Advanced spy system for tracking function calls, network requests, and state changes
 */
export class TestGenSpy {
  private logs: LogEntry[] = [];
  private callStack: string[] = [];
  private options: Required<SpyOptions>;
  private wrappedFunctions = new WeakSet<Function>();
  private originalFetch: typeof fetch;

  constructor(options: SpyOptions = {}) {
    this.options = {
      maxLogSize: options.maxLogSize ?? 1000,
      captureNetwork: options.captureNetwork ?? true,
      captureStorage: options.captureStorage ?? false,
      filterPatterns: options.filterPatterns ?? [],
    };

    this.originalFetch = (globalThis as any).fetch;
    this.initializeSpies();
  }

  private initializeSpies(): void {
    if (this.options.captureNetwork && typeof window !== 'undefined') {
      this.spyOnFetch();
    }
  }

  /**
   * Add a log entry
   */
  private addLog(type: LogType, data: Record<string, any>): void {
    if (this.logs.length >= this.options.maxLogSize) {
      this.logs.shift();
    }

    const stack = new Error().stack?.split('\n') || [];
    const callerLine = stack[3] || 'unknown';
    const callerName = callerLine.trim().replace('at ', '').split(' ')[0];

    const entry: LogEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      caller: callerName,
      callStack: [...this.callStack],
      ...data,
    };

    this.logs.push(entry);
    if (typeof console !== 'undefined') {
      console.log(
        `%c[${type}]`,
        'color: #42b983; font-weight: bold',
        data.name || data.url
      );
    }
  }

  /**
   * Wrap a function to track calls and results
   */
  wrapFunction(fn: Function, name: string): Function {
    if (this.wrappedFunctions.has(fn)) return fn;

    const wrapped = (...args: any[]) => {
      this.callStack.push(name);

      this.addLog('FUNCTION_CALL', {
        name,
        params: this.serializeArgs(args),
        body: fn.toString().slice(0, 200),
      });

      try {
        const result = fn.apply(this, args);

        if (result instanceof Promise) {
          return result
            .then((res) => {
              this.addLog('FUNCTION_RESULT_ASYNC', {
                name,
                returnValue: this.serializeValue(res),
                status: 'success',
              });
              this.callStack.pop();
              return res;
            })
            .catch((err) => {
              this.addLog('FUNCTION_ERROR_ASYNC', {
                name,
                error: err.message,
                status: 'error',
              });
              this.callStack.pop();
              throw err;
            });
        } else {
          this.addLog('FUNCTION_RESULT', {
            name,
            returnValue: this.serializeValue(result),
          });
          this.callStack.pop();
          return result;
        }
      } catch (error) {
        this.addLog('FUNCTION_ERROR', {
          name,
          error: error instanceof Error ? error.message : String(error),
        });
        this.callStack.pop();
        throw error;
      }
    };

    this.wrappedFunctions.add(wrapped as Function);
    return wrapped;
  }

  /**
   * Wrap a Pinia store to track actions and mutations
   */
  wrapStore(store: any): void {
    Object.keys(store).forEach((key) => {
      if (typeof store[key] === 'function') {
        const originalAction = store[key];
        store[key] = (...args: any[]) => {
          this.addLog('STORE_ACTION', {
            storeName: store.$id || 'UnknownStore',
            action: key,
            params: this.serializeArgs(args),
          });

          const result = originalAction.apply(store, args);
          if (result instanceof Promise) {
            return result
              .then((res) => {
                this.addLog('STORE_ACTION_RESULT', {
                  storeName: store.$id || 'UnknownStore',
                  action: key,
                  returnValue: this.serializeValue(res),
                });
                return res;
              })
              .catch((err) => {
                this.addLog('STORE_ACTION_ERROR', {
                  storeName: store.$id || 'UnknownStore',
                  action: key,
                  error: err.message,
                });
                throw err;
              });
          }
          return result;
        };
      }
    });
  }

  /**
   * Spy on fetch requests
   */
  private spyOnFetch(): void {
    if (typeof window === 'undefined') return;

    (window as any).fetch = async (...args: any[]) => {
      const url = args[0];
      const method = (args[1]?.method || 'GET').toUpperCase();

      this.addLog('NETWORK_START', {
        url,
        method,
        headers: this.serializeValue(args[1]?.headers),
        body: args[1]?.body ? args[1].body.slice(0, 100) : null,
      });

      try {
        const response = await this.originalFetch.apply(this, args as Parameters<typeof fetch>);
        const clone = response.clone();

        clone
          .json()
          .then((data) =>
            this.addLog('NETWORK_SUCCESS', {
              url,
              method,
              status: response.status,
              response: this.serializeValue(data),
            })
          )
          .catch(() =>
            this.addLog('NETWORK_SUCCESS', {
              url,
              method,
              status: response.status,
              response: 'Non-JSON body',
            })
          );

        return response;
      } catch (error) {
        this.addLog('NETWORK_ERROR', {
          url,
          method,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };
  }

  /**
   * Create Vue mixin for component tracking
   */
  getVueMixin() {
    return {
      beforeCreate() {
        const componentName = (this as any).$options.name || 'AnonymousComponent';

        const methods = (this as any).$options.methods;
        if (methods) {
          Object.keys(methods).forEach((key) => {
            const originalMethod = methods[key];
            methods[key] = (...args: any[]) => {
              return originalMethod.apply(this, args);
            };
          });
        }
      },
      mounted() {
        const componentName = (this as any).$options.name || 'AnonymousComponent';
        if (typeof console !== 'undefined') {
          console.log(`Component mounted: ${componentName}`);
        }
      },
    };
  }

  /**
   * Serialize arguments safely
   */
  private serializeArgs(args: any[]): any[] {
    return args.map((arg) => {
      if (typeof arg === 'object' && arg !== null) {
        if (arg instanceof Error) return arg.message;
        try {
          return JSON.stringify(arg).slice(0, 500);
        } catch {
          return '[Circular or unserializable object]';
        }
      }
      return arg;
    });
  }

  /**
   * Serialize values safely
   */
  private serializeValue(value: any): any {
    if (value === null) return null;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).slice(0, 500);
      } catch {
        return '[Unserializable object]';
      }
    }
    return value;
  }

  /**
   * Get all collected logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs for a specific function
   */
  getLogsForFunction(functionName: string): LogEntry[] {
    return this.logs.filter(
      (log) => log.name === functionName || log.caller === functionName
    );
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
