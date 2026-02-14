export type SearchMatch = {
  fileId: string;
  setid: number;
  match: string;
};

export type SearchResult = {
  amount: number;
  matches: SearchMatch[];
};

export const search = {
  async searchFiles(
    keys: string[],
    offset: number = 0,
    limit: number = 10,
    filter?: string
  ): Promise<SearchResult> {
    throw new Error("searchFiles not implemented");
  },

  async searchDataset(
    query: string,
    offset: number = 0,
    limit: number = 10,
    regex?: boolean
  ): Promise<SearchResult> {
    throw new Error("searchDataset not implemented");
  }
};
