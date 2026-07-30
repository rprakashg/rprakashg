import { randomUUID } from "node:crypto";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type {
  Content,
  Heading,
  Link,
  List,
  ListItem,
  PhrasingContent,
  Root,
  Table,
} from "mdast";

type PortableTextSpan = {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
};

type PortableTextMarkDef = {
  _type: "link";
  _key: string;
  href: string;
};

type PortableTextBlock = {
  _type: "block";
  _key: string;
  style: string;
  listItem?: "bullet" | "number";
  level?: number;
  children: PortableTextSpan[];
  markDefs: PortableTextMarkDef[];
};

type PortableTextImage = {
  _type: "image";
  _key: string;
  asset: { _type: "reference"; _ref: string };
  alt?: string;
};

type PortableTextCode = {
  _type: "code";
  _key: string;
  language?: string;
  code: string;
};

type PortableTextTableRow = {
  _type: "tableRow";
  _key: string;
  cells: string[];
};

type PortableTextTable = {
  _type: "table";
  _key: string;
  rows: PortableTextTableRow[];
};

export type PortableTextEntry =
  | PortableTextBlock
  | PortableTextImage
  | PortableTextCode
  | PortableTextTable;

export type ImageResolution = { assetId: string; alt?: string };

export type ImageResolver = (params: {
  url: string;
  alt?: string | null;
  title?: string | null;
}) => Promise<ImageResolution | null>;

const HEADING_STYLES: Record<number, string> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
};

function key(): string {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}

function textSpan(text: string, marks: string[] = []): PortableTextSpan {
  return { _type: "span", _key: key(), text, marks };
}

function emptyBlock(style = "normal"): PortableTextBlock {
  return { _type: "block", _key: key(), style, children: [], markDefs: [] };
}

/** Flattens phrasing (inline) nodes into spans + markDefs for a single block. */
function processInline(
  nodes: PhrasingContent[],
  marks: string[],
  markDefs: PortableTextMarkDef[],
  spans: PortableTextSpan[],
): void {
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        spans.push(textSpan(node.value, marks));
        break;
      case "inlineCode":
        spans.push(textSpan(node.value, [...marks, "code"]));
        break;
      case "strong":
        processInline(node.children, [...marks, "strong"], markDefs, spans);
        break;
      case "emphasis":
        processInline(node.children, [...marks, "em"], markDefs, spans);
        break;
      case "delete":
        processInline(node.children, [...marks, "strike-through"], markDefs, spans);
        break;
      case "break":
        spans.push(textSpan("\n", marks));
        break;
      case "link": {
        const linkNode = node as Link;
        const markKey = key();
        markDefs.push({ _type: "link", _key: markKey, href: linkNode.url });
        processInline(linkNode.children, [...marks, markKey], markDefs, spans);
        break;
      }
      default:
        // Unsupported inline node (e.g. raw html, footnote ref) — fall back to its text.
        if ("children" in node && Array.isArray(node.children)) {
          processInline(node.children as PhrasingContent[], marks, markDefs, spans);
        } else if ("value" in node && typeof node.value === "string") {
          spans.push(textSpan(node.value, marks));
        }
    }
  }
}

function phrasingToBlock(
  nodes: PhrasingContent[],
  style: string,
  extra: Partial<PortableTextBlock> = {},
): PortableTextBlock {
  const block = emptyBlock(style);
  processInline(nodes, [], block.markDefs, block.children);
  if (block.children.length === 0) {
    block.children.push(textSpan(""));
  }
  return Object.assign(block, extra);
}

/**
 * Splits a run of phrasing nodes into text blocks + image entries. Images can appear
 * anywhere in a markdown paragraph (including inline with surrounding text via a soft
 * line break), but Portable Text images must be their own top-level array entries.
 */
async function phrasingToEntries(
  nodes: PhrasingContent[],
  style: string,
  resolveImage: ImageResolver,
  warnings: string[],
  extra: Partial<PortableTextBlock> = {},
): Promise<PortableTextEntry[]> {
  const entries: PortableTextEntry[] = [];
  let buffer: PhrasingContent[] = [];

  const flush = () => {
    if (buffer.length > 0) {
      entries.push(phrasingToBlock(buffer, style, extra));
      buffer = [];
    }
  };

  for (const node of nodes) {
    if (node.type === "image") {
      flush();
      const resolved = await resolveImage({ url: node.url, alt: node.alt, title: node.title });
      if (!resolved) {
        warnings.push(`image not found on disk: ${node.url}`);
      } else {
        entries.push({
          _type: "image",
          _key: key(),
          asset: { _type: "reference", _ref: resolved.assetId },
          alt: resolved.alt ?? node.alt ?? undefined,
        });
      }
    } else {
      buffer.push(node);
    }
  }
  flush();

  return entries;
}

function tableToEntry(table: Table): PortableTextTable {
  const rows: PortableTextTableRow[] = table.children.map((row) => {
    const cells = row.children.map((cell) => {
      const spans: PortableTextSpan[] = [];
      const markDefs: PortableTextMarkDef[] = [];
      processInline(cell.children, [], markDefs, spans);
      return spans.map((s) => s.text).join("");
    });
    return { _type: "tableRow", _key: key(), cells };
  });
  return { _type: "table", _key: key(), rows };
}

async function listToBlocks(
  list: List,
  level: number,
  resolveImage: ImageResolver,
  warnings: string[],
): Promise<PortableTextEntry[]> {
  const out: PortableTextEntry[] = [];
  for (const item of list.children as ListItem[]) {
    for (const child of item.children as Content[]) {
      if (child.type === "paragraph") {
        out.push(
          ...(await phrasingToEntries(child.children, "normal", resolveImage, warnings, {
            listItem: list.ordered ? "number" : "bullet",
            level,
          })),
        );
      } else if (child.type === "list") {
        out.push(...(await listToBlocks(child, level + 1, resolveImage, warnings)));
      } else {
        out.push(...(await nodeToEntries(child, resolveImage, warnings)));
      }
    }
  }
  return out;
}

async function nodeToEntries(
  node: Content,
  resolveImage: ImageResolver,
  warnings: string[],
): Promise<PortableTextEntry[]> {
  switch (node.type) {
    case "heading": {
      const heading = node as Heading;
      return [phrasingToBlock(heading.children, HEADING_STYLES[heading.depth] ?? "h4")];
    }
    case "paragraph":
      return phrasingToEntries(node.children, "normal", resolveImage, warnings);
    case "blockquote": {
      const entries: PortableTextEntry[] = [];
      for (const child of node.children) {
        if (child.type === "paragraph") {
          entries.push(...(await phrasingToEntries(child.children, "blockquote", resolveImage, warnings)));
        } else {
          entries.push(...(await nodeToEntries(child, resolveImage, warnings)));
        }
      }
      return entries;
    }
    case "list":
      return listToBlocks(node, 1, resolveImage, warnings);
    case "code":
      return [
        {
          _type: "code",
          _key: key(),
          language: node.lang ?? "text",
          code: node.value,
        },
      ];
    case "table":
      return [tableToEntry(node)];
    case "thematicBreak":
      return [];
    case "html":
      // Drop raw HTML nodes; markdown authoring in this repo doesn't rely on them for content.
      return [];
    default:
      return [];
  }
}

export async function markdownToPortableText(
  markdown: string,
  resolveImage: ImageResolver,
): Promise<{ blocks: PortableTextEntry[]; warnings: string[] }> {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const warnings: string[] = [];
  const blocks: PortableTextEntry[] = [];

  for (const node of tree.children) {
    blocks.push(...(await nodeToEntries(node, resolveImage, warnings)));
  }

  return { blocks, warnings };
}
