import axios from "axios";

const api = axios.create({
    baseURL: "https://shift-management-api-evju.onrender.com"
});

export default api;