import { Observable } from 'rxjs';
import {
  AuthenticatedSession,
  LoginCredentials,
  RegistrationData,
  RegistrationResult,
  User,
} from '../../domain/auth.models';

export interface AuthRepository {
  login(credentials: LoginCredentials): Observable<AuthenticatedSession>;
  register(data: RegistrationData): Observable<RegistrationResult>;
  confirmEmail(token: string): Observable<void>;
  resendEmailVerification(email: string): Observable<void>;
  refresh(): Observable<AuthenticatedSession>;
  logout(): Observable<void>;
  me(): Observable<User>;
}
