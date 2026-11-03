import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

/**
 * Ponto de extensão para autenticação OIDC / IdP externo (Keycloak/Zitadel).
 * Conforme Seção 2 do CHALLENGE.md, atua como No-Op para o timebox do desafio.
 */
@Injectable()
export class NoopAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
