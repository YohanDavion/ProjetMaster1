import { inject, isDevMode } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs/operators';

import { AccountService } from 'app/core/auth/account.service';
import { StateStorageService } from './state-storage.service';

export const UserRouteAccessService: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const accountService = inject(AccountService);
  const router = inject(Router);
  const stateStorageService = inject(StateStorageService);

  return accountService.identity().pipe(
    map(account => {
      if (account) {
        const authorities = next.data['authorities'];

        // Ajouter 'ROLE_RH' chaque fois que 'ROLE_ADMIN' est requis
        if (authorities && authorities.includes('ROLE_ADMIN')) {
          authorities.push('ROLE_RH');
        }

        // Si l'utilisateur est un vélo, rediriger vers /tournees
        if (account.authorities.includes('ROLE_VELO') && state.url === '/') {
          router.navigate(['/tournees']);
          return false;
        }

        // Vérifier les autres autorités
        if (!authorities || authorities.length === 0 || accountService.hasAnyAuthority(authorities)) {
          return true;
        }

        // Si l'utilisateur n'a pas les autorisations requises
        if (isDevMode()) {
          console.error('User does not have any of the required authorities:', authorities);
        }
        router.navigate(['accessdenied']);
        return false;
      }

      // Si l'utilisateur n'est pas authentifié, le rediriger vers la page de connexion
      stateStorageService.storeUrl(state.url);
      router.navigate(['/login']);
      return false;
    }),
  );
};
