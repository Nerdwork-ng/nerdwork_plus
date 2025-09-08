import { getCreatorProfile, getReaderProfile } from "@/actions/profile.actions";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export const useUserSession = () => {
  const { data: session } = useSession();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["user", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        return null;
      }

      let userData;
      if (session?.cProfile) {
        userData = await getCreatorProfile();
      } else if (session?.rProfile) {
        userData = await getReaderProfile();
      }

      if (userData?.success && userData?.data?.profile) {
        return userData.data.profile;
      }

      return null;
    },
    enabled: !!session?.user?.id,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return {
    profile: data, // Rename `data` to `profile` for clarity
    isLoading,
    error,
    refetch,
  };
};
