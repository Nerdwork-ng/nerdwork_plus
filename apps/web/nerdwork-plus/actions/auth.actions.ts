"use server";

import { axiosPost } from "@/lib/api/apiClient";
import axios from "axios";

export const googleAuth = async (idToken: string) => {
  try {
    const response = await axiosPost("/auth/signin", { idToken });

    return {
      success: true,
      data: response.data,
      message: "Authentication Successful",
      status: response?.status ?? 200,
    };
  } catch (error: unknown) {
    console.error(error);
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status ?? 500,
        message:
          error?.response?.data?.detail ??
          error.response?.data.message ??
          "Google sign in failed. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Google sign in failed. Please try again.",
    };
  }
};
