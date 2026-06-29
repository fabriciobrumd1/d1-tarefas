const { put, get } = require("@vercel/blob");

const STATE_PATH = "data/d1-state.json";

function isAuthorized(req) {
  const password = (process.env.APP_PASSWORD || "").trim();
  if (!password) return true;
  return String(req.headers["x-app-password"] || "").trim() === password;
}

module.exports = async function handler(req, res) {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Acesso nao autorizado" });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN ausente. Conecte o Vercel Blob ao projeto e reimplante." });
    }

    if (req.method === "GET") {
      const result = await get(STATE_PATH, { access: "private" });
      if (!result || result.statusCode !== 200) return res.status(200).json(null);
      const text = await new Response(result.stream).text();
      return res.status(200).json(JSON.parse(text));
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
      await put(STATE_PATH, body, {
        access: "private",
        allowOverwrite: true,
        contentType: "application/json; charset=utf-8"
      });
      return res.status(200).json(JSON.parse(body || "{}"));
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Metodo nao permitido" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
