"use server";

import { axiosGet } from "@/lib/api/apiClientAuth";
import axios from "axios";

export const getReaderTransactionHistory = async () => {
  try {
    const response = await axiosGet("/transactions/reader");

    return {
      success: true,
      data: response.data,
      message: "Reader transactions retrieved successfully.",
    };
  } catch (error: unknown) {
    console.error("Reader transactions retrieval failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to retrieve transactions. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to retrieve transactions. Please try again.",
    };
  }
};

export const getCreatorTransactionHistory = async () => {
  try {
    const response = await axiosGet("/transactions/creator");

    return {
      success: true,
      data: response.data,
      message: "Creator transactions retrieved successfully.",
    };
  } catch (error: unknown) {
    console.error("Creator transactions retrieval failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to retrieve transactions. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to retrieve transactions. Please try again.",
    };
  }
};
