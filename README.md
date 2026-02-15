# EFTA API Wrapper

This is a Node.js / TypeScript API wrapper for interacting with the Justice.gov Epstein DOJ disclosure datasets.

Warning: This is in early development.
Also note that the function signatures in this file might be outdated. Check the code if required.

---

## Dataset Methods

**dataset.getDatasetMeta**
Fetch metadata about a dataset.

```ts
async function getDatasetMeta(
  setId: number
): Promise<{
  visibility: "nonexistent" | "private" | "public";
  lastModefied: Date;
  id: number;
}>
```

**dataset.getDatasetPage**
Fetch a specific page of a dataset. Defaults to page 0. Negative page returns the last page. Requesting page that doesnt exist defaults to nearest page and returns its actual id in return object.

```ts
async function getDatasetPage(
  setId: number,
  page?: number
): Promise<{
  page: number;
  files: Array<{
    filename: string;
    url: string;
  }>;
}>
```

**dataset.findFileInDataset**
Find a specific file by name. Returns the exact position or nearest position (between which 2 files it would have been) if not found. Figures out dataset if `setId` is omitted.

the way this will search is it will either use some pre-scraped dataset mirror to just find it or it will narrow in on where file should be. 

```ts
async function findFileInDataset(
  name: string,
  setId?: number
): Promise<{
  setId: number;
  pageId: number;
  itemId: number | null;
  name: string;
  url: string;
  indexed: boolean;
  fileIdBefore: string;
  fileIdAfter: string;
}>
```

---

## Search Methods

**search.searchFiles**
Search the official DOJ search endpoint by keywords. Offset defaults to 0, limit defaults to 10. Optional regex filter can be applied to filter results by preview content.

```ts
async function searchFiles(
  keys: string[],
  offset?: number,
  limit?: number,
  filter?: string
): Promise<{
  amount: number;
  matches: Array<{
    fileId: string;
    setid: number;
    match: string;
  }>;
}>
```

**search.searchDataset**
Search a mirrored dataset using a query string. Offset and limit work the same way. Optional regex mode.
Note: this is probably not going to be implemented soon since it requrires a download of all pdf files to creat the index required for this.

```ts
async function searchDataset(
  query: string,
  offset?: number,
  limit?: number,
  regex?: boolean
): Promise<{
  amount: number;
  matches: Array<{
    fileId: string;
    setid: number;
    match: string;
  }>;
}>
```

---

## Download Methods

**download.downloadPdf**
Download a PDF from a dataset. Return format defaults to `pdf`. Returns the file buffer or a link depending on format.

```ts
async function downloadPdf(
  id: string,
  format?: "pdf" | "text" | "image" | "link",
  setId?: number
): Promise<{
  name: string;
  url: string;
  file: Buffer | null;
}>
```

**download.downloadMultimedia**
Download a multimedia file from a dataset. Tries common extensions until a valid file is found. Return format defaults to `raw`.

```ts
async function downloadMultimedia(
  id: string,
  format?: "raw" | "converted" | "link",
  setId?: number
): Promise<{
  name: string;
  url: string;
  file: Buffer;
}>
```
