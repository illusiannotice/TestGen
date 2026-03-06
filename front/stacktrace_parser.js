(function createAdvancedVueSpy() {
    window.__APP_LOGS__ = [];
    let callStack = [];

    const logger = {
        add(type, data) {
            const stack = new Error().stack.split('\n');
            const callerLine = stack[3] || 'unknown';
            const callerName = callerLine.trim().replace('at ', '').split(' ')[0];

            const entry = {
                id: Date.now() + Math.random(),
                timestamp: new Date().toLocaleTimeString(),
                type,
                caller: callerName,
                callStack: [...callStack],
                ...data
            };
            
            window.__APP_LOGS__.push(entry);
            console.log(`%c[${type}]`, 'color: #42b983; font-weight: bold', data.name || data.url);
        }
    };
    
    const wrappedFunctions = new WeakSet();

    function wrapFunction(fn, name) {
        if (wrappedFunctions.has(fn)) return fn;
        
        const wrapped = function(...args) {
            callStack.push(name);
            
            logger.add('FUNCTION_CALL', {
                type: 'COMPOSABLE_CALL',
                name: name,
                params: serializeArgs(args),
                body: fn.toString().slice(0, 200)
            });

            try {
                const result = fn.apply(this, args);
                
                if (result instanceof Promise) {
                    return result
                        .then(res => {
                            logger.add('FUNCTION_RESULT_ASYNC', {
                                name: name,
                                returnValue: serializeValue(res),
                                status: 'success'
                            });
                            callStack.pop();
                            return res;
                        })
                        .catch(err => {
                            logger.add('FUNCTION_ERROR_ASYNC', {
                                name: name,
                                error: err.message,
                                status: 'error'
                            });
                            callStack.pop();
                            throw err;
                        });
                } else {
                    logger.add('FUNCTION_RESULT', {
                        name: name,
                        returnValue: serializeValue(result)
                    });
                    callStack.pop();
                    return result;
                }
            } catch (error) {
                logger.add('FUNCTION_ERROR', {
                    name: name,
                    error: error.message
                });
                callStack.pop();
                throw error;
            }
        };
        
        wrappedFunctions.add(wrapped);
        return wrapped;
    }
    
    function wrapPiniaStore(store) {
        Object.keys(store).forEach(key => {
            if (typeof store[key] === 'function') {
                const originalAction = store[key];
                store[key] = function(...args) {
                    logger.add('STORE_ACTION', {
                        storeName: store.$id || 'UnknownStore',
                        action: key,
                        params: serializeArgs(args)
                    });
                    
                    const result = originalAction.apply(this, args);
                    if (result instanceof Promise) {
                        return result.then(res => {
                            logger.add('STORE_ACTION_RESULT', {
                                storeName: store.$id || 'UnknownStore',
                                action: key,
                                returnValue: serializeValue(res)
                            });
                            return res;
                        }).catch(err => {
                            logger.add('STORE_ACTION_ERROR', {
                                storeName: store.$id || 'UnknownStore',
                                action: key,
                                error: err.message
                            });
                            throw err;
                        });
                    }
                    return result;
                };
            }
        });
        
        if (store.$state) {
            const handler = {
                set: (target, property, value) => {
                    logger.add('STATE_MUTATION', {
                        storeName: store.$id || 'UnknownStore',
                        property,
                        oldValue: serializeValue(target[property]),
                        newValue: serializeValue(value)
                    });
                    target[property] = value;
                    return true;
                }
            };
            return new Proxy(store.$state, handler);
        }
    }

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = args[0];
        const method = (args[1]?.method || 'GET').toUpperCase();
        
        logger.add('NETWORK_START', { 
            url, 
            method,
            headers: serializeValue(args[1]?.headers),
            body: args[1]?.body ? args[1].body.slice(0, 100) : null
        });

        try {
            const response = await originalFetch(...args);
            const clone = response.clone();
            
            clone.json()
                .then(data => logger.add('NETWORK_SUCCESS', { 
                    url, 
                    method,
                    status: response.status,
                    response: serializeValue(data) 
                }))
                .catch(() => logger.add('NETWORK_SUCCESS', { 
                    url, 
                    method,
                    status: response.status,
                    response: 'Non-JSON body' 
                }));

            return response;
        } catch (error) {
            logger.add('NETWORK_ERROR', { url, method, error: error.message });
            throw error;
        }
    };
    
    window.__VUE_SPY_MIXIN__ = {
        beforeCreate() {
            const componentName = this.$options.name || 'AnonymousComponent';
            
            const methods = this.$options.methods;
            if (methods) {
                Object.keys(methods).forEach(key => {
                    const originalMethod = methods[key];
                    methods[key] = wrapFunction(originalMethod, `${componentName}.${key}`);
                });
            }

            const computed = this.$options.computed;
            if (computed) {
                Object.keys(computed).forEach(key => {
                    logger.add('COMPUTED_ACCESSED', {
                        component: componentName,
                        computed: key
                    });
                });
            }
        },

        mounted() {
            logger.add('LIFECYCLE', {
                component: this.$options.name || 'AnonymousComponent',
                hook: 'mounted'
            });
        }
    };
    
    function serializeArgs(args) {
        return args.map(arg => {
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

    function serializeValue(value) {
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
    
    window.__WRAP_FUNCTION__ = function(fn, fnName) {
        return wrapFunction(fn, fnName);
    };

    window.__WRAP_STORE__ = wrapPiniaStore;
})();