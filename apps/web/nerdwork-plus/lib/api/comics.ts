"use client";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// API Client for Comics
export const comicsApi = {
  // Get all published comics (public)
  async getPublishedComics() {
    try {
      const response = await axios.get(`${API_BASE_URL}/comics/published`);
      return response.data;
    } catch (error) {
      console.error("Error fetching published comics:", error);
      throw error;
    }
  },

  // Get creator's comics (requires auth)
  async getMyComics(token: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/comics/mine`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching my comics:", error);
      throw error;
    }
  },

  // Get comic by slug
  async getComicBySlug(slug: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/comics/${slug}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching comic by slug:", error);
      throw error;
    }
  },

  // Create comic (requires auth)
  async createComic(comicData: any, token: string) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/comics/create`,
        comicData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating comic:", error);
      throw error;
    }
  },

  // Publish comic (requires auth)
  async publishComic(comicId: string, token: string) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/comics/${comicId}/publish`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error publishing comic:", error);
      throw error;
    }
  },

  // Get chapters for a comic
  async getComicChapters(comicId: string, includePages = false) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/comics/${comicId}/chapters?includePages=${includePages}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching comic chapters:", error);
      throw error;
    }
  },

  // Create chapter (requires auth)
  async createChapter(comicId: string, chapterData: any, token: string) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/comics/${comicId}/chapters`,
        chapterData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating chapter:", error);
      throw error;
    }
  },

  // Get single chapter
  async getChapter(chapterId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/comics/chapters/${chapterId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching chapter:", error);
      throw error;
    }
  },

  // Update chapter (requires auth)
  async updateChapter(chapterId: string, chapterData: any, token: string) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/comics/chapters/${chapterId}`,
        chapterData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating chapter:", error);
      throw error;
    }
  },

  // Publish chapter (requires auth)
  async publishChapter(chapterId: string, token: string) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/comics/chapters/${chapterId}/publish`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error publishing chapter:", error);
      throw error;
    }
  },

  // Delete chapter (requires auth)
  async deleteChapter(chapterId: string, token: string) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/comics/chapters/${chapterId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting chapter:", error);
      throw error;
    }
  },
};

// File Upload API
export const fileApi = {
  // Upload single file
  async uploadFile(file: File, metadata?: any, token?: string) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Add metadata if provided
      if (metadata) {
        Object.keys(metadata).forEach(key => {
          formData.append(key, metadata[key]);
        });
      }

      const headers: any = {
        "Content-Type": "multipart/form-data",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(
        `${API_BASE_URL}/file/upload/single`,
        formData,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  },

  // Upload multiple files
  async uploadMultipleFiles(files: File[], metadata?: any, token?: string) {
    try {
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Add metadata if provided
      if (metadata) {
        Object.keys(metadata).forEach(key => {
          formData.append(key, metadata[key]);
        });
      }

      const headers: any = {
        "Content-Type": "multipart/form-data",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(
        `${API_BASE_URL}/file/upload/multiple`,
        formData,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading multiple files:", error);
      throw error;
    }
  },

  // Simple S3 upload
  async uploadToS3(file: File) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${API_BASE_URL}/file/upload/s3`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw error;
    }
  },
};