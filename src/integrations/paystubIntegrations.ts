import { adpParser } from "./adp";
import { dayforceParser } from "./dayforce";
import { genericParser } from "./generic";
import { justworksParser } from "./justworks";
import type { PaystubParser } from "./types";

export const paystubParsers: PaystubParser[] = [justworksParser, dayforceParser, adpParser, genericParser];

export const parsePaystubWithIntegrations = (text: string) => {
  const parser = paystubParsers.find((entry) => entry.matches(text)) ?? genericParser;
  return parser.parse(text);
};
