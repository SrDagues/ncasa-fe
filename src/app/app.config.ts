import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './features/auth/infrastructure/http/auth.interceptor';
import { environment } from '../environments/environment';
import { HttpAuthRepository } from './features/auth/infrastructure/http/http-auth.repository';
import { LoginUseCase } from './features/auth/application/use-cases/login.use-case';
import { AuthStore } from './features/auth/presentation/auth.store';
import { RestoreSessionUseCase } from './features/auth/application/use-cases/restore-session.use-case';
import { firstValueFrom } from 'rxjs';
import { RefreshSessionCoordinator } from './features/auth/application/use-cases/refresh-session.coordinator';
import { LogoutUseCase } from './features/auth/application/use-cases/logout.use-case';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    AuthStore,
    {
      provide: HttpAuthRepository,
      useFactory: () => new HttpAuthRepository(inject(HttpClient), environment.apiUrl),
    },
    {
      provide: LoginUseCase,
      useFactory: () => new LoginUseCase(
        inject(HttpAuthRepository),
        inject(AuthStore),
      ),
    },
    {
      provide: RestoreSessionUseCase,
      useFactory: () => new RestoreSessionUseCase(
        inject(HttpAuthRepository),
        inject(AuthStore),
      ),
    },
    {
      provide: RefreshSessionCoordinator,
      useFactory: () => new RefreshSessionCoordinator(
        inject(HttpAuthRepository),
        inject(AuthStore),
      ),
    },
    {
      provide: LogoutUseCase,
      useFactory: () => new LogoutUseCase(
        inject(HttpAuthRepository),
        inject(AuthStore),
      ),
    },
    provideAppInitializer(() => firstValueFrom(inject(RestoreSessionUseCase).execute())),
  ]
};
