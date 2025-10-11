import mammoth from "mammoth";
import * as pdfParse from "pdf-parse";

export interface ConversionResult {
  success: boolean;
  html?: string;
  text?: string;
  error?: string;
  metadata?: {
    pages?: number;
    author?: string;
    title?: string;
    subject?: string;
  };
}

export class DocumentConverter {
  async convertDocxToHtml(buffer: Buffer): Promise<ConversionResult> {
    try {
      const result = await mammoth.convertToHtml(
        { buffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "b => strong",
            "i => em",
          ],
          includeDefaultStyleMap: true,
        }
      );

      return {
        success: true,
        html: result.value,
        metadata: {},
      };
    } catch (error) {
      console.error("DOCX conversion error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to convert DOCX",
      };
    }
  }

  async convertDocxToText(buffer: Buffer): Promise<ConversionResult> {
    try {
      const result = await mammoth.extractRawText({ buffer });

      return {
        success: true,
        text: result.value,
        metadata: {},
      };
    } catch (error) {
      console.error("DOCX text extraction error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract text from DOCX",
      };
    }
  }

  async parsePdf(buffer: Buffer): Promise<ConversionResult> {
    try {
      const parseFunc = (pdfParse as any).default || pdfParse;
      const data = await parseFunc(buffer);

      return {
        success: true,
        text: data.text,
        metadata: {
          pages: data.numpages,
          author: data.info?.Author,
          title: data.info?.Title,
          subject: data.info?.Subject,
        },
      };
    } catch (error) {
      console.error("PDF parsing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to parse PDF",
      };
    }
  }

  htmlToTipTap(html: string): any {
    const cleanHtml = html
      .replace(/<strong>/g, "<b>")
      .replace(/<\/strong>/g, "</b>")
      .replace(/<em>/g, "<i>")
      .replace(/<\/em>/g, "</i>");

    const paragraphs = cleanHtml
      .split(/<\/(?:p|h[1-6]|li)>/)
      .filter((p) => p.trim());

    const content: any[] = [];

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      if (trimmed.includes("<h1>")) {
        const text = trimmed.replace(/<\/?h1>/g, "").trim();
        content.push({
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text }],
        });
      } else if (trimmed.includes("<h2>")) {
        const text = trimmed.replace(/<\/?h2>/g, "").trim();
        content.push({
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text }],
        });
      } else if (trimmed.includes("<h3>")) {
        const text = trimmed.replace(/<\/?h3>/g, "").trim();
        content.push({
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text }],
        });
      } else if (trimmed.includes("<p>")) {
        const text = trimmed
          .replace(/<\/?p>/g, "")
          .replace(/<b>(.*?)<\/b>/g, "$1")
          .replace(/<i>(.*?)<\/i>/g, "$1")
          .trim();
        if (text) {
          content.push({
            type: "paragraph",
            content: [{ type: "text", text }],
          });
        }
      }
    }

    if (content.length === 0) {
      const plainText = html.replace(/<[^>]*>/g, "").trim();
      if (plainText) {
        content.push({
          type: "paragraph",
          content: [{ type: "text", text: plainText }],
        });
      }
    }

    return {
      type: "doc",
      content:
        content.length > 0
          ? content
          : [
              {
                type: "paragraph",
                content: [],
              },
            ],
    };
  }

  async convertDocxToTipTap(buffer: Buffer): Promise<ConversionResult> {
    const htmlResult = await this.convertDocxToHtml(buffer);

    if (!htmlResult.success || !htmlResult.html) {
      return htmlResult;
    }

    try {
      const tipTapContent = this.htmlToTipTap(htmlResult.html);

      return {
        success: true,
        html: htmlResult.html,
        metadata: tipTapContent,
      };
    } catch (error) {
      console.error("TipTap conversion error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to convert to TipTap format",
      };
    }
  }
}

export const documentConverter = new DocumentConverter();
