# Documento de Estratégia de Testes — tradexGG

**Projeto:** tradexGG  
**Autor:** willSolareviczz  
**Data:** 27/04/2026  

---

## 1. Introdução

Este documento descreve a estratégia de testes aplicada às três principais funcionalidades da plataforma tradexGG, uma aplicação de abertura de caixas de skins para CS2. Para cada funcionalidade são listadas as regras de negócio e pelo menos dois casos de teste classificados por tipo.

---

## 2. Funcionalidades Principais

### 2.1 Abertura de Caixas (Case Opening)

#### Regras de Negócio

- O usuário deve estar autenticado para abrir uma caixa.
- O saldo do usuário deve ser maior ou igual ao preço da caixa antes de confirmar a abertura.
- Ao abrir, o saldo é debitado imediatamente e um item é sorteado com base no sistema de pesos (`weight`) de cada skin na tabela `case_skins`.
- É possível abrir 1, 2, 3 ou 5 caixas simultaneamente (multi-abertura).
- O item sorteado é registrado no inventário do usuário e o evento é salvo no histórico de drops.
- O usuário pode vender o item recebido imediatamente após o drop, creditando o valor de mercado em seu saldo.

#### Casos de Teste

| # | Nome | Descrição | Tipo |
|---|------|-----------|------|
| CT-01 | Abertura bem-sucedida com saldo suficiente | **Positivo.** Dado um usuário autenticado com saldo de R$ 50,00 e uma caixa de R$ 29,98, ao clicar em "Abrir", o saldo deve ser debitado, um item deve ser sorteado e adicionado ao inventário. | **Integração** |
| CT-02 | Tentativa de abertura com saldo insuficiente | **Negativo.** Dado um usuário autenticado com saldo de R$ 5,00 e uma caixa de R$ 29,98, ao tentar abrir a caixa a API deve retornar erro 400 com mensagem "Saldo insuficiente" e nenhuma alteração deve ocorrer no saldo ou inventário. | **Integração** |

---

### 2.2 Autenticação de Usuário (Auth)

#### Regras de Negócio

- O e-mail deve ser único no sistema; tentativas de cadastro com e-mail já existente devem ser rejeitadas.
- A senha deve ter no mínimo 6 caracteres e é armazenada com hash bcrypt.
- O login retorna um JWT com validade definida; requisições autenticadas devem enviar o token no header `Authorization: Bearer <token>`.
- Tokens inválidos ou expirados devem ser rejeitados com status 401.
- O fluxo de recuperação de senha gera um token temporário enviado por e-mail; o token expira após uso ou por tempo limite.

#### Casos de Teste

| # | Nome | Descrição | Tipo |
|---|------|-----------|------|
| CT-03 | Registro com dados válidos | **Positivo.** Dado um payload `{ username, email, password }` com dados únicos e senha ≥ 6 caracteres, a rota `POST /api/auth/register` deve retornar status 201 e criar o usuário no banco com senha hasheada. | **Unitário** |
| CT-04 | Login com credenciais inválidas | **Negativo.** Dado um `POST /api/auth/login` com senha incorreta para um usuário existente, a API deve retornar status 401 com mensagem de erro e nenhum JWT deve ser emitido. | **Unitário** |

---

### 2.3 Inventário e Venda de Skins

#### Regras de Negócio

- O inventário exibe todas as skins obtidas pelo usuário que ainda não foram vendidas.
- Cada skin possui um preço de mercado (`market_price`) armazenado em centavos no banco.
- Ao vender uma skin, o item é removido do inventário e o valor de mercado é creditado no saldo do usuário atomicamente (dentro de uma transação SQL).
- Não é possível vender uma skin que não pertença ao usuário autenticado.
- A venda de múltiplas skins de uma abertura pode ser feita de uma vez pelo botão "Vender Tudo".

#### Casos de Teste

| # | Nome | Descrição | Tipo |
|---|------|-----------|------|
| CT-05 | Fluxo completo: abrir caixa → receber item → vender | **Positivo.** O usuário acessa `/open.html?id=1`, abre a caixa, recebe um item na animação de roleta, clica em "Vender" e o saldo exibido no header é atualizado com o valor do item. O item não deve mais aparecer no inventário. | **E2E** |
| CT-06 | Tentativa de vender skin de outro usuário | **Negativo.** Dado um `DELETE /api/inventory/:id` onde o `id` pertence a outro usuário, a API deve retornar status 403 com mensagem "Acesso negado" e o item não deve ser removido do banco. | **Integração** |

---

## 3. Resumo dos Casos de Teste

| ID | Funcionalidade | Tipo | Positivo/Negativo |
|----|---------------|------|-------------------|
| CT-01 | Abertura de Caixas | Integração | Positivo |
| CT-02 | Abertura de Caixas | Integração | Negativo |
| CT-03 | Autenticação | Unitário | Positivo |
| CT-04 | Autenticação | Unitário | Negativo |
| CT-05 | Inventário e Venda | E2E | Positivo |
| CT-06 | Inventário e Venda | Integração | Negativo |

---

## 4. Justificativa das Classificações

- **Unitário:** Testa uma única função/rota isoladamente, sem dependências externas reais (ex.: validação de credenciais de login, hash de senha).  
- **Integração:** Testa a comunicação entre dois ou mais componentes — API + banco de dados — verificando que o contrato entre camadas funciona corretamente.  
- **E2E (End-to-End):** Simula o fluxo completo do usuário no navegador, do clique inicial até o efeito final visível na interface, cobrindo frontend, backend e banco simultaneamente.
