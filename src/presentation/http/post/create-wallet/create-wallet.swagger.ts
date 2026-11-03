import { ApiBodyOptions } from "@nestjs/swagger";

export const CreateWalletApiBody: ApiBodyOptions = {
  description:
    "Criação de carteira. Altere o playerId (UUID) para criar novas carteiras.",
  schema: {
    example: {
      playerId: "0192f28f-5dc0-7d58-bdb2-814ad6a0f4a1",
      initialBalance: {
        amount: "1000.00",
        currency: "BRL",
      },
    },
  },
};
