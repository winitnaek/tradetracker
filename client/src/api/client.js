import axios from 'axios';
const api = axios.create({ baseURL: '/api', withCredentials: true });
api.interceptors.response.use(response => response, error => Promise.reject(new Error(error.response?.data?.message || 'Unable to complete the request.')));
export default api;

