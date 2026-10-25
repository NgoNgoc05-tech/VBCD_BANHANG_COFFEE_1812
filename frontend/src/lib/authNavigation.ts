interface AuthNavigationState {
  from?: {
    pathname?: string
    search?: string
    hash?: string
  }
}

export function getPostAuthPath(state: unknown): string {
  const storedPath =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem("phin-bean-return-to")
      : null
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem("phin-bean-return-to")
  }

  if (state && typeof state === "object" && "from" in state) {
    const from = (state as AuthNavigationState).from
    if (from?.pathname?.startsWith("/") && !from.pathname.startsWith("//")) {
      return `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
    }
  }

  if (storedPath?.startsWith("/") && !storedPath.startsWith("//")) {
    return storedPath
  }
  return "/"
}
