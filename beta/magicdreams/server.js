import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(root, "public");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch (error) {
    response.writeHead(400).end("URL invalida");
    return;
  }

  const requestedPath = path.resolve(publicRoot, `.${pathname}`);
  if (requestedPath !== publicRoot && !requestedPath.startsWith(`${publicRoot}${path.sep}`)) {
    response.writeHead(403).end("Acesso negado");
    return;
  }

  const filePath = pathname === "/" ? path.join(publicRoot, "index.html") : requestedPath;
  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(body);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "EISDIR") {
      console.error("Falha ao servir arquivo:", error);
      response.writeHead(500).end("Falha ao carregar o site");
      return;
    }

    if (path.extname(pathname)) {
      response.writeHead(404).end("Arquivo nao encontrado");
      return;
    }

    try {
      const body = await readFile(path.join(publicRoot, "index.html"));
      response.writeHead(200, { "Content-Type": contentTypes[".html"] });
      response.end(body);
    } catch (fallbackError) {
      console.error("Falha ao carregar a pagina inicial:", fallbackError);
      response.writeHead(500).end("Falha ao carregar o site");
    }
  }
});

const port = Number(process.env.PORT ?? 4173);
server.listen(port, "127.0.0.1", () => {
  console.log(`MagicDreams disponivel em http://127.0.0.1:${port}`);
});
