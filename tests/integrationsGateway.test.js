import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const gateway=read('supabase/functions/integrations-gateway-dev/index.ts');
const delivery=read('supabase/functions/notification-delivery-dev/index.ts');

test('gateway de IA exige usuario e perfil gestor',()=>{
 assert.match(gateway,/auth\.getUser\(/);
 assert.match(gateway,/administrador/);
 assert.match(gateway,/gerente/);
 assert.match(gateway,/store:false/);
 assert.match(gateway,/OPENAI_API_KEY/);
 assert.doesNotMatch(gateway,/SUPABASE_SERVICE_ROLE_KEY/);
});
test('gateway retorna apenas estado booleano dos provedores',()=>{
 assert.match(gateway,/secrets_exposed:false/);
 assert.match(gateway,/action==='status'/);
});
test('envio de notificacoes permanece desligado por padrao',()=>{
 assert.match(delivery,/ENABLE_LIVE_NOTIFICATIONS_DEV/);
 assert.match(delivery,/!=='true'/);
 assert.match(delivery,/action==='preview'/);
 assert.match(delivery,/notification_consents/);
 assert.match(delivery,/Consentimento revogado antes do envio/);
});
test('Meta usa template aprovado e Resend tem chave de idempotencia',()=>{
 assert.match(delivery,/META_TEMPLATE_NAME/);
 assert.match(delivery,/api\.resend\.com\/emails/);
 assert.match(delivery,/Idempotency-Key/);
 assert.match(delivery,/status:'processing'/);
});
