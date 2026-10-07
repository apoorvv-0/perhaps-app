const fs = require("fs");
const lines = fs.readFileSync("C:\\Users\\Apoorv\\.gemini\\antigravity\\brain\\6b162dd8-39cc-4fc2-bd92-18304e5850bb\\.system_generated\\logs\\transcript.jsonl", "utf8").split("\n");
for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i]) continue;
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.tool_calls) {
      for (let t of obj.tool_calls) {
        if (t.name === "default_api:write_to_file" || t.name === "write_to_file") {
           let args = typeof t.args === "string" ? JSON.parse(t.args) : t.args;
           if (args.TargetFile && args.TargetFile.includes("dashboard\\page.tsx")) {
              console.log("Found write_to_file at step " + obj.step_index);
              fs.writeFileSync("found_dashboard.tsx", args.CodeContent);
              return;
           }
        }
      }
    }
  } catch (e) {}
}
console.log("Not found.");
