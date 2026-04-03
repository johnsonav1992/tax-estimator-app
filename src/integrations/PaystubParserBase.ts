import type { PaystubExtraction } from "./types";

export abstract class PaystubParserBase<T extends PaystubExtraction = PaystubExtraction> {
  abstract id: string;
  abstract matches(text: string): boolean;
  abstract parse(text: string): T;
}
