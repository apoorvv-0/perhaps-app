const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\Apoorv\\.gemini\\antigravity\\brain\\03181d62-d261-4b44-9efd-406354aaf18b\\.system_generated\\logs\\transcript_full.jsonl', 'utf8').split('\n');
const writeCall = lines.reverse().find(l => l.includes('"tool_calls"') && l.includes('"TargetFile":"g:\\\\WORK\\\\Mutuals\\\\perhaps\\\\src\\\\app\\\\admin\\\\page.tsx"'));
if (writeCall) {
  const parsed = JSON.parse(writeCall);
  const tool = parsed.tool_calls.find(t => t.function?.arguments?.TargetFile === 'g:\\WORK\\Mutuals\\perhaps\\src\\app\\admin\\page.tsx' || t.arguments?.TargetFile === 'g:\\WORK\\Mutuals\\perhaps\\src\\app\\admin\\page.tsx');
  const content = tool.function ? tool.function.arguments.CodeContent : tool.arguments.CodeContent;
  fs.writeFileSync('restored.tsx', content);
  console.log('Wrote to restored.tsx');
}
