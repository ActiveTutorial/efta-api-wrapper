import { initTLS, destroyTLS, Session, ClientIdentifier } from "node-tls-client";

export type DatasetMeta = {
  visibility: "nonexistent" | "private" | "public";
  lastModefied: Date;
  id: number;
};

export type DatasetPageItem = {
  filename: string;
  url: string;
};

export type DatasetPage = {
  page: number;
  files: DatasetPageItem[];
};

export type FindFileResult = {
  setId: number;
  pageId: number;
  itemId: number | null;
  name: string;
  url: string;
  indexed: boolean;
  fileIdBefore: string;
  fileIdAfter: string;
};

export const dataset = {
  async getDatasetMeta(setId: number): Promise<DatasetMeta> {
    await initTLS();

    const session = new Session({
      clientIdentifier: ClientIdentifier.chrome_103,
      timeout: 15000
    });

    try {
      const url = `https://www.justice.gov/epstein/doj-disclosures/data-set-${setId}-files?page=0`;

      const response = await session.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Node.js)"
        },
        followRedirects: true
      });

      const status = response.status;

      let visibility: DatasetMeta["visibility"];
      if (status === 200) {
        visibility = "public";
      } else if (status === 403 || status === 503) {
        visibility = "private";
      } else if (status === 404) {
        visibility = "nonexistent";
      } else {
        throw new Error(`Unexpected response code: ${status}`);
      }

      const lastModifiedHeader = response.headers["last-modified"];
      const lastModefied = lastModifiedHeader
        ? new Date(lastModifiedHeader)
        : new Date();

      return {
        visibility,
        lastModefied,
        id: setId
      };
    } finally {
      await session.close();
      await destroyTLS();
    }
  },

  async getDatasetPage(setId: number, page?: number): Promise<DatasetPage> {
    throw new Error("getDatasetPage not implemented");
  },

  async findFileInDataset(
    name: string,
    setId?: number
  ): Promise<FindFileResult> {
    throw new Error("findFileInDataset not implemented");
  }
};
