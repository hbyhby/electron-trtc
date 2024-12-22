import isObject from 'lodash/isObject';
import isString from 'lodash/isString';

const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export function joinTimestamp<T extends boolean>(join: boolean, restful: T): T extends true ? string : object;

export function joinTimestamp(join: boolean, restful = false): string | object {
  if (!join) {
    return restful ? '' : {};
  }
  const now = new Date().getTime();
  if (restful) {
    return `?_t=${now}`;
  }
  return { _t: now };
}

// 格式化提交参数时间
export function formatRequestDate(params: Recordable) {
  if (Object.prototype.toString.call(params) !== '[object Object]') {
    return;
  }

  for (const key in params) {
    // eslint-disable-next-line no-underscore-dangle
    if (params[key] && params[key]._isAMomentObject) {
      params[key] = params[key].format(DATE_TIME_FORMAT);
    }
    if (isString(key)) {
      const value = params[key];
      if (value) {
        try {
          params[key] = isString(value) ? value.trim() : value;
        } catch (error: any) {
          throw new Error(error);
        }
      }
    }
    if (isObject(params[key])) {
      formatRequestDate(params[key]);
    }
  }
}

// 将对象转为Url参数
export function setObjToUrlParams(baseUrl: string, obj: { [index: string]: any }): string {
  let parameters = '';
  for (const key in obj) {
    parameters += `${key}=${encodeURIComponent(obj[key])}&`;
  }
  parameters = parameters.replace(/&$/, '');
  return /\?$/.test(baseUrl) ? baseUrl + parameters : baseUrl.replace(/\/?$/, '?') + parameters;
}


/**
 * Gets the value of the specified key from window.location.href.
 * @param {*} key The key to get
 * @returns The value corresponding to the key specified in window.location.href.
 * @example
 * const value = getUrlParam(key);
 */
export function getUrlParam(key: string) {
  const url = window?.location.href.replace(/^[^?]*\?/, '');
  const regexp = new RegExp(`(^|&)${key}=([^&#]*)(&|$|)`, 'i');
  const paramMatch = url?.match(regexp);

  return paramMatch ? paramMatch[2] : null;
}


/**
 * Get Theme
 * @returns Theme
 */
export function getTheme() {
  let storedTheme = localStorage.getItem('tuiRoom-currentTheme') || 'LIGHT';

  if (storedTheme === 'white') {
    storedTheme = 'LIGHT';
  } else if (storedTheme === 'black') {
    storedTheme = 'DARK';
  }

  return storedTheme;
}

export function setItemInSessionStorage(key: string, value: object) {
  sessionStorage.setItem(key, JSON.stringify(value));
}
