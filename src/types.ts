export type LogType = 
  | 'FUNCTION_CALL'
  | 'FUNCTION_RESULT'
  | 'FUNCTION_ERROR'
  | 'FUNCTION_RESULT_ASYNC'
  | 'FUNCTION_ERROR_ASYNC'
  | 'NETWORK_START'
  | 'NETWORK_SUCCESS'
  | 'NETWORK_ERROR'
  | 'STORE_ACTION'
  | 'STORE_ACTION_RESULT'
  | 'STORE_ACTION_ERROR'
  | 'STATE_MUTATION'
  | 'LIFECYCLE'
  | 'COMPUTED_ACCESSED';

export interface LogEntry {
  id: number;
  timestamp: string;
  type: LogType;
  caller: string;
  callStack: string[];
  [key: string]: any;
}

export interface SpyOptions {
  maxLogSize?: number;
  captureNetwork?: boolean;
  captureStorage?: boolean;
  filterPatterns?: RegExp[];
}

export interface TestTemplateResponse {
  status: string;
  template: string;
}

export interface TestGenerationResponse {
  path: string;
  media_type: string;
  name: string;
}
