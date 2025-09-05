/* eslint-disable @typescript-eslint/no-explicit-any */

import { auth } from "@/auth";
import axios, { AxiosResponse } from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
async function getToken(): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      try {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
          const token = JSON.parse(storedToken);
          return token || "";
        }
      } catch (error) {
        console.error("Error retrieving token from localStorage:", error);
      }
    }

    const getSession = await auth();
    return getSession?.token ?? "";
  } catch (error) {
    console.error("Error retrieving token:", error);
    return "";
  }
}
async function getAuthHeader(): Promise<Record<string, string>> {
  if (typeof window !== "undefined") {
    try {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) return {};
      const token = JSON.parse(storedToken);
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      console.error("Error retrieving token from localStorage:", error);
      return {};
    }
  }
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
async function axiosGet<T = any>(
  url: string,
  isCustom?: boolean,
  params = {},
  contentType?: string,
  otherHeaders = {}
): Promise<AxiosResponse<T>> {
  const customContentType = contentType ? contentType : "application/json";
  const headers = await getAuthHeader();
  const config = {
    headers: {
      "Content-Type": customContentType,
      ...headers,
      ...otherHeaders,
    },
    params,
  };
  const fullUrl = isCustom ? url : `${apiUrl}${url}`;
  try {
    const response = await axios.get<T>(fullUrl, config);
    return response;
  } catch (error) {
    console.error(`Error in GET request to ${fullUrl}:`, error);
    throw error;
  }
}
async function axiosPost<T = any, D = any>(
  url: string,
  body: D,
  isCustom?: boolean,
  params = {}
): Promise<AxiosResponse<T>> {
  const headers = await getAuthHeader();
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    params,
  };
  const fullUrl = isCustom ? url : `${apiUrl}${url}`;
  try {
    const response = await axios.post<T>(fullUrl, body, config);
    return response;
  } catch (error) {
    console.error(`Error in POST request to ${fullUrl}:`, error);
    throw error;
  }
}

async function axiosPatch<T = any, D = any>(
  url: string,
  body: D,
  isCustom?: boolean,
  params = {}
): Promise<AxiosResponse<T>> {
  const headers = await getAuthHeader();
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    params,
  };
  const fullUrl = isCustom ? url : `${apiUrl}${url}`;
  try {
    const response = await axios.patch<T>(fullUrl, body, config);
    return response;
  } catch (error) {
    console.error(`Error in PATCH request to ${fullUrl}:`, error);
    throw error;
  }
}

async function axiosPostData<T = any>(
  url: string,
  body: FormData,
  isCustom?: boolean,
  params = {}
): Promise<AxiosResponse<T>> {
  const headers = await getAuthHeader();
  const config = {
    headers: {
      // No Content-Type needed for FormData (browser sets it with boundary)
      ...headers,
    },
    params,
  };
  const fullUrl = isCustom ? url : `${apiUrl}${url}`;
  try {
    const response = await axios.post<T>(fullUrl, body, config);
    return response;
  } catch (error) {
    console.error(`Error in FormData POST request to ${fullUrl}:`, error);
    throw error;
  }
}
async function axiosPostFormData<T = any>(
  url: string,
  body: FormData,
  isCustom?: boolean,
  params = {}
): Promise<AxiosResponse<T>> {
  const headers = await getAuthHeader();
  const config = {
    headers: {
      // No Content-Type needed for FormData (browser sets it with boundary)
      ...headers,
    },
    params,
  };
  const fullUrl = isCustom ? url : `${apiUrl}${url}`;
  try {
    const response = await axios.post<T>(fullUrl, body, config);
    return response;
  } catch (error) {
    console.error(`Error in FormData POST request to ${fullUrl}:`, error);
    throw error;
  }
}
async function axiosDelete<T = any>(
  url: string,
  isCustom?: boolean,
  params = {}
): Promise<AxiosResponse<T>> {
  const headers = await getAuthHeader();
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    params,
  };
  const fullUrl = isCustom ? url : `${apiUrl}${url}`;

  try {
    const response = await axios.delete<T>(fullUrl, config);
    // console.log("DELETE Response Data:", response.data);

    return response;
  } catch (error) {
    console.error(`Error in DELETE request to ${fullUrl}:`, error);
    throw error;
  }
}

export {
  axiosGet,
  axiosPost,
  axiosPostData,
  axiosPatch,
  axiosPostFormData,
  axiosDelete,
};
