"use server";
import { axiosDelete, axiosGet, axiosPost } from "@/lib/api/apiClientAuth";
import axios from "axios";

export const getLibraryComics = async () => {
  try {
    const response = await axiosGet("library");

    return {
      success: true,
      data: response.data,
      message: "Reader library retrieved successfully.",
    };
  } catch (error: unknown) {
    console.error("Reader library retrieval failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to retrieve library comics. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to retrieve library comics. Please try again.",
    };
  }
};

export const addToLibrary = async (data: string) => {
  try {
    const response = await axiosPost("library", { comicId: data });

    return {
      success: true,
      data: response.data,
      message: "Comic added to library successfully.",
    };
  } catch (error: unknown) {
    console.error("Comic added to library failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to add comic to library. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to add comic to library. Please try again.",
    };
  }
};

export const removeFromLibrary = async (comicId: string) => {
  try {
    const response = await axiosDelete(`library/${comicId}`);
    return {
      success: true,
      data: response.data,
      message: "Comic removed from library successfully.",
    };
  } catch (error: unknown) {
    console.error("Comic removed from library failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to remove comic from library. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to remove comic from library. Please try again.",
    };
  }
};
