import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

type PositionedText = {
  text: string;
  x: number;
  y: number;
};

const toPositionedText = (item: unknown): PositionedText | null => {
  if (!item || typeof item !== "object") {
    return null;
  }
  const candidate = item as { str?: unknown; transform?: unknown };
  if (typeof candidate.str !== "string" || !Array.isArray(candidate.transform)) {
    return null;
  }
  const [_a, _b, _c, _d, e, f] = candidate.transform as number[];
  const x = typeof e === "number" ? e : 0;
  const y = typeof f === "number" ? f : 0;
  return {
    text: candidate.str,
    x,
    y,
  };
};

const buildTextFromItems = (items: unknown[]) => {
  const positioned = items.map(toPositionedText).filter((item): item is PositionedText => !!item);

  const lineMap = new Map<number, PositionedText[]>();
  for (const item of positioned) {
    const yKey = Math.round(item.y);
    const line = lineMap.get(yKey) ?? [];
    line.push(item);
    lineMap.set(yKey, line);
  }

  const lines = Array.from(lineMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, lineItems]) =>
      lineItems
        .sort((a, b) => a.x - b.x)
        .map((entry) => entry.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  return lines.join("\n");
};

export const extractPdfText = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;

  let text = "";
  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const content = await page.getTextContent();
    const pageText = buildTextFromItems(content.items);
    text += `${pageText}\n`;
  }

  console.log(text)
  return text;
};
