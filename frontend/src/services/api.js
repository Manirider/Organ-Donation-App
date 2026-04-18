import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/me'),
    requestOTP: (target, type) => api.post('/auth/otp/request', { target, target_type: type }),
    verifyOTP: (target, otp) => api.post('/auth/otp/verify', { target, otp }),
};

export const donorService = {
    getOrganDonors: (params) => api.get('/organ-donors', { params }),
    getOrganDonor: (id) => api.get(`/organ-donors/${id}`),
    createOrganDonor: (data) => api.post('/organ-donors', data),
    updateOrganDonor: (id, data) => api.put(`/organ-donors/${id}`, data),
    giveConsent: (id, data) => api.post(`/organ-donors/${id}/consent`, data),
    revokeConsent: (id) => api.delete(`/organ-donors/${id}/consent`),
    searchNearby: (params) => api.get('/organ-donors/nearby', { params }),

    getBloodDonors: (params) => api.get('/blood-donors', { params }),
    getBloodDonor: (id) => api.get(`/blood-donors/${id}`),
    createBloodDonor: (data) => api.post('/blood-donors', data),
    updateAvailability: (id, available) => api.patch(`/blood-donors/${id}/availability`, { is_available: available }),
    searchBloodDonors: (data) => api.post('/blood-donors/search', data),
};

export const matchingService = {
    findOrganMatches: (data) => api.post('/matching/organ', data),
    acceptMatch: (id) => api.post(`/matching/${id}/accept`),
    getExplanation: (id) => api.get(`/matching/${id}/explain`),
};

export const healthService = {
    check: () => api.get('/../../health'),
    getApiInfo: () => api.get('/'),
};

export default api;
