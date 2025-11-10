import { API_BASE_URL, getDefaultHeaders } from "../config/api";

const buildUrl = (path = "", params = {}) => {
  const isAbsolute = /^https?:\/\//i.test(path);
  const url = new URL(isAbsolute ? path : `${API_BASE_URL}${path}`);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.append(key, value);
  });

  return url.toString();
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type");
  let payload = null;

  if (contentType && contentType.includes("application/json")) {
    payload = await response.json();
  } else if (contentType && contentType.includes("text/")) {
    payload = await response.text();
  }

  if (!response.ok) {
    const error = new Error(
      payload?.detail || payload?.error || "Error al comunicarse con la API"
    );
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
};

export const httpRequest = async (path, options = {}) => {
  const {
    method = "GET",
    params,
    data,
    headers: customHeaders,
    rawBody,
    ...rest
  } = options;

  const url = buildUrl(path, params);
  const headers = {
    ...getDefaultHeaders(),
    ...(customHeaders || {}),
  };

  const fetchOptions = {
    method,
    headers,
    ...rest,
  };

  if (data !== undefined && data !== null) {
    if (data instanceof FormData) {
      fetchOptions.body = data;
      delete fetchOptions.headers["Content-Type"];
    } else {
      fetchOptions.body = JSON.stringify(data);
    }
  } else if (rawBody) {
    fetchOptions.body = rawBody;
  }

  const response = await fetch(url, fetchOptions);
  return parseResponse(response);
};

export const http = {
  get: (path, options) => httpRequest(path, { ...options, method: "GET" }),
  post: (path, data, options) =>
    httpRequest(path, { ...options, method: "POST", data }),
  put: (path, data, options) =>
    httpRequest(path, { ...options, method: "PUT", data }),
  patch: (path, data, options) =>
    httpRequest(path, { ...options, method: "PATCH", data }),
  delete: (path, options) => httpRequest(path, { ...options, method: "DELETE" }),
};

export default http;
