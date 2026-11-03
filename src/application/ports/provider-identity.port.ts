export interface ProviderIdentity {
  providerId: string;
  roles: string[];
  authenticated: boolean;
}

export interface IProviderIdentityPort {
  authenticate(token?: string): Promise<ProviderIdentity>;
}
