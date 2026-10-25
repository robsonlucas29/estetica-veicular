const reply=(data,options={})=>Response.json(data,{...options,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Cache-Control":"no-store"}});


const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const DESTINATION_EMAIL = "graucargaragem096@gmail.com";

const esc = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

Deno.serve(async (req) => {
    const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info"};
    if(req.method==="OPTIONS")return new Response(null,{headers});
    if(Deno.env.get("SUPABASE_URL")!=="https://upurwxqorziaakucrstm.supabase.co")return new Response(null,{status:403});
    try {
      if (req.method !== "POST") {
        return reply(
          { error: "Método não permitido" },
          { status: 405 }
        );
      }

      if (!RESEND_API_KEY) {
        return reply(
          { error: "RESEND_API_KEY não configurada." },
          { status: 500 }
        );
      }

      const body = await req.json();

      const {
        name,
        phone,
        email,
        area,
        experience,
        message,
        resumeName,
        resumeType,
        resumeBase64,
      } = body ?? {};

      if (
        !name ||
        !phone ||
        !email ||
        !area ||
        !resumeName ||
        !resumeBase64
      ) {
        return reply(
          {
            error:
              "Preencha os campos obrigatórios e anexe o currículo.",
          },
          { status: 400 }
        );
      }

      if (String(resumeBase64).length > 7_500_000) {
        return reply(
          { error: "Currículo acima do limite permitido." },
          { status: 413 }
        );
      }

      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)) || !/^[A-Za-z0-9+/=\r\n]+$/.test(String(resumeBase64)))return reply({error:"E-mail ou arquivo inválido."},{status:400});
      const html = `
        <div style="
          font-family:Arial,sans-serif;
          max-width:680px;
          margin:auto;
          color:#202124;
          line-height:1.55;
        ">
          <h2>Nova candidatura - Garagem Grau Car</h2>

          <p><strong>Nome:</strong> ${esc(name)}</p>

          <p>
            <strong>Telefone/WhatsApp:</strong>
            ${esc(phone)}
          </p>

          <p>
            <strong>E-mail:</strong>
            ${esc(email)}
          </p>

          <p>
            <strong>Área ou vaga de interesse:</strong>
            ${esc(area)}
          </p>

          <p>
            <strong>Experiência / qualificações:</strong><br>
            ${esc(experience || "Não informado").replaceAll("\n", "<br>")}
          </p>

          <p>
            <strong>Mensagem adicional:</strong><br>
            ${esc(message || "Não informado").replaceAll("\n", "<br>")}
          </p>

          <hr style="
            border:0;
            border-top:1px solid #ddd;
            margin:24px 0;
          ">

          <p>
            Currículo anexado:
            <strong>${esc(resumeName)}</strong>
          </p>
        </div>
      `;

      const response = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },

          body: JSON.stringify({
            from:
              Deno.env.get("RESEND_FROM_EMAIL"),

            to: [DESTINATION_EMAIL],

            reply_to: email,

            subject:
              `Nova candidatura - ${String(name).slice(0, 80)}`,

            html,

            attachments: [
              {
                filename: String(resumeName).slice(0, 150),
                content: resumeBase64,
                content_type:
                  resumeType ||
                  "application/octet-stream",
              },
            ],
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return reply(
          {
            error:
              "Não foi possível enviar a candidatura.",
            
          },
          { status: response.status }
        );
      }

      return reply({
        ok: true,
      });
    } catch (error) {
      return reply(
        {
          error:
            "Erro interno.",
        },
        { status: 500 }
      );
    }
});