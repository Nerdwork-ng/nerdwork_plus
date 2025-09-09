"use server";

import { auth } from "@/auth";
import { axiosGet, axiosPost, axiosPut } from "@/lib/api/apiClientAuth";
import axios from "axios";

type createReaderProfileData = {
  fullName: string;
  genres: string[];
};

type createCreatorProfileData = {
  fullName: string;
  creatorName: string;
  phoneNumber: string;
  bio: string;
};

export const createReaderProfile = async (data: createReaderProfileData) => {
  const getSession = await auth();
  try {
    const requestBody = {
      userId: getSession?.user.id,
      fullName: data.fullName,
      genres: data.genres,
    };

    const response = await axiosPost("/profile/reader", requestBody);

    return {
      success: true,
      data: response.data,
      message: "Reader Profile created successfully.",
    };
  } catch (error: unknown) {
    console.error("Reader profile creation failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to create reader profile. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to create reader profile. Please try again.",
    };
  }
};

export const createCreatorProfile = async (data: createCreatorProfileData) => {
  const getSession = await auth();
  try {
    const requestBody = {
      userId: getSession?.user.id,
      fullName: data.fullName,
      creatorName: data.creatorName,
      phoneNumber: data.phoneNumber,
      bio: data.bio,
    };

    const response = await axiosPost("/profile/creator", requestBody);

    return {
      success: true,
      data: response.data,
      message: "Creator Profile created successfully.",
    };
  } catch (error: unknown) {
    console.error("Creator profile creation failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to create creator profile. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to create creator profile. Please try again.",
    };
  }
};

export const getCreatorProfile = async () => {
  try {
    const response = await axiosGet("/profile/creator");

    return {
      success: true,
      data: response.data,
      message: "Profile details retrieved successfully.",
    };
  } catch (error: unknown) {
    console.error("Profile details retrieval failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to retrieve creator profile. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to retrieve creator profile. Please try again.",
    };
  }
};

export const getReaderProfile = async () => {
  try {
    const response = await axiosGet("/profile/reader");

    return {
      success: true,
      data: response.data,
      message: "Profile details retrieved successfully.",
    };
  } catch (error: unknown) {
    console.error("Profile details retrieval failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to retrieve reader profile. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to retrieve reader profile. Please try again.",
    };
  }
};

export const setReaderPin = async (data: string) => {
  try {
    const response = await axiosPut("/profile/reader/pin", { pin: data });

    return {
      success: true,
      data: response.data,
      message: "Reader pin set successfully.",
    };
  } catch (error: unknown) {
    console.error("Reader pin set failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to set reader pin. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to set reader pin. Please try again.",
    };
  }
};
