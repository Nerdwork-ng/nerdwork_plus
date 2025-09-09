"use server";

import { axiosGet, axiosPost, axiosPostData } from "@/lib/api/apiClientAuth";
import { ChapterFormData, ComicSeriesFormData } from "@/lib/schema";
import axios from "axios";

export const uploadImage = async (data: FormData) => {
  try {
    const file = data.get("file") as File;

    if (!file) {
      return { error: "No file provided." };
    }
    const response = await axiosPostData("/file-upload/media", data);

    return {
      success: true,
      data: response.data.url,
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

    const response = await axiosPost("/comics/create", requestBody);

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
    const response = await axiosGet("/comics/mine");

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
    const response = await axiosGet(`/comics/${slug}`);

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

export const getSingleComicReader = async (slug: string) => {
  try {
    const response = await axiosGet(`/comics/reader/${slug}`);

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

export const getAllComicsForReader = async () => {
  try {
    const response = await axiosGet("/comics/all-comics");

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

export const createDraftChapter = async (
  data: ChapterFormData,
  comicId: string
) => {
  try {
    const requestBody = {
      title: data.chapterTitle,
      chapterType: data.chapterType,
      price: data.price,
      summary: data.summary,
      pages: data.chapterPages,
      comicId: comicId,
    };

    const response = await axiosPost("/chapters/draft", requestBody);

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

export const createComicChapter = async (
  data: ChapterFormData,
  comicId: string
) => {
  try {
    const requestBody = {
      title: data.chapterTitle,
      chapterType: data.chapterType,
      price: data.price,
      summary: data.summary,
      pages: data.chapterPages,
      comicId: comicId,
    };

    const response = await axiosPost("/chapters/create", requestBody);

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

export const getComicChaptersBySlug = async (slug: string) => {
  try {
    const response = await axiosGet(`/chapters/by-comic/creator/${slug}`);

    return {
      success: true,
      data: response.data,
      message: "Comic chapters retrieved successfully.",
    };
  } catch (error: unknown) {
    console.error("Comic chapters retrieval failed:", error);

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

export const getReaderComicChapters = async (slug: string) => {
  try {
    const response = await axiosGet(`/chapters/by-comic/reader/${slug}`);

    return {
      success: true,
      data: response.data,
      message: "Comic chapters retrieved successfully.",
    };
  } catch (error: unknown) {
    console.error("Comic chapters retrieval failed:", error);

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

export const getChapterPages = async (code: string) => {
  try {
    const response = await axiosGet(`/chapters/by-code/${code}`);

    return {
      success: true,
      data: response.data,
      message: "Comic chapters retrieved successfully.",
    };
  } catch (error: unknown) {
    console.error("Comic chapters retrieval failed:", error);

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
