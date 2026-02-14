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
    throw new Error("getDatasetMeta not implemented");
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
