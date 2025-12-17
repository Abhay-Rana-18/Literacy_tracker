import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Create axios instance
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// Auth API calls
export const authAPI = {
    login: async (data: { email: string; password: string; role: string }) => {
        const response = await apiClient.post('/auth/login', data)
        return response.data
    },

    register: async (data: { email: string; password: string; name: string; role: string }) => {
        const response = await apiClient.post('/auth/register', data)
        return response.data
    },
}

// General API helper
export const api = {
    get: async (url: string, config = {}) => {
        const response = await apiClient.get(url, config)
        return response.data
    },

    post: async (url: string, data: any, config = {}) => {
        const response = await apiClient.post(url, data, config)
        return response.data
    },

    put: async (url: string, data: any, config = {}) => {
        const response = await apiClient.put(url, data, config)
        return response.data
    },

    delete: async (url: string, config = {}) => {
        const response = await apiClient.delete(url, config)
        return response.data
    },

    patch: async (url: string, data: any, config = {}) => {
        const response = await apiClient.patch(url, data, config)
        return response.data
    },
}

export default apiClient
