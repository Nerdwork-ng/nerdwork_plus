"use server";

import {
  axiosDelete,
  axiosGet,
  axiosPost,
  axiosPostData,
} from "@/lib/api/apiClientAuth";
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

export const purchaseChapterComic = async (
  nwtAmount: number,
  pin: string,
  chapterId: string
) => {
  try {
    const requestBody = {
      nwtAmount,
      pin,
      chapterId,
    };

    const response = await axiosPost("/chapters/purchase", requestBody);

    return {
      success: true,
      data: response.data,
      message: "Chapter purchased successfully.",
    };
  } catch (error: unknown) {
    console.error("Chapter purchased failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to purchased comic. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to purchase comics. Please try again.",
    };
  }
};

export const addViewCountAction = async (chapterId: string) => {
  try {
    const response = await axiosPost("/chapters/view", { chapterId });

    return {
      success: true,
      data: response.data,
      message: "Chapter view added successfully.",
    };
  } catch (error: unknown) {
    console.error("Chapter view added failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to add chapter view. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to add chapter view comics. Please try again.",
    };
  }
};

export const likeChapterAction = async (chapterId: string) => {
  try {
    const response = await axiosPost(`/chapters/${chapterId}/like`, {});

    return {
      success: true,
      data: response.data,
      message: response.data.message,
    };
  } catch (error: unknown) {
    console.error("Chapter like failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to like chapter. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to like chapter. Please try again.",
    };
  }
};

export const subscribeToComicAction = async (comicId: string) => {
  try {
    const response = await axiosPost(`/comics/subscribe/${comicId}`, {});

    return {
      success: true,
      data: response.data,
      message: response.data.message,
    };
  } catch (error: unknown) {
    console.error("Chapter like failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to like chapter. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to like chapter. Please try again.",
    };
  }
};

export const deleteComicSeries = async (slug?: string) => {
  try {
    const response = await axiosDelete(`/comics/delete/${slug}`);

    return {
      success: true,
      data: response.data,
      message: "Comic series deleted successfully.",
    };
  } catch (error: unknown) {
    console.error("Comic series deletion failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to delete comic series. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to delete comic series. Please try again.",
    };
  }
};

export const deleteChapterAction = async (code?: string) => {
  try {
    const response = await axiosDelete(`/chapters/delete/${code}`);

    return {
      success: true,
      data: response.data,
      message: "Chapter deleted successfully.",
    };
  } catch (error: unknown) {
    console.error("Chapter deletion failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to delete comic series. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to delete comic series. Please try again.",
    };
  }
};

export const publishDraft = async (
  draftUniqCode: string,
  comicSlug: string
) => {
  try {
    console.log(draftUniqCode, comicSlug);
    const response = await axiosPost(`/chapters/draft/publish`, {
      draftUniqCode,
      comicSlug,
    });
    console.log(response.data);

    return {
      success: true,
      data: response.data,
      message: "Draft chapter published successfully",
    };
  } catch (error: unknown) {
    console.error("Chapter publish failed:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error?.status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to publish chapter. Please try again.",
      };
    }
    return {
      success: false,
      status: 500,
      message: "Failed to publish chapter. Please try again.",
    };
  }
};
