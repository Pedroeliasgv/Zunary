# Checklist para trocar Asaas Sandbox para Produção

Este checklist deve ser seguido antes de ativar cobranças reais na Zunary.

---

## 1. Conferir ambiente atual

Antes de trocar para produção, confirmar que o projeto está funcionando em sandbox:

- [ ] Criar assinatura pelo plano Starter
- [ ] Criar assinatura pelo plano Pro
- [ ] Criar assinatura pelo plano Business
- [ ] Redirecionar para página de pagamento do Asaas
- [ ] Receber webhook PAYMENT_RECEIVED
- [ ] Ativar plano no Supabase
- [ ] Bloquear plano quando cancelado
- [ ] Cancelar assinatura no Asaas pela Zunary
- [ ] Registrar evento em billing_events

---

## 2. Variáveis no Supabase Edge Functions

No ambiente de produção, trocar os secrets:

### Sandbox atual

```env
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
ASAAS_API_KEY=$aact_hmlg...