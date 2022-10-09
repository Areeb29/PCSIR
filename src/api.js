import axios from 'axios';
import url from './config'

const api = axios.create({
    baseURL: `${url}`,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    },
    // withCredentials: true
})

export default api