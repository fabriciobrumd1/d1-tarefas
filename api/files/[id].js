const { put, list, del } = require("@vercel/blob");

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 25_000_000) {
        req.destroy();
        reject(new Error("Arquivo muito grande"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function isAuthorized(req) {
  const password = process.env.APP_PASSWORD;
  if (!password) return true;
  return req.headers["x-app-password"] === password || req.query.key === password;
}

module.exports = async function handler(req, res) {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Acesso nao autorizado" });
    }

    const id = req.query.id;
    const pathname = `uploads/${id}`;

    if (req.method === "POST") {
      const base64 = await readBody(req);
      const blob = await put(pathname, Buffer.from(base64, "base64"), {
        access: "public",
        allowOverwrite: true
      });
      return res.status(200).json({ ok: true, url: blob.url });
    }

    if (req.method === "GET") {
      const result = await list({ prefix: pathname, limit: 1 });
      const item = result.blobs.find(blob => blob.pathname === pathname);
      if (!item) return res.status(404).send("Arquivo nao encontrado");
      res.writeHead(302, { Location: item.url });
      return res.end();
    }

    if (req.method === "DELETE") {
      await del(pathname);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Metodo nao permitido" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
