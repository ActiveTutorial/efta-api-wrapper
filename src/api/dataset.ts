import { initTLS, destroyTLS, Session, ClientIdentifier } from "node-tls-client";
import * as cheerio from "cheerio";

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

async function createSession() {
  await initTLS();
  return new Session({
    clientIdentifier: ClientIdentifier.chrome_103,
    timeout: 15000
  });
}

export const dataset = {
  async getDatasetMeta(setId: number): Promise<DatasetMeta> {
    const session = await createSession();

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

  async getDatasetPage(setId: number, page: number = 0): Promise<DatasetPage> {
    if(page === -1) {
      page = 2147483648;
    } else if (page < 0) {
      page = (await dataset.getDatasetPage(setId, -1)).page + page;
    }
    if (page < 0) {
        page = 0;
    }
    const session = await createSession();

    try {
      const url = `https://www.justice.gov/epstein/doj-disclosures/data-set-${setId}-files?page=${page}`;

      const response = await session.get(url, {
        headers: {
          "accept-language": "e",
          "y": "u",
          "e": "?",
          "user-agent": "Mozilla/4.0 (x11; linux x"
        },
        cookies: {
          A: "A"
        },
        followRedirects: true
      });

      if (response.status !== 200) {
        throw new Error(`Unexpected response code: ${response.status}`);
      }

      const $ = cheerio.load(response.body);

      const files: DatasetPageItem[] = [];

      $("a").each((_, element) => {
        const href = $(element).attr("href");
        const text = $(element).text().trim();

        if (href && href.startsWith("https://www.justice.gov/epstein/files/")) {
          files.push({
            filename: text,
            url: href
          });
        }
      });

      const currentPageText = $(".usa-current").first().text().trim();
      const currentPage = parseInt(currentPageText, 10);

      return {
        page: currentPage,
        files
      };
    } finally {
      await session.close();
      await destroyTLS();
    }
  },

  async findFileInDataset(
    name: string,
    setId?: number
  ): Promise<FindFileResult> {
    throw new Error("findFileInDataset not implemented");
  }
};
