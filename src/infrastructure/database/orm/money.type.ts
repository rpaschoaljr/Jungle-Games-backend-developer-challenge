import { Type, Platform } from "@mikro-orm/core";
import { Money } from "@domain/money/money.vo";

export class MoneyCustomType extends Type<Money, string> {
  convertToDatabaseValue(value: Money | string, _platform: Platform): string {
    if (value instanceof Money) {
      return value.amount;
    }
    return String(value);
  }

  convertToJSValue(value: string | number, _platform: Platform): Money {
    const str = typeof value === "number" ? value.toFixed(2) : String(value);
    return Money.from({ amount: str, currency: "BRL" });
  }

  getColumnType(_prop: any, _platform: Platform): string {
    return "numeric(18, 2)";
  }
}
