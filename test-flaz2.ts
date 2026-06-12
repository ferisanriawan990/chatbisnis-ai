async function main() {
  const apiKey = "sk-WVQYjIn1Sim2xL3L2HUqYQ";
  const res = await fetch("https://ai.flaz.id/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash-lite",
      messages: [{ role: "user", content: "halo" }]
    })
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
main();
