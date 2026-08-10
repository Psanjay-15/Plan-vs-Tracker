import axios from "axios";

interface ApiErrorBody {
  message?: string;
}

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || fallbackMessage;
  }

  return fallbackMessage;
};
