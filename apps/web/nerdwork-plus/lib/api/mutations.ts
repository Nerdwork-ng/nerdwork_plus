import { uploadImage } from "@/actions/comic.actions";
import { useMutation } from "@tanstack/react-query";

export const useUploadImage = () => {
  return useMutation({
    mutationFn: (data: FormData) => uploadImage(data),
    // You can add onMutate, onError, onSuccess, and onSettled callbacks here
  });
};

export const useUploadMultiImages = () => {
  return useMutation({
    mutationFn: async (filesToUpload: File[]) => {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return await uploadImage(formData);
      });
      return Promise.all(uploadPromises);
    },
  });
};
