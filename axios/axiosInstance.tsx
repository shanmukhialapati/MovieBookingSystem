import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "http://10.20.0.99:8080/api";

export const authApi = axios.create({
  baseURL: `${BASE_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const mainApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const attachToken = (instance: any) => {
  instance.interceptors.request.use(
    async (config: any) => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.log("Token fetch error:", err);
      }
      return config;
    },
    (error: any) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      console.log("API ERROR:", error?.response?.data || error.message);

      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem("token");
      }

      return Promise.reject(error);
    },
  );
};

attachToken(mainApi);
attachToken(authApi);

export default mainApi;
