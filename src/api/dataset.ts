import {
  initTLS,
  destroyTLS,
  Session,
  ClientIdentifier,
} from "node-tls-client";
import * as cheerio from "cheerio";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

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
  itemId: number;
  name: string;
  url: string | null;
  indexed: boolean;
  fileIdBefore: string;
  fileIdAfter: string;
};

async function createSession() {
  await initTLS();
  return new Session({
    clientIdentifier: ClientIdentifier.chrome_103,
    timeout: 15000,
  });
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../data/datasets.db");

async function openDb() {
  return open({
  filename: dbPath,
  driver: sqlite3.Database,
  mode: sqlite3.OPEN_READONLY,
});;
}

export const dataset = {
  async getDatasetMeta(setId: number): Promise<DatasetMeta> {
    const session = await createSession();

    try {
      const url = `https://www.justice.gov/epstein/doj-disclosures/data-set-${setId}-files?page=0`;

      const response = await session.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Node.js)",
        },
        followRedirects: true,
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
        id: setId,
      };
    } finally {
      await session.close();
      await destroyTLS();
    }
  },

  async getDatasetPage(setId: number, page: number = 0): Promise<DatasetPage> {
    if (page === -1) {
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
          y: "u",
          e: "?",
          "user-agent": "Mozilla/4.0 (x11; linux x",
        },
        cookies: {
          A: "A",
        },
        followRedirects: true,
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
            url: href,
          });
        }
      });

      const currentPageText = $(".usa-current").first().text().trim();
      const currentPage = parseInt(currentPageText, 10);

      return {
        page: currentPage,
        files,
      };
    } finally {
      await session.close();
      await destroyTLS();
    }
  },

  async findFileInDataset(name: string, setId?: number): Promise<FindFileResult> {
    const db = await openDb();
    const match = name.match(/^EFTA(\d{8})$/);
    if (!match?.[1]) throw new Error("Invalid filename format");

    const targetNumber = parseInt(match[1], 10);

    let exactQuery = "SELECT dataset_id, page, index_in_page, name, url FROM files WHERE CAST(SUBSTR(name,5,8) AS INTEGER)=?";
    let params: any[] = [targetNumber];
    if (setId !== undefined) {
      exactQuery += " AND dataset_id=?";
      params.push(setId);
    }

    const exact = await db.get(exactQuery, params);
    if (exact) {
      return {
        setId: exact.dataset_id,
        pageId: exact.page,
        itemId: exact.index_in_page,
        name: exact.name,
        url: exact.url,
        indexed: true,
        fileIdBefore: match[1],
        fileIdAfter: match[1],
      };
    }

    // Nearest lower file
    let lowerQuery = "SELECT dataset_id, page, index_in_page, name FROM files WHERE CAST(SUBSTR(name,5,8) AS INTEGER)<?";
    let upperQuery = "SELECT dataset_id, page, index_in_page, name FROM files WHERE CAST(SUBSTR(name,5,8) AS INTEGER)>?";
    let queryParams = [targetNumber];
    if (setId !== undefined) {
      lowerQuery += " AND dataset_id=?";
      upperQuery += " AND dataset_id=?";
      queryParams.push(setId);
    }

    lowerQuery += " ORDER BY CAST(SUBSTR(name,5,8) AS INTEGER) DESC LIMIT 1";
    upperQuery += " ORDER BY CAST(SUBSTR(name,5,8) AS INTEGER) ASC LIMIT 1";

    const lower = await db.get(lowerQuery, queryParams);
    const upper = await db.get(upperQuery, queryParams);

    const reference = lower || upper;
    const fileIdBefore = lower ? lower.name.slice(4, 12) : null;
    const fileIdAfter = upper ? upper.name.slice(4, 12) : null;

    await db.close();

    return {
      setId: reference.dataset_id,
      pageId: reference.page,
      itemId: reference.index_in_page,
      name,
      url: null,
      indexed: false,
      fileIdBefore: fileIdBefore || fileIdAfter || match[1],
      fileIdAfter: fileIdAfter || fileIdBefore || match[1],
    };
  },
};
