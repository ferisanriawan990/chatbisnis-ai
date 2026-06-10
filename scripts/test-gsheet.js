const { parseCsv } = require('./src/lib/parsers.ts'); // Wait, parseCsv is in TS. Let's just fetch the CSV and see the first 5 lines.

async function main() {
  const url = "https://docs.google.com/spreadsheets/d/18iZu59WC4IVBLTsqPdzX3oitQiDLTuxZ0h2PdOvtq-8/export?format=csv&gid=0";
  const res = await fetch(url);
  const text = await res.text();
  console.log(text.substring(0, 500));
}
main();
