Build a MCP Server to fetch stock quotes from Yahoo Finance using node & TypeScript.

Specifications:
- The MCP allows to query the price of a stock quote. The stock quote is specified by providing the TICKER. 

Technical Specifications:
- Prepare a Node/TypeScript project named `mcp-server-stockquotes` that:
-- Functions as an MCP server.
-- Supports stdio, SSE, and HTTP transports. stdio is the primary transport because it best fit CLI tools.
- Use the latest version of Yahoo Finance npm package (3.x).
- Use latest LTS node 24.x
- Use the latest version of the packags. You can use 'npm outdated' to check for outdated packages.
- Use linting for code check. The command 'npm run lint' executes the linting.
- Use prettier for code formating. The command 'npm run format' executes the code formating.
- Configure prettier to ignore folders that contains output files, temporary files (node_modules, dist etc)
- Use async/await to handle asynchronous operations properly.
- Always use context7 for code generation, setup or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.
- The application will be deployed as a Container.
- Implement a Github Action workflow for CI/CD. The CI must build the sources and then build the container image.
- Update .gitignore file to exclude unnecessary files from version control.
- Use best practices for Node.js, TypeScript etc.
- Create files for a smooth Visual Studio Code integration
- Create README.md that describes 
-- this project
-- file structure
-- how it can be integrated in different AI platforms like Gemini CLI, VS Code, Cline.
- make sure 'npm install', 'npm run build', 'npm run lint', 'npm run format' works finewithout failure.

Steps:
1. Construct the project.
2. Test it builds.