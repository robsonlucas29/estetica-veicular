// Modelo transacional de conclusão: HTML compatível com clientes de e-mail
// e versão texto para acessibilidade. Não altera envio, autorização ou idempotência.
const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]||char));
const money=(value:unknown)=>Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const BRAND='Garagem Grau Car 096';
const LOGO='https://www.graucargaragem.com.br/grau-car-logo.jpeg';
const WEBSITE='https://www.graucargaragem.com.br/';

type Client={name?:string|null};
type Vehicle={brand?:string|null;model?:string|null;plate?:string|null};
type ServiceRow={service_id?:string|null;charged_amount?:number|null};
type Service={id:string;name?:string|null};

export function buildCompletionEmail(client:Client,vehicle:Vehicle,rows:ServiceRow[],services:Service[]){
 const firstName=String(client.name||'Cliente').trim().split(/\s+/)[0]||'Cliente';
 const vehicleName=[vehicle.brand,vehicle.model].filter(Boolean).join(' ').trim()||'seu veículo';
 const plate=String(vehicle.plate||'').trim().toUpperCase();
 const total=rows.reduce((sum,row)=>sum+Number(row.charged_amount||0),0);
 const items=rows.map(row=>({
  name:services.find(service=>service.id===row.service_id)?.name||'Serviço realizado',
  price:money(row.charged_amount)
 }));
 const serviceRows=items.map(item=>[
  '<tr>',
  '<td style="padding:13px 0;border-bottom:1px solid #ececf0;color:#24242b;font-size:14px;line-height:20px;">',esc(item.name),'</td>',
  '<td align="right" style="padding:13px 0;border-bottom:1px solid #ececf0;color:#24242b;font-size:14px;font-weight:600;white-space:nowrap;">',esc(item.price),'</td>',
  '</tr>'
 ].join('')).join('');
 const html=[
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<meta name="color-scheme" content="light"><title>Seu veículo está pronto</title></head>',
  '<body style="margin:0;padding:0;background:#f3f3f5;font-family:Arial,Helvetica,sans-serif;color:#24242b;">',
  '<div style="display:none;font-size:1px;color:#f3f3f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">',
  'Seu veículo está pronto para retirada. Confira os serviços realizados.</div>',
  '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f3f5;"><tr><td align="center" style="padding:26px 12px;">',
  '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">',
  '<tr><td align="center" style="background:#15151a;padding:30px 24px 25px;border-top:5px solid #d71920;">',
  '<img src="',LOGO,'" width="108" alt="',BRAND,'" style="display:block;width:108px;max-width:108px;height:auto;border:0;margin:0 auto 12px;">',
  '<div style="font-size:12px;letter-spacing:2px;font-weight:700;color:#f4f4f5;text-transform:uppercase;">GARAGEM GRAU CAR 096</div>',
  '</td></tr>',
  '<tr><td style="padding:32px 30px 14px;">',
  '<p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1.5px;color:#b0182e;text-transform:uppercase;">ATENDIMENTO CONCLUÍDO</p>',
  '<h1 style="font-size:27px;line-height:1.2;letter-spacing:-.5px;margin:0 0 16px;color:#17171b;">Seu veículo está pronto!</h1>',
  '<p style="margin:0 0 12px;font-size:15px;line-height:24px;">Olá, <strong>',esc(firstName),'</strong>!</p>',
  '<p style="margin:0;font-size:15px;line-height:24px;color:#56565e;">Concluímos os serviços do seu veículo. Ele já está pronto para retirada. Confira abaixo os detalhes do atendimento.</p>',
  '</td></tr>',
  '<tr><td style="padding:12px 30px 0;">',
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f7f9;border:1px solid #e8e8ed;border-radius:12px;"><tr><td style="padding:18px 20px;">',
  '<p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1px;color:#767681;text-transform:uppercase;">VEÍCULO</p>',
  '<p style="margin:0;font-size:16px;line-height:22px;font-weight:700;color:#222228;">',esc(vehicleName),'</p>',
  plate?'<p style="margin:6px 0 0;font-size:13px;color:#5c5c65;">Placa: <strong>'+esc(plate)+'</strong></p>':'',
  '</td></tr></table></td></tr>',
  '<tr><td style="padding:28px 30px 0;">',
  '<h2 style="font-size:16px;margin:0 0 10px;color:#202026;">Resumo dos serviços</h2>',
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">',serviceRows,
  '<tr><td style="padding:18px 0 8px;font-size:14px;font-weight:700;color:#24242b;">Total dos serviços</td>',
  '<td align="right" style="padding:18px 0 8px;font-size:20px;font-weight:800;color:#b0182e;white-space:nowrap;">',esc(money(total)),'</td></tr>',
  '</table></td></tr>',
  '<tr><td align="center" style="padding:20px 30px 34px;">',
  '<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" bgcolor="#d71920" style="border-radius:9px;">',
  '<a href="',WEBSITE,'" style="display:inline-block;padding:14px 25px;font-size:14px;line-height:20px;font-weight:700;text-decoration:none;color:#ffffff;border-radius:9px;">Conheça nossa garagem</a>',
  '</td></tr></table>',
  '<p style="margin:22px 0 0;font-size:14px;line-height:22px;color:#5c5c65;">Obrigado pela confiança! Foi um prazer cuidar do seu veículo.</p>',
  '</td></tr>',
  '<tr><td align="center" style="padding:22px 24px;background:#f7f7f9;border-top:1px solid #e9e9ee;">',
  '<p style="margin:0 0 5px;font-size:12px;font-weight:700;color:#33333a;">Garagem Grau Car 096</p>',
  '<p style="margin:0;font-size:11px;line-height:18px;color:#777780;">Mensagem automática sobre seu atendimento. Se precisar de ajuda, responda a este e-mail.</p>',
  '</td></tr></table>',
  '</td></tr></table></body></html>'
 ].join('');
 const text=[
  'GARAGEM GRAU CAR 096',
  '',
  'Seu veículo está pronto!',
  'Olá, '+firstName+'!',
  '',
  'Concluímos os serviços do seu veículo. Ele já está pronto para retirada.',
  'Veículo: '+vehicleName+(plate?' — Placa: '+plate:''),
  '',
  'Serviços realizados:',
  ...items.map(item=>'- '+item.name+' — '+item.price),
  '',
  'Total dos serviços: '+money(total),
  '',
  'Obrigado pela confiança!',
  WEBSITE
 ].join('\n');
 return {html,text};
}
