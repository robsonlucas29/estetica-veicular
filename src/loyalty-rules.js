import {LOYALTY_REWARDS} from './business-metrics.js';
export const canRedeem=(account,reward,client)=>Boolean(account&&reward&&client?.loyalty_enabled!==false&&Number(account.points_debt||0)===0&&Number(account.points_balance)>=reward.points);
export const sortedLoyaltyAccounts=(accounts,clients)=>accounts.filter(a=>clients.find(c=>c.id===a.client_id)?.loyalty_enabled!==false).sort((a,b)=>Number(b.points_balance)-Number(a.points_balance)||(clients.find(c=>c.id===a.client_id)?.name||'').localeCompare(clients.find(c=>c.id===b.client_id)?.name||'','pt-BR'));
export const redeemableAccounts=(accounts,clients)=>sortedLoyaltyAccounts(accounts,clients).filter(a=>LOYALTY_REWARDS.some(r=>canRedeem(a,r,clients.find(c=>c.id===a.client_id))));
