import { MikroORM } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { mikroOrmConfig } from "./mikro-orm.config";

export class MikroOrmManager {
  private static instance: MikroORM<PostgreSqlDriver> | null = null;

  static async getOrm(): Promise<MikroORM<PostgreSqlDriver>> {
    if (!MikroOrmManager.instance) {
      MikroOrmManager.instance = await MikroORM.init(mikroOrmConfig);
    }
    return MikroOrmManager.instance;
  }

  static async close(): Promise<void> {
    if (MikroOrmManager.instance) {
      await MikroOrmManager.instance.close();
      MikroOrmManager.instance = null;
    }
  }
}
