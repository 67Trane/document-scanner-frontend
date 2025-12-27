import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.me().pipe(
    map(() => true),
    catchError((err) => {
      if (err?.status === 401) {
        return of(
          router.createUrlTree(["/login"], {
            queryParams: { returnUrl: state.url },
          })
        );
      }

      if (err?.status === 403) {
        return of(router.createUrlTree(["/login"]));
      }

      return of(router.createUrlTree(["/login"]));
    })
  );
};
