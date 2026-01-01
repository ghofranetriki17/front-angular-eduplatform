import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data?.['roles'] as string[] | undefined;

  return auth.ensureProfile().pipe(
    map(profile => {
      if (!profile) {
        router.navigate(['/login'], { queryParams: { redirectTo: state.url } });
        return false;
      }
      if (allowedRoles && !allowedRoles.includes(profile.role)) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
