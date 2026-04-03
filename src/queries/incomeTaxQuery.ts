import { queryOptions } from "@tanstack/react-query";
import type { IncomeTaxParams } from "../api/incomeTaxApi";
import { fetchIncomeTaxBrackets } from "../api/incomeTaxApi";

export const incomeTaxBracketsQueryOptions = (params: IncomeTaxParams) =>
  queryOptions({
    queryKey: ["income-tax", params],
    queryFn: () => fetchIncomeTaxBrackets(params),
    staleTime: 1000 * 60 * 60 * 24,
  });
