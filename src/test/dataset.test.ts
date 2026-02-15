import { dataset } from "../api/dataset.ts";

async function main() {
  try {
    // Fetch metadata
    const meta = await dataset.getDatasetMeta(9);
    console.log("Dataset Metadata:");
    console.log(`ID: ${meta.id}`);
    console.log(`Visibility: ${meta.visibility}`);
    console.log(`Last Modified: ${meta.lastModefied.toISOString()}`);

    // Fetch page
    const page = await dataset.getDatasetPage(9, -3);
    console.log(`\nDataset Page ${page.page}:`);
    page.files.forEach((file, i) => {
      console.log(`${i + 1}. ${file.filename} -> ${file.url}`);
    });

    // Find file in datasets
    const testFiles = ["EFTA00078922", "EFTA00002323"];
    for (const name of testFiles) {
      try {
        const result = await dataset.findFileInDataset(name);
        console.log(`\nLookup result for ${name}:`);
        console.log(`Name: ${result.name}`);
        console.log(`Set ID: ${result.setId}`);
        console.log(`Page ID: ${result.pageId}`);
        console.log(`Item ID: ${result.itemId}`);
        console.log(`URL: ${result.url ?? "N/A"}`);
        console.log(`Indexed: ${result.indexed}`);
        console.log(`File ID Before: ${result.fileIdBefore}`);
        console.log(`File ID After: ${result.fileIdAfter}`);
      } catch (err) {
        console.error(`Error looking up ${name}:`, err);
      }
    }
  } catch (err) {
    console.error("Error fetching dataset:", err);
  }
}

main();
