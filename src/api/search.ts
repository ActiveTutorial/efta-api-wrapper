import { initTLS, destroyTLS, Session, ClientIdentifier } from "node-tls-client";

export type SearchMatch = {
  fileId: string;      // filename without extension
  setid: number;
  match: string[];     // array of highlight content
};

export type SearchResult = {
  amount: number;
  matches: SearchMatch[];
};

async function createSession() {
  await initTLS();
  return new Session({
    clientIdentifier: ClientIdentifier.chrome_103,
    timeout: 15000
  });
}

export const search = {
  async searchFiles(
    keys: string[],
    offset: number = 0,
    limit: number = 10
  ): Promise<SearchResult> {
    const session = await createSession();
    const results: SearchMatch[] = [];
    try {
      const query = encodeURIComponent(keys.join(" "));

      // Calculate which pages to fetch
      let remaining = limit;
      let page = Math.floor(offset / 10) + 1; // API pages are 1-based
      let skipInPage = offset % 10;

      let totalAmount = 0;

      while (remaining > 0) {
        const url = `https://www.justice.gov/multimedia-search?keys=${query}&page=${page}`;

        const response = await session.get(url, {
          headers: {
            "y": "u",
            "e": "?",
            "user-agent": "Mozilla/5.0 (X11; Linux x"
          },
          followRedirects: true
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
        const pageResults = hits.slice(skipInPage, skipInPage + remaining).map((hit: any) => {
          const filename: string = hit._source?.key ?? "";
          const highlightArr: string[] = hit.highlight?.content ?? [];

          const setidMatch = filename.match(/DataSet\s*(\d+)/i);
          const setid = setidMatch ? parseInt(setidMatch[1]!, 10) : 0;

          const fileId = filename.split("/")[1]!.split(".")[0];

          return {
            fileId,
            setid,
            match: highlightArr
          };
        });

        results.push(...pageResults);

        remaining -= pageResults.length;
        page += 1;
        skipInPage = 0; // only skip for first page
      }

      return {
        amount: totalAmount,
        matches: results
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
    regex: boolean = true
  ): Promise<SearchResult> {
    throw new Error("searchDataset not implemented");
  }
};
