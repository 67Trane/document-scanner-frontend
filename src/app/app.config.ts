import { ApplicationConfig } from "@angular/core";
import { provideRouter, withHashLocation } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";

import { routes } from "./app.routes";
import { csrfInterceptor } from "./interceptors/csrf.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([csrfInterceptor])),
  ],
};
