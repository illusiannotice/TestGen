import axios from "axios";

export function setTestTemplate(funcName){
    const log = window.__APP_LOGS__;

    const parsed = log.filter((v) => {
        return v.name == funcName || v.caller == funcName
    });

    const data = {
        filteredLogs: parsed,
        targetFunction: funcName
    };

    return axios.post('http://localhost:8000/generate_test_templates', data);
}

export function generateTests(){
    return axios.post('http://localhost:8000/generate_tests');
}