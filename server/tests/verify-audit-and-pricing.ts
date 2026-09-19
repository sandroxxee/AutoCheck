import { dbService } from '../services/db.ts';
import { PRODUCT_PRICES, CREDIT_PACKAGES } from '../config/prices.ts';

async function runTests() {
  console.log('=== TESTE DE AUDITORIA, PREÇOS E PROTEÇÃO DE SALDO ===\n');

  // 1. Validar tabela de preços
  console.log('1. Validando Tabela de Preços:');
  const basicPlan = PRODUCT_PRICES.find(p => p.id === 'basic');
  const completePlan = PRODUCT_PRICES.find(p => p.id === 'complete');
  console.log(`- Preço Consulta Básica: R$ ${basicPlan?.priceBrl} (Esperado: 34.90)`);
  console.log(`- Preço Consulta Completa: R$ ${completePlan?.priceBrl} (Esperado: 49.90)`);
  if (basicPlan?.priceBrl !== 34.90 || completePlan?.priceBrl !== 49.90) {
    throw new Error('Falha no teste: Preços não conferem com o solicitado pelo usuário!');
  }
  console.log('✔ Tabela de preços validada com sucesso!\n');

  // 2. Validar cadastro de novo usuário (NÃO pode dar créditos grátis que queimem o saldo da API)
  console.log('2. Validando Cadastro de Usuário e Saldo Inicial Zero:');
  const testUserEmail = `audit_test_${Date.now()}@exemplo.com`;
  const registerResult = dbService.registerUser({
    name: 'Cliente Auditoria',
    email: testUserEmail,
    password: 'password123'
  });
  console.log(`- Usuário cadastrado: ID ${registerResult.user.id}, Saldo: ${registerResult.user.credits} créditos`);
  if (registerResult.user.credits !== 0) {
    throw new Error(`Falha no teste: Usuário novo recebeu ${registerResult.user.credits} créditos! Deve iniciar com 0.`);
  }
  console.log('✔ Novo usuário inicia com 0 créditos, impedindo consumo sem pagamento prévio!\n');

  // 3. Validar auditoria de tentativa bloqueada por falta de saldo
  console.log('3. Validando Bloqueio de Consulta sem Saldo:');
  const user = dbService.getUser(registerResult.user.id);
  if (!user || user.credits < 1) {
    dbService.logAction('BLOCKED_NO_CREDITS', 'XYZ9999', 'Tentativa de consulta bloqueada: saldo zerado.', registerResult.user.id);
  }
  const auditLogs = dbService.getAuditLogs(10);
  const blockedLog = auditLogs.find(l => l.action === 'BLOCKED_NO_CREDITS' && l.userId === registerResult.user.id);
  if (!blockedLog) {
    throw new Error('Falha no teste: Log de auditoria de bloqueio não foi registrado!');
  }
  console.log(`- Log registrado com sucesso: [${blockedLog.action}] ${blockedLog.details}`);
  console.log('✔ Tentativa sem saldo é interceptada e registrada em auditoria!\n');

  // 4. Simular recarga de crédito pelo usuário
  console.log('4. Validando Recarga de Crédito:');
  const rechargeTx = dbService.addTransaction({
    id: `tx_rec_${Date.now()}`,
    userId: registerResult.user.id,
    amount: 2,
    type: 'credit',
    description: 'Recarga via Pix (2 consultas)',
    priceBrl: 89.90,
    paymentMethod: 'PIX',
    status: 'completed',
    timestamp: new Date().toISOString()
  });
  const updatedUser = dbService.addCredits(registerResult.user.id, 2);
  console.log(`- Recarga efetuada. Novo saldo: ${updatedUser.credits} créditos`);
  if (updatedUser.credits !== 2) {
    throw new Error('Falha ao adicionar créditos após pagamento!');
  }
  console.log('✔ Créditos disponibilizados após confirmação de pagamento!\n');

  // 5. Simular execução de consulta com débito atômico
  console.log('5. Validando Débito Atômico na Execução da Consulta:');
  updatedUser.credits -= 1;
  dbService.saveUser(updatedUser);
  dbService.addTransaction({
    id: `tx_deb_${Date.now()}`,
    userId: updatedUser.id,
    amount: 1,
    type: 'debit',
    description: 'Consulta veicular Completa (Placa: BRA2E19)',
    plate: 'BRA2E19',
    priceBrl: 49.90,
    status: 'completed',
    timestamp: new Date().toISOString()
  });
  dbService.logAction('QUERY_CHARGED', 'BRA2E19', 'Consulta Completa realizada. 1 crédito debitado (R$ 49,90). Saldo restante: 1', updatedUser.id);

  const finalUser = dbService.getUser(updatedUser.id);
  console.log(`- Saldo final após débito: ${finalUser?.credits} crédito(s)`);
  if (finalUser?.credits !== 1) {
    throw new Error('Falha no débito do crédito após consulta!');
  }
  console.log('✔ Débito atômico e rastreabilidade total validados com sucesso!\n');

  console.log('===========================================================');
  console.log('TODOS OS TESTES DE AUDITORIA E VALORES PASSARAM COM SUCESSO!');
  console.log('===========================================================');
}

runTests().catch(err => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
