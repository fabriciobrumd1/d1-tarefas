const { put, list } = require("@vercel/blob");

const STATE_PATH = "data/d1-state.json";

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const result = await list({ prefix: STATE_PATH, limit: 1 });
      const item = result.blobs.find(blob => blob.pathname === STATE_PATH);
      if (!item) return res.status(200).json(null);
      const response = await fetch(item.url);
      return res.status(200).json(await response.json());
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
      await put(STATE_PATH, body, {
        access: "public",
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
