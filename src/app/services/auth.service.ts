import { Injectable, inject, signal, computed } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, tap, throwError } from "rxjs";
import { AppConfig } from "../runtime-config";

export type MeResponse = { id: number; username: string };

export type LoginPayload = {
  username: string;
  remember: boolean;
};

@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = `${AppConfig.apiBaseUrl}/api/auth`;

  user = signal<MeResponse | null>(null);
  isReady = signal(false);

  isLoggedIn = computed(() => !!this.user());

  loadUser(): Observable<MeResponse> {
    return this.me().pipe(
      tap((u) => {
        this.user.set(u);
        this.isReady.set(true);
      }),
      catchError((err) => {
        this.user.set(null);
        this.isReady.set(true);
        return throwError(() => err);
      })
    );
  }

  /**
   * IMPORTANT: Call once before first POST/PATCH/DELETE to get csrftoken cookie.
   */
  initCsrf(): Observable<{ ok: boolean }> {
    return this.http.get<{ ok: boolean }>(`${this.baseUrl}/csrf/`);
  }

  login(payload: LoginPayload): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.baseUrl}/login/`, payload);
  }

  logout(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.baseUrl}/logout/`, {});
  }

  me(): Observable<{ id: number; username: string }> {
    return this.http.get<{ id: number; username: string }>(`${this.baseUrl}/me/`);
  }
}
