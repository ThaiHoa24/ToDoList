export const AUTH_TOKEN_KEY = "token";
export const AUTH_USER_KEY = "currentUser";

export function setAuthSession(
  token: string,
  user: { name?: string; email?: string; [key: string]: unknown }
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    // 7 days expiration
    document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(
      token
    )}; path=/; max-age=604800; SameSite=Lax`;
  } catch (e) {
    console.error("Failed to save auth session", e);
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  try {
    // 1. Xóa token và user khỏi localStorage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);

    // 2. Xóa khỏi sessionStorage (nếu có lưu tạm)
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);

    // 3. Xóa cookie triệt để
    document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

    // 4. Phát sự kiện để các component khác lập tức cập nhật lại trạng thái
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to clear auth session", e);
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) return token;

    const match = document.cookie.match(
      new RegExp(`(^|; )${AUTH_TOKEN_KEY}=([^;]+)`)
    );
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}
