async function main() {
  const apiKey = "sk-WVQYjIn1Sim2xL3L2HUqYQ";
  const res = await fetch("https://ai.flaz.id/v1/models", {
    headers: { "Authorization": `Bearer ${apiKey}` }
  });
  const json = await res.json();
  console.log("Available models:", json.data?.map((m:any) => m.id));
}
main();
