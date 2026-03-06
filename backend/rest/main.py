from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from utils.Ai_handler import AI_handler
from models.utility_models import AppLogs
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

handler = AI_handler()

@app.get('/')
def get_root():
    return {"status": "Test Generator API is running"}

@app.post('/generate_test_templates')
def get_test_templates(logs: AppLogs):
    """Generate test template from function logs"""
    try:
        result = handler.generate_templates(logs=logs)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/generate_tests')
def generate_tests():
    """Generate actual test code from template"""
    try:
        result = handler.generate_tests()
        
        if os.path.exists(result.path):
            return FileResponse(
                path=result.path,
                media_type=result.media_type,
                filename=result.name
            )
        
        return {"status": "success", "file": result.path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/logs')
def get_current_logs():
    """Debug endpoint to view current logs"""
    return {"logs": handler.template, "target_function": handler.target_function}