import axios, { AxiosInstance } from 'axios';
import { LogEntry, TestGenerationResponse, TestTemplateResponse } from './types';


export class TestGenClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Send logs and generate test template
   */
  async generateTemplate(
    logs: LogEntry[],
    targetFunction: string
  ): Promise<TestTemplateResponse> {
    try {
      console.log(
        `📤 Sending ${logs.length} logs for function: ${targetFunction}`
      );

      const response = await this.client.post<TestTemplateResponse>(
        '/generate_test_templates',
        {
          logs,
          targetFunction,
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate actual test code from template
   */
  async generateTests(): Promise<TestGenerationResponse> {
    try {
      const response = await this.client.post<TestGenerationResponse>(
        '/generate_tests'
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/`);
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Set custom base URL
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }

  /**
   * Get current base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}
