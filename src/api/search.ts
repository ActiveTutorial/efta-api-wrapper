import {
  initTLS,
  destroyTLS,
  Session,
  ClientIdentifier,
} from "node-tls-client";

export type SearchResult = {
  fileId: string;
  setid: number;
  url: string;
  match: string[];
};

export type SearchResults = {
  amount: number;
  results: SearchResult[];
};

async function createSession() {
  await initTLS();
  return new Session({
    clientIdentifier: ClientIdentifier.chrome_103,
    timeout: 15000,
  });
}

export const search = {
  async searchFiles(
    keys: string[],
    offset: number = 0,
    limit: number = 10,
  ): Promise<SearchResults> {
    const session = await createSession();
    const results: SearchResult[] = [];
    try {
      const query = encodeURIComponent(keys.join(" "));

      // Calculate which pages to fetch
      // offste + limit to pages conversion
      let remaining = limit;
      let page = Math.floor(offset / 10) + 1; // API pages are 1-based
      let skipInPage = offset % 10;

      let totalAmount = 0;

      while (remaining > 0) {
        const url = `https://www.justice.gov/multimedia-search?keys=${query}&page=${page}`;

        const response = await session.get(url, {
          headers: {
            y: "u",
            e: "?",
            "user-agent": "Mozilla/5.0 (X11; Linux x",
          },
          followRedirects: true,
        });

        if (response.status !== 200) {
          throw new Error(`Unexpected response code: ${response.status}`);
        }

        const data = JSON.parse(response.body);

        if (totalAmount === 0) {
          totalAmount = data.hits?.total?.value ?? 0;
        }

        const hits = data.hits?.hits ?? [];
        if (!hits.length) break;

        // Slice results according to offset/limit
        const pageResults = hits
          .slice(skipInPage, skipInPage + remaining)
          .map((hit: any) => {
            const filename: string = hit._source?.key ?? "";
            const highlightArr: string[] = hit.highlight?.content ?? [];
            const url: string =
              hit._source.ORIGIN_FILE_URI.replace(" ", "%20") ?? "";

            const setidMatch = filename.match(/DataSet\s*(\d+)/i);
            const setid = setidMatch ? parseInt(setidMatch[1]!, 10) : 0;

            const fileId = filename.split("/")[1]!.split(".")[0];

            return {
              fileId,
              setid,
              url,
              match: highlightArr,
            };
          });

        results.push(...pageResults);

        remaining -= pageResults.length;
        page += 1;
        skipInPage = 0; // only skip for first page
      }

      return {
        amount: totalAmount,
        results: results,
      };
    } finally {
      await session.close();
      await destroyTLS();
    }
  },

  async searchDataset(
    query: string,
    offset: number = 0,
    limit: number = 10,
    regex: boolean = true,
  ): Promise<SearchResults> {
    throw new Error("searchDataset not implemented");
  },
};
