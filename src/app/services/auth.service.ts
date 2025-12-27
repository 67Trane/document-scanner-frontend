import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import { AppConfig } from "../config";

export type LoginPayload = {
  username: string;          
  password: string;
  remember: boolean;         
};

@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = `${AppConfig.apiBaseUrl}/api/auth`;

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
