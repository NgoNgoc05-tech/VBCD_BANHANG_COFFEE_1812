import axios from "axios"

interface ValidationErrorItem {
  msg?: string
}

interface ApiErrorResponse {
  detail?: string | ValidationErrorItem[]
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback
  }

  const detail = error.response?.data?.detail
  if (typeof detail === "string") {
    return detail
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => item.msg)
      .filter((message): message is string => Boolean(message))
      .join(" ")
  }
  return fallback
}
