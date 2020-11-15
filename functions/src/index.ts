import { forEach } from 'lodash';
import { isDevelopment } from './utils/env';

const functionMap = {
  fetchCalendar: './fetch-calendar',
  registerBooks: './register-books'
};

const devFunctionMap = {
  publishers: './publishers'
};

const loadFunctions = (fnMap: typeof functionMap) => {
  forEach(fnMap, (path, functionName) => {
    if (
      !process.env.FUNCTION_TARGET ||
      process.env.FUNCTION_TARGET === functionName
    ) {
      module.exports[functionName] = require(path);
    }
  });
};

const fnMap = isDevelopment() ? { ...functionMap, ...devFunctionMap } : functionMap;
loadFunctions(fnMap);
