export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  const apiUrl = process.env.GAUSS_API_URL;
  const apiKey = process.env.GAUSS_API_KEY;

  if (!apiUrl || !apiKey) {
    return res.status(500).json({
      erro: "Configuração do servidor incompleta"
    });
  }

  try {
    const resposta = await fetch(
      `${apiUrl.replace(/\/$/, "")}/api/propostas`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey
        },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(55000)
      }
    );

    if (!resposta.ok) {
      return res.status(502).json({
        erro: "Não foi possível gerar a proposta"
      });
    }

    const tipo = resposta.headers.get("content-type") || "";

    if (!tipo.includes("application/pdf")) {
      return res.status(502).json({
        erro: "O servidor não retornou um PDF"
      });
    }

    const pdf = Buffer.from(await resposta.arrayBuffer());

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      resposta.headers.get("content-disposition") ||
        'attachment; filename="proposta-gauss.pdf"'
    );
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(pdf);
  } catch (erro) {
    console.error("Falha na geração:", erro.message);

    return res.status(502).json({
      erro: "Falha na comunicação com o servidor"
    });
  }
}