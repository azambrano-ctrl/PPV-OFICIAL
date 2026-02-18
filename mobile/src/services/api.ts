import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base de la API (ajustar segun entorno)
// Para Android Emulator usar 10.0.2.2 en lugar de localhost
// Para iOS Simulator usar localhost o la IP de tu maquina
const API_URL = 'http://10.0.2.2:5000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para añadir el token JWT a todas las peticiones
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores globales (ej: token expirado)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Manejar logout si el token no es valido
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

export default api;
