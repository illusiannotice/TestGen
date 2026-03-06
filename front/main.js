import { setTestTemplate, generateTests } from "./api.js";

const funcName = process.argv[2];

setTestTemplate(funcName);
generateTests();

