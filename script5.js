const fs = require("fs");
const lines = fs.readFileSync("C:\\Users\\Apoorv\\.gemini\\antigravity\\brain\\045e3485-5852-4dd9-af2e-4e3ec943d70d\\.system_generated\\logs\\transcript.jsonl", "utf8").split("\n");
for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i]) continue;
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.tool_calls) {
      for (let t of obj.tool_calls) {
        if (t.name === "default_api:run_command" || t.name === "run_command") {
           let args = typeof t.args === "string" ? JSON.parse(t.args) : t.args;
           if (args.CommandLine && args.CommandLine.includes("dashboard\\page.tsx")) {
              console.log("Found run_command at step " + obj.step_index);
              fs.writeFileSync("found_dashboard.ps1", args.CommandLine);
              return;
           }
        }
      }
    }
  } catch (e) {}
}
console.log("Not found.");
