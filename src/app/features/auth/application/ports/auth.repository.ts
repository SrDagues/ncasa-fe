import { Observable } from 'rxjs';
import {
  AuthenticatedSession,
  LoginCredentials,
  RegistrationData,
  User,
} from '../../domain/auth.models';

export interface AuthRepository {
  login(credentials: LoginCredentials): Observable<AuthenticatedSession>;
  register(data: RegistrationData): Observable<AuthenticatedSession>;
  refresh(): Observable<AuthenticatedSession>;
  logout(): Observable<void>;
  me(): Observable<User>;
}
