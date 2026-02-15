import { search } from "../api/search.ts";

async function main() {
  try {
    const keys = ["Epstein"];
    const offset = 3;
    const limit = 22;

    const result = await search.searchFiles(keys, offset, limit);

    console.log("Search Result:");
    console.log(`Total Matches: ${result.amount}`);
    result.results.forEach((m, i) => {
      console.log(`\nMatch #${i + 1}`);
      console.log(`File ID: ${m.fileId}`);
      console.log(`Set ID: ${m.setid}`);
      console.log(`URL: ${m.url}`);
      console.log("Match Preview:");
      m.match.forEach((line, j) => {
        console.log(`  [${j}]: ${line}`);
      });
    });
  } catch (err) {
    console.error(err);
  }
}

main();
