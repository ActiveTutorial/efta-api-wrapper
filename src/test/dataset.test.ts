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
  } catch (err) {
    console.error("Error fetching dataset:", err);
  }
}

main();
