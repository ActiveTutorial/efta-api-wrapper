import { dataset } from "../api/dataset.ts";

async function main() {
  try {
    const meta = await dataset.getDatasetMeta(25);
    console.log("Dataset Metadata:");
    console.log(`ID: ${meta.id}`);
    console.log(`Visibility: ${meta.visibility}`);
    console.log(`Last Modified: ${meta.lastModefied.toISOString()}`);
  } catch (err) {
    console.error(err);
  }
}

main();
