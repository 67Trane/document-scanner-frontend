import { HttpInterceptorFn } from "@angular/common/http";

function getCookie(name: string): string | null {
  // NOTE: Comments in English as requested.
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift() ?? null;
  return null;
}

function isUnsafeMethod(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  // Always send cookies (sessionid + csrftoken)
  let request = req.clone({ withCredentials: true });

  // Add CSRF header for unsafe methods
  if (isUnsafeMethod(req.method)) {
    const token = getCookie("csrftoken");
    if (token) {
      request = request.clone({
        setHeaders: { "X-CSRFToken": token },
      });
    }
  }

  return next(request);
};
