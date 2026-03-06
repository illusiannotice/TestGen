export { TestGenSpy } from './Spy';
export { TestGenClient } from './Client';
export type {
  LogEntry,
  LogType,
  SpyOptions,
  TestTemplateResponse,
  TestGenerationResponse,
} from './types';

// Browser globals
if (typeof window !== 'undefined') {
  (window as any).__testGenLoaded = true;
}
