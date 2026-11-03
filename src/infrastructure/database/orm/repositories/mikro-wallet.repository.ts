import { EntityManager, LockMode } from "@mikro-orm/core";
import { Wallet } from "@domain/wallet/wallet.entity";
import { IWalletRepository } from "@application/ports/wallet.repository.interface";

export class MikroOrmWalletRepository implements IWalletRepository {
  constructor(private readonly em: EntityManager) {}

  async create(wallet: Wallet): Promise<void> {
    this.em.persist(wallet);
    await this.em.flush();
  }

  async findById(id: string): Promise<Wallet | null> {
    return await this.em.findOne(Wallet, { id });
  }

  async findByPlayerAndCurrency(
    playerId: string,
    currency: string
  ): Promise<Wallet | null> {
    return await this.em.findOne(Wallet, { playerId, currency });
  }

  async findForUpdate(id: string): Promise<Wallet | null> {
    return await this.em.findOne(
      Wallet,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE }
    );
  }

  async updateBalance(wallet: Wallet): Promise<void> {
    this.em.persist(wallet);
    await this.em.flush();
  }
}
