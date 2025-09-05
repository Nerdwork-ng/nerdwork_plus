"use server";

import { axiosGet, axiosPost, axiosPostData } from "@/lib/api/apiClientAuth";
import { ComicSeriesFormData } from "@/lib/schema";
import axios from "axios";

export const uploadImage = async (data: FormData) => {
  try {
    console.log(data);
    // const response = await axiosPostData("elections/upload", data);

    return {
      success: true,
      //   data: response.data,
      data: "https://lh3.googleusercontent.com/a/ACg8ocLGqFhB_pRTuIdO7gzwJpEWSAIK5DZVLjAt0UhbqeqFUTOlEA=s96-c",
      message: "Image uploaded successfully",
    };
  } catch (error: unknown) {
    console.error("Failed to upload image", error);
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error.response?.status || 500,
        message:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to upload image. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to upload image. Please try again.",
    };
  }
};

export const createComicAction = async (data: ComicSeriesFormData) => {
  try {
    const requestBody = {
      title: data.title,
      language: data.language,
      ageRating: data.contentRating,
      description: data.description,
      image: data.coverImage,
      genre: data.genres,
      tags: data.tags,
    };

    const response = await axiosPost("comics/create", requestBody);

    return {
      success: true,
      data: response.data,
      message: "Comic created successfully.",
    };
  } catch (error: unknown) {
    console.error("Comic creation failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to create comic. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to create comic. Please try again.",
    };
  }
};

export const getCreatorComics = async () => {
  try {
    const response = await axiosGet("comics/mine");

    return {
      success: true,
      data: response.data,
      message: "Creator comics retrieved successfully.",
    };
  } catch (error: unknown) {
    console.error("Creator comics retrieval failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to retrieve creator comics. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to retrieve creator comics. Please try again.",
    };
  }
};

export const getSingleComic = async (slug: string) => {
  try {
    const response = await axiosGet(`comics/${slug}`);

    return {
      success: true,
      data: response.data,
      message: "Comic retrieved successfully.",
    };
  } catch (error: unknown) {
    console.error("Comic retrieval failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to retrieve creator comics. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to retrieve creator comics. Please try again.",
    };
  }
};
