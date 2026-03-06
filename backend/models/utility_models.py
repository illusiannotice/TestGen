from pydantic import BaseModel
from typing import Literal, Any, Union

class BaseLogEntry(BaseModel):
    id: float
    timestamp: str
    caller: str

class NetworkStartLog(BaseLogEntry):
    type: Literal["NETWORK_START"]
    url: str
    method: str = "GET"
    headers: Any = None
    body: Any = None

class NetworkSuccessLog(BaseLogEntry):
    type: Literal["NETWORK_SUCCESS"]
    url: str
    method: str
    status: int
    response: Any

class NetworkErrorLog(BaseLogEntry):
    type: Literal["NETWORK_ERROR"]
    url: str
    method: str = "GET"
    error: str

class FunctionCallLog(BaseLogEntry):
    type: Literal["FUNCTION_CALL"]
    component: str | None = None
    name: str
    params: list[Any]
    body: str

class FunctionResultLog(BaseLogEntry):
    type: Literal["FUNCTION_RESULT", "FUNCTION_RESULT_ASYNC"]
    name: str
    returnValue: Any
    status: str = "success"

class FunctionErrorLog(BaseLogEntry):
    type: Literal["FUNCTION_ERROR", "FUNCTION_ERROR_ASYNC"]
    name: str
    error: str
    status: str = "error"

class StateChangeLog(BaseLogEntry):
    type: Literal["STATE_MUTATION"]
    storeName: str
    property: str
    oldValue: Any
    newValue: Any

class StoreActionLog(BaseLogEntry):
    type: Literal["STORE_ACTION", "STORE_ACTION_RESULT", "STORE_ACTION_ERROR"]
    storeName: str
    action: str
    params: list[Any] | None = None
    returnValue: Any = None
    error: str | None = None

class LifecycleLog(BaseLogEntry):
    type: Literal["LIFECYCLE"]
    component: str
    hook: str

class ComputedAccessLog(BaseLogEntry):
    type: Literal["COMPUTED_ACCESSED"]
    component: str
    computed: str

LogEntry = Union[
    NetworkStartLog, 
    NetworkSuccessLog, 
    NetworkErrorLog, 
    FunctionCallLog, 
    FunctionResultLog,
    FunctionErrorLog,
    StateChangeLog,
    StoreActionLog,
    LifecycleLog,
    ComputedAccessLog
]

class AppLogs(BaseModel):
    logs: list[LogEntry]
    targetFunction: str | None  = None

class TestGenResponse(BaseModel):
    path: str
    media_type: str
    name: str