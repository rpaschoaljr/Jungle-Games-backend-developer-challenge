import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class LiveHealthController {
  @Get("live")
  handle() {
    return { status: "alive", uptime: process.uptime() };
  }
}
