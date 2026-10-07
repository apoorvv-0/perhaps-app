const fs = require("fs");
const lines = fs.readFileSync("C:\\Users\\Apoorv\\.gemini\\antigravity\\brain\\6b162dd8-39cc-4fc2-bd92-18304e5850bb\\.system_generated\\logs\\transcript.jsonl", "utf8").split("\n");
let output = [];
for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i]) continue;
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.content && obj.content.includes("The command exited with code 0.\nOutput:\n<truncated 139 lines>")) {
      console.log("Found truncated cat. Searching further back.");
    }
    // We want to find the previous agent's edits to dashboard page!
    // But wait, the previous agent edited it. I can just search for the file edit tools!
    if (obj.tool_calls) {
      for (let t of obj.tool_calls) {
        if (t.name === "write_to_file" && t.args.TargetFile && t.args.TargetFile.includes("dashboard")) {
           console.log("Found write_to_file at step " + obj.step_index);
           fs.writeFileSync("found_dashboard.txt", t.args.CodeContent);
           return;
        }
      }
    }
  } catch (e) {}
}
console.log("Not found.");
