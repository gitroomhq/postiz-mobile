import { useCallback } from "react";

import { apiFetch, type FetchOptions } from "@/utils/custom-fetch";

export const useFetch = () => {
  return useCallback((path: string, options?: FetchOptions) => {
    return apiFetch(path, options);
  }, []);
};
