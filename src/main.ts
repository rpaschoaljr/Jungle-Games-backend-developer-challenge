import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle("Distributed Wagering Processor")
    .setDescription("API financeira de apostas, carteiras e ledger")
    .setVersion("1.0")
    .addApiKey(
      { type: "apiKey", name: "Idempotency-Key", in: "header" },
      "Idempotency-Key"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/docs`);
}

bootstrap();
