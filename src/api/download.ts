export type DownloadResult = {
  name: string;
  url: string;
  file: Buffer | null;
};

export const download = {
  async downloadPdf(
    id: string,
    format: "image" | "pdf" | "text" | "link" = "pdf",
    setId?: number,
  ): Promise<DownloadResult> {
    throw new Error("downloadPdf not implemented");
  },

  async downloadMultimedia(
    id: string,
    format: "raw" | "converted" | "link" = "raw",
    setId?: number,
  ): Promise<DownloadResult> {
    throw new Error("downloadMultimedia not implemented");
  },
};
