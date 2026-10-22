/* Service worker conservador: nao intercepta requisicoes de rede,
   nao armazena clientes, sessoes, fotos, API ou dados financeiros. */
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting());});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
