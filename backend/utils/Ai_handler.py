from ollama import generate
from models.utility_models import AppLogs, TestGenResponse
import os
import json
import re
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

class AI_handler:
    def __init__(self):
        self.template_prompt: str = ''
        self.test_prompt: str = ''
        self.template: str = ''
        self.target_function: str = ''

        template_path = os.getenv('TEMPLATE_SYS_PROMPT')
        test_path = os.getenv('TEST_SYS_PROMPT')
        
        if not template_path or not test_path:
            raise ValueError("System prompt paths not configured in .env")
        
        with open(template_path, 'r') as template_sys:
            self.template_prompt = template_sys.read()
        
        with open(test_path, 'r') as test_sys:
            self.test_prompt = test_sys.read()
    
    def _serialize_logs(self, logs: AppLogs) -> str:
        log_entries: list[str] = []
        for log in logs.logs:
            log_entries.append(json.dumps(log.model_dump(), indent=2))
        return "\n---\n".join(log_entries)
    
    def _extract_code_block(self, response: str, language: str = 'javascript') -> str:
        """Extract code from markdown code blocks"""
        pattern = rf'```{language}(.*?)```'
        matches = re.findall(pattern, response, re.DOTALL)
        if matches:
            return matches[0].strip()
        return response
    
    def generate_templates(self, logs: AppLogs):
        """Generate test templates from function logs"""
        
        if not logs.logs:
            raise ValueError("No logs provided")
        
        if not logs.targetFunction:
            raise ValueError("Target function name not specified")
        
        self.target_function = logs.targetFunction
        
        # Build detailed prompt with actual logs
        logs_text = self._serialize_logs(logs)
        
        user_prompt = f"""
            ## FUNCTION LOGS TO ANALYZE
            Target Function: {logs.targetFunction}

            ### Log Entries:
            {logs_text}

            ### Analysis Requirements:
            1. Identify all function calls and their parameters
            2. Identify all return values and data types
            3. Identify all error scenarios
            4. Identify all called dependencies
            5. Identify call hierarchy and call stack

            Please generate a comprehensive test template based on these logs.
            """
        
        try:
            response = generate(
                model='mistral',
                prompt=user_prompt,
                system=self.template_prompt,
                stream=False
            )
            
            self.template = response['response']
            return {"status": "success", "template": self.template}
            
        except Exception as e:
            raise Exception(f"Template generation failed: {str(e)}")
    
    def generate_tests(self, output_dir: str = './generated_tests'):
        """Generate actual test code from templates"""
        
        if not self.template:
            raise ValueError("No template available. Call generate_templates first.")
        
        # Ensure output directory exists
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        user_prompt = f"""
            ## TEST IMPLEMENTATION TASK

            ### Test Template:
            {self.template}

            ### Requirements:
            1. Replace all TODO comments with actual implementations
            2. Use realistic test data from the function logs
            3. Implement all mock functions properly
            4. Ensure all tests are runnable immediately
            5. Use Jest/Vitest for JavaScript testing

            Please generate the complete, runnable test file.
            """
        
        try:
            response = generate(
                model='mistral',
                prompt=user_prompt,
                system=self.test_prompt,
                stream=False
            )
            
            test_code = self._extract_code_block(response['response'])
            
            # Determine file extension based on function name
            filename = f"test_{self.target_function}.test.js"
            filepath = os.path.join(output_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(test_code)
            
            return TestGenResponse(
                path=filepath,
                media_type='application/javascript',
                name=filename
            )
            
        except Exception as e:
            raise Exception(f"Test generation failed: {str(e)}")
