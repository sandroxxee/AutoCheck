import { VehicleReport, UserAccount } from '../types/index.ts';

export async function buildVehiclePdfDoc(report: VehicleReport, user?: UserAccount | null): Promise<{ doc: any; filename: string }> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  type RGB = readonly [number, number, number];

  // Paleta Executiva e Moderna AutoCheck Brasil (Light Apple/Automotive Inspection System)
  const primaryNavy: RGB = [7, 17, 31];       // #07111F
  const brandBlue: RGB = [29, 78, 216];       // #1D4ED8
  const lightBlueBg: RGB = [238, 246, 255];   // #EEF6FF
  const iceWhite: RGB = [255, 255, 255];      // #FFFFFF
  const cardBg: RGB = [248, 250, 253];        // #F8FAFD
  const borderLight: RGB = [222, 231, 242];   // #DEE7F2
  const borderSubtle: RGB = [203, 213, 225];  // #CBD5E1
  const textDark: RGB = [11, 19, 43];         // #0B132B
  const textBody: RGB = [51, 65, 85];         // #334155
  const textMuted: RGB = [100, 116, 139];     // #64748B
  const greenSafe: RGB = [21, 128, 61];       // #15803D
  const greenBg: RGB = [240, 253, 244];       // #F0FDF4
  const amberWarn: RGB = [180, 83, 9];        // #B45309
  const amberBg: RGB = [254, 252, 232];       // #FEFCE8
  const redAlert: RGB = [185, 28, 28];        // #B91C1C
  const redBg: RGB = [254, 242, 242];         // #FEF2F2

  const isComplete = report.queryType === 'complete';
  const clientName = user?.name || user?.company || (user?.email ? user.email.split('@')[0] : 'Cliente Auditado');
  const clientEmail = user?.email || 'Acesso Autenticado';
  const queryDate = new Date(report.createdAt || Date.now());
  const dataFormatada = queryDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const horaFormatada = queryDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const protocolNum = `#AC-${(report.id || 'AUDIT').substring(0, 12).toUpperCase()}`;

  // ==========================================
  // 1. CABEÇALHO EXECUTIVO COM SELO DE SEGURANÇA
  // ==========================================
  // Fundo principal do cabeçalho
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Faixa de destaque azul royal inferior
  doc.setFillColor(...brandBlue);
  doc.rect(0, 34, pageWidth, 2.2, 'F');

  // Linha fina de brilho
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 36.2, pageWidth, 0.6, 'F');

  // Logo / Nome da Plataforma
  doc.setTextColor(...iceWhite);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('AUTOCHECK BRASIL', margin, 13);

  // Subtítulo técnico
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(191, 219, 254);
  doc.text('SISTEMA NACIONAL DE INTELIGÊNCIA & AUDITORIA DE PROCEDÊNCIA VEICULAR', margin, 18.5);

  // Badge do Tipo de Laudo
  const badgeWidth = isComplete ? 50 : 46;
  const badgeColor = isComplete ? greenSafe : amberWarn;
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(margin, 22.5, badgeWidth, 6, 1.2, 1.2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...iceWhite);
  doc.text(isComplete ? '✓ LAUDO COMPLETO 360° OFICIAL' : 'ℹ LAUDO BÁSICO CADASTRAL', margin + 3, 26.8);

  // Bloco de Autenticidade à Direita
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...iceWhite);
  doc.text(`PROTOCOLO: ${protocolNum}`, pageWidth - margin, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`EMISSÃO: ${dataFormatada} às ${horaFormatada}`, pageWidth - margin, 17.5, { align: 'right' });
  doc.text(`SOLICITANTE: ${clientName.toUpperCase()}`, pageWidth - margin, 22.5, { align: 'right' });
  doc.setTextColor(59, 130, 246);
  doc.text('AUTENTICIDADE CONFORME LEI 13.709/2018 (LGPD)', pageWidth - margin, 27.5, { align: 'right' });

  y = 42;

  // ==========================================
  // 2. HERO CARD: PLACA ESTAMPADA + VEÍCULO + SCORE
  // ==========================================
  const heroHeight = 36;
  doc.setFillColor(...cardBg);
  doc.setDrawColor(...borderSubtle);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, heroHeight, 2.5, 2.5, 'FD');

  // Placa Padrão Mercosul Estilizada
  const plateBoxW = 40;
  const plateBoxH = 25;
  const plateX = margin + 4;
  const plateY = y + 5.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(0, 51, 153);
  doc.setLineWidth(0.7);
  doc.roundedRect(plateX, plateY, plateBoxW, plateBoxH, 2, 2, 'FD');

  // Faixa Azul Mercosul
  doc.setFillColor(0, 51, 153);
  doc.roundedRect(plateX, plateY, plateBoxW, 6.5, 2, 2, 'F');
  doc.rect(plateX, plateY + 4, plateBoxW, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(255, 255, 255);
  doc.text('BRASIL', plateX + plateBoxW / 2, plateY + 4.6, { align: 'center' });

  // Caracteres da Placa
  doc.setFont('courier', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(...textDark);
  doc.text(report.plateFormatted || report.plate, plateX + plateBoxW / 2, plateY + 18.5, { align: 'center' });

  // Nome e Ficha Principal do Veículo
  const vehicleName = report.vehicle 
    ? `${report.vehicle.marca} ${report.vehicle.modelo}`.toUpperCase()
    : `VEÍCULO REGISTRADO • PLACA ${report.plateFormatted || report.plate}`;

  const textStartX = margin + plateBoxW + 9;
  const maxVehicleTextW = contentWidth - plateBoxW - 48;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...textDark);
  const displayVehName = doc.getTextWidth(vehicleName) > maxVehicleTextW
    ? vehicleName.substring(0, 36) + '...'
    : vehicleName;
  doc.text(displayVehName, textStartX, y + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textBody);
  const vehicleSub = report.vehicle
    ? `Ano ${report.vehicle.anoFabricacao}/${report.vehicle.anoModelo} • Cor ${report.vehicle.cor} • ${report.vehicle.combustivel} • ${report.vehicle.municipio}/${report.vehicle.uf}`
    : 'Auditoria veicular consolidada através de cruzamento de bases públicas e homologadas.';
  doc.text(vehicleSub, textStartX, y + 17.5);

  // Status de Circulação
  const isCirculando = report.vehicle?.situacaoVeiculo === 'EM_CIRCULACAO';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...(isCirculando ? greenSafe : amberWarn));
  doc.text(
    `Status Cadastral: ${isCirculando ? 'EM CIRCULAÇÃO (REGULAR)' : (report.vehicle?.situacaoVeiculo || 'REGULAR')}`,
    textStartX,
    y + 24
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text(`Laudo emitido para ${clientName} (${clientEmail})`, textStartX, y + 29.5);

  // Medidor / Score de Risco Moderno à Direita
  const scoreBoxW = 34;
  const scoreBoxH = 28;
  const scoreBoxX = pageWidth - margin - scoreBoxW - 4;
  const scoreBoxY = y + 4;

  let scoreBg = greenSafe;
  let scoreLabel = 'BAIXO RISCO';
  let scoreSubLabel = 'APTO P/ COMPRA';
  if (report.score < 50) {
    scoreBg = redAlert;
    scoreLabel = 'ALTO RISCO';
    scoreSubLabel = 'RESTRIÇÃO CRÍTICA';
  } else if (report.score < 80) {
    scoreBg = amberWarn;
    scoreLabel = 'RISCO MODERADO';
    scoreSubLabel = 'RESSALVAS IDENTIFICADAS';
  }

  doc.setFillColor(scoreBg[0], scoreBg[1], scoreBg[2]);
  doc.roundedRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SCORE DE SEGURANÇA', scoreBoxX + scoreBoxW / 2, scoreBoxY + 5.5, { align: 'center' });

  doc.setFontSize(16);
  doc.text(`${report.score}`, scoreBoxX + scoreBoxW / 2 - 3, scoreBoxY + 15, { align: 'center' });
  doc.setFontSize(9);
  doc.text('/100', scoreBoxX + scoreBoxW / 2 + 8, scoreBoxY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(scoreLabel, scoreBoxX + scoreBoxW / 2, scoreBoxY + 21, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text(scoreSubLabel, scoreBoxX + scoreBoxW / 2, scoreBoxY + 25, { align: 'center' });

  y += heroHeight + 6;

  // ==========================================
  // FUNÇÕES AUXILIARES DE RENDERIZAÇÃO
  // ==========================================
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 22) {
      doc.addPage();
      
      // Cabeçalho da página de continuação
      doc.setFillColor(...primaryNavy);
      doc.rect(0, 0, pageWidth, 16, 'F');
      doc.setFillColor(...brandBlue);
      doc.rect(0, 16, pageWidth, 1.5, 'F');
      
      doc.setTextColor(...iceWhite);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('AUTOCHECK BRASIL • LAUDO HISTÓRICO VEICULAR (CONTINUAÇÃO)', margin, 10.5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(191, 219, 254);
      doc.text(`PLACA: ${report.plateFormatted || report.plate} • PROTOCOLO: ${protocolNum}`, pageWidth - margin, 10.5, { align: 'right' });
      
      y = 24;
    }
  };

  const drawSectionHeader = (title: string, iconSymbol: string, statusText?: string, statusType?: 'success' | 'warn' | 'danger') => {
    checkPageBreak(20);
    
    // Barra lateral de cor azul
    doc.setFillColor(...brandBlue);
    doc.roundedRect(margin, y, 3, 7.5, 0.5, 0.5, 'F');

    // Título da seção
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...textDark);
    doc.text(`${iconSymbol} ${title}`, margin + 5.5, y + 5.5);

    // Status / Badge à direita da seção
    if (statusText) {
      let badgeBg = lightBlueBg;
      let badgeText = brandBlue;
      if (statusType === 'success') {
        badgeBg = greenBg;
        badgeText = greenSafe;
      } else if (statusType === 'danger') {
        badgeBg = redBg;
        badgeText = redAlert;
      } else if (statusType === 'warn') {
        badgeBg = amberBg;
        badgeText = amberWarn;
      }

      const stWidth = doc.getTextWidth(statusText) + 6;
      doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
      doc.setDrawColor(badgeText[0], badgeText[1], badgeText[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(pageWidth - margin - stWidth, y + 0.5, stWidth, 6, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
      doc.text(statusText, pageWidth - margin - stWidth / 2, y + 4.6, { align: 'center' });
    }

    // Linha divisória sutil
    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 9.5, pageWidth - margin, y + 9.5);

    y += 13;
  };

  const drawDataGrid = (
    items: Array<{ label: string; value: string; highlight?: 'success' | 'warn' | 'danger' }>,
    cols = 2
  ) => {
    const colWidth = contentWidth / cols;
    const rowHeight = 10;
    const totalRows = Math.ceil(items.length / cols);
    const gridHeight = totalRows * rowHeight + 2;

    checkPageBreak(gridHeight + 4);

    const startY = y;
    let currY = startY;

    items.forEach((item, index) => {
      const colIndex = index % cols;
      if (colIndex === 0 && index > 0) {
        currY += rowHeight;
      }
      const x = margin + colIndex * colWidth;

      // Fundo sutil para alternância
      const isAltRow = Math.floor(index / cols) % 2 === 1;
      if (isAltRow) {
        doc.setFillColor(250, 252, 255);
        doc.rect(x, currY - 2.5, colWidth - 2, rowHeight, 'F');
      }

      // Rótulo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(...textMuted);
      doc.text(item.label.toUpperCase(), x + 2, currY);

      // Valor
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);

      if (item.highlight === 'success') {
        doc.setTextColor(...greenSafe);
      } else if (item.highlight === 'danger') {
        doc.setTextColor(...redAlert);
      } else if (item.highlight === 'warn') {
        doc.setTextColor(...amberWarn);
      } else {
        doc.setTextColor(...textDark);
      }

      const maxValWidth = colWidth - 6;
      const displayVal = doc.getTextWidth(item.value) > maxValWidth 
        ? item.value.substring(0, 36) + '...'
        : item.value;

      doc.text(displayVal, x + 2, currY + 4.8);
    });

    y = currY + rowHeight + 2;
  };

  const drawLockedModule = (moduleName: string, description: string) => {
    checkPageBreak(18);
    doc.setFillColor(...amberBg);
    doc.setDrawColor(...amberWarn);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 13, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...amberWarn);
    doc.text(`🔒 RECURSO DISPONÍVEL NO LAUDO COMPLETO: ${moduleName.toUpperCase()}`, margin + 4, y + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textBody);
    doc.text(`${description} — Faça o upgrade deste laudo para desbloquear todos os registros.`, margin + 4, y + 9.5);

    y += 16;
  };

  // ==========================================
  // SEÇÕES DO LAUDO AUDITADO
  // ==========================================

  // 1. DADOS CADASTRAIS DO VEÍCULO
  drawSectionHeader('1. ESPECIFICAÇÕES E IDENTIFICAÇÃO CADASTRAL', '📋', 'BASE NACIONAL SENATRAN', 'success');
  if (report.vehicle) {
    const v = report.vehicle;
    drawDataGrid([
      { label: 'Marca / Modelo Homologado', value: `${v.marca} ${v.modelo}` },
      { label: 'Ano Fab. / Ano Modelo', value: `${v.anoFabricacao} / ${v.anoModelo}` },
      { label: 'Versão Oficial', value: v.versao || 'Padrão Homologado' },
      { label: 'Cor Predominante', value: v.cor || 'Não informada' },
      { label: 'Combustível / Propulsão', value: v.combustivel || 'Flex' },
      { label: 'Município / UF Emplacamento', value: `${v.municipio} / ${v.uf}` },
      { label: 'Chassi (Protegido LGPD)', value: v.chassiMascarado || '*** PROTEGIDO ***' },
      { label: 'Motor (Protegido LGPD)', value: v.motorMascarado || '*** PROTEGIDO ***' },
      { label: 'Espécie / Segmento', value: `${v.tipoVeiculo || 'Automóvel'} (${v.segmento || 'Passeio'})` },
      { label: 'Situação de Circulação', value: v.situacaoVeiculo === 'EM_CIRCULACAO' ? 'EM CIRCULAÇÃO (REGULAR)' : v.situacaoVeiculo, highlight: v.situacaoVeiculo === 'EM_CIRCULACAO' ? 'success' : 'warn' }
    ], 2);
  } else {
    drawDataGrid([{ label: 'Status Cadastral', value: 'Dados indisponíveis na base preliminar.' }], 1);
  }

  // 2. CHECAGEM DE ROUBO E FURTO
  const theftOk = report.theft.status === 'NADA_CONSTA';
  drawSectionHeader(
    '2. CHECAGEM POLICIAL & ALERTA DE ROUBO E FURTO',
    '🚨',
    theftOk ? 'NADA CONSTA' : 'ALERTA ATIVO',
    theftOk ? 'success' : 'danger'
  );
  drawDataGrid([
    { 
      label: 'Situação Policial Roubo/Furto', 
      value: theftOk ? 'NADA CONSTA (LIVRE DE RESTRIÇÃO CRIMINAL)' : 'ALERTA DE ROUBO/FURTO REGISTRADO',
      highlight: theftOk ? 'success' : 'danger'
    },
    { label: 'Data da Auditoria Policial', value: `${dataFormatada} às ${horaFormatada}` },
    { label: 'Boletim de Ocorrência Policial', value: report.theft.boletimOcorrencia || 'Nenhum registro ativo' },
    { label: 'Parecer do Sistema', value: report.theft.mensagem || 'Veículo com histórico criminal limpo.' }
  ], 2);

  // 3. GRAVAME E FINANCIAMENTO (SNG)
  const financingOk = report.financing.status === 'SEM_RESTRICAO';
  drawSectionHeader(
    '3. GRAVAME FINANCEIRO & ALIENAÇÃO FIDUCIÁRIA',
    '🏦',
    !isComplete ? 'BLOQUEADO' : (financingOk ? 'SEM RESTRIÇÃO' : 'COM GRAVAME'),
    !isComplete ? 'warn' : (financingOk ? 'success' : 'warn')
  );
  if (!isComplete) {
    drawLockedModule('Auditoria de Gravame e Financiamento Ativo', 'Verificação no Sistema Nacional de Gravames (SNG) de alienação fiduciária, leasing ou reserva de domínio.');
  } else {
    drawDataGrid([
      { 
        label: 'Situação Financeira / Gravame', 
        value: financingOk ? 'SEM RESTRIÇÃO (VEÍCULO QUITADO)' : (report.financing.descricao || 'GRAVAME REGISTRADO'),
        highlight: financingOk ? 'success' : 'warn'
      },
      { label: 'Instituição / Agente Financeiro', value: report.financing.agenteFinanceiro || 'Sem agente financeiro vinculado' },
      { label: 'Data de Inclusão do Gravame', value: report.financing.dataInclusao || 'Não se aplica' },
      { label: 'Contrato Protegido', value: report.financing.contratoMascarado || 'Sem contratos em aberto' }
    ], 2);
  }

  // 4. HISTÓRICO DE LEILÃO E SINISTROS
  const auctionOk = report.auction.status === 'SEM_REGISTRO';
  const accidentOk = report.accident.status === 'SEM_REGISTRO';
  const hasAuctionOrAccident = !auctionOk || !accidentOk;
  drawSectionHeader(
    '4. HISTÓRICO DE LEILÃO & SINISTROS SECURITÁRIOS',
    '💥',
    !isComplete ? 'BLOQUEADO' : (hasAuctionOrAccident ? 'OCORRÊNCIA ENCONTRADA' : 'NADA CONSTA'),
    !isComplete ? 'warn' : (hasAuctionOrAccident ? 'danger' : 'success')
  );
  if (!isComplete) {
    drawLockedModule('Histórico de Passagem por Leilão e Sinistros', 'Cruzamento com bases de leiloeiros oficiais do Brasil e sinistros com indenização integral / média monta.');
  } else {
    drawDataGrid([
      { 
        label: 'Registro em Leilões Oficiais', 
        value: auctionOk ? 'SEM REGISTRO EM LEILÃO' : (report.auction.descricao || 'PASSAGEM POR LEILÃO IDENTIFICADA'),
        highlight: auctionOk ? 'success' : 'danger'
      },
      { 
        label: 'Histórico de Sinistro / Perda', 
        value: accidentOk ? 'SEM REGISTRO DE SINISTRO' : (report.accident.descricao || 'AVARIA REGISTRADA'),
        highlight: accidentOk ? 'success' : 'danger'
      },
      { label: 'Empresa / Comitente Leiloeiro', value: report.auction.empresaLeilao || 'Nenhum apontamento' },
      { label: 'Classificação de Monta', value: report.accident.tipoSinistro || 'Sem dano estrutural apontado' }
    ], 2);
  }

  // 5. DÉBITOS, MULTAS E AUTUAÇÕES
  const totalDeb = report.debitos?.totalGeral ?? report.fines.valorTotalEstimado ?? 0;
  const finesOk = (report.fines.status === 'SEM_REGISTROS' || report.fines.quantidade === 0) && totalDeb === 0;
  drawSectionHeader(
    '5. DÉBITOS, MULTAS & AUTUAÇÕES (RENAINF / DETRAN)',
    '🚦',
    !isComplete ? 'BLOQUEADO' : (finesOk ? 'QUITADO' : 'DÉBITOS PENDENTES'),
    !isComplete ? 'warn' : (finesOk ? 'success' : 'danger')
  );
  if (!isComplete) {
    drawLockedModule('Checagem Completa de Débitos e Multas', 'Pesquisa de multas Renainf, IPVA atrasado, DPVAT e taxas de licenciamento anual pendentes.');
  } else {
    drawDataGrid([
      { 
        label: 'Autuações Registradas', 
        value: report.fines.quantidade === 0 ? 'NENHUMA AUTUAÇÃO PENDENTE' : `${report.fines.quantidade} autuação(ões) ativa(s)`,
        highlight: report.fines.quantidade === 0 ? 'success' : 'warn'
      },
      { 
        label: 'Total Geral Consolidado de Débitos', 
        value: totalDeb === 0 ? 'R$ 0,00 (QUITADO E REGULAR)' : `R$ ${totalDeb.toFixed(2).replace('.', ',')}`,
        highlight: totalDeb === 0 ? 'success' : 'danger'
      },
      {
        label: 'IPVA Atrasado / Licenciamento',
        value: report.debitos && (report.debitos.ipvaAtrasado > 0 || report.debitos.taxaLicenciamento > 0)
          ? `IPVA: R$ ${report.debitos.ipvaAtrasado.toFixed(2).replace('.', ',')} | Licenc: R$ ${report.debitos.taxaLicenciamento.toFixed(2).replace('.', ',')}`
          : 'Sem débitos de IPVA/Licenciamento',
        highlight: report.debitos && (report.debitos.ipvaAtrasado > 0 || report.debitos.taxaLicenciamento > 0) ? 'warn' : 'success'
      },
      {
        label: 'Situação de Regularidade Financeira',
        value: report.debitos?.fonteConsulta || 'Regular perante os órgãos de trânsito e arrecadação'
      }
    ], 2);
  }

  // 6. RESTRIÇÕES ADMINISTRATIVAS E JUDICIAIS (RENAJUD)
  const restrictions = report.restricoesAdministrativas || report.administrativeRestrictions;
  const hasRestrictions = restrictions && (restrictions.status === 'RESTRICOES_ENCONTRADAS' || (restrictions.quantidade && restrictions.quantidade > 0));
  drawSectionHeader(
    '6. RESTRIÇÕES ADMINISTRATIVAS & BLOQUEIOS (RENAJUD)',
    '⚖️',
    !isComplete ? 'BLOQUEADO' : (!hasRestrictions ? 'SEM RESTRIÇÃO' : 'RESTRIÇÃO ATIVA'),
    !isComplete ? 'warn' : (!hasRestrictions ? 'success' : 'danger')
  );
  if (!isComplete) {
    drawLockedModule('Bloqueios Judiciais e Administrativos', 'Verificação de ordens de penhora judicial RENAJUD, busca e apreensão, guincho e restrições no DETRAN.');
  } else {
    drawDataGrid([
      {
        label: 'Status Consolidado de Bloqueios',
        value: !hasRestrictions ? 'NADA CONSTA (LIVRE DE RESTRIÇÕES)' : (restrictions?.temBloqueioJudicial ? 'BLOQUEIO JUDICIAL RENAJUD' : 'RESTRIÇÃO ADMINISTRATIVA ATIVA'),
        highlight: !hasRestrictions ? 'success' : 'danger'
      },
      {
        label: 'Bloqueio Judicial (RENAJUD)',
        value: restrictions?.temBloqueioJudicial ? 'BLOQUEIO JUDICIAL ATIVO' : 'Nada Consta (Liberado)',
        highlight: restrictions?.temBloqueioJudicial ? 'danger' : 'success'
      },
      {
        label: 'Bloqueio Administrativo DETRAN',
        value: restrictions?.temBloqueioAdministrativo ? 'Consta Bloqueio Administrativo' : 'Sem Bloqueio',
        highlight: restrictions?.temBloqueioAdministrativo ? 'warn' : 'success'
      },
      {
        label: 'Restrição de Guincho / Pátio',
        value: restrictions?.temRestricaoGuincho ? 'Consta Recolhimento a Pátio' : 'Livre de Recolhimento',
        highlight: restrictions?.temRestricaoGuincho ? 'danger' : 'success'
      }
    ], 2);
  }

  // 7. TABELA FIPE OFICIAL
  if (report.fipe) {
    drawSectionHeader('7. PRECIFICAÇÃO OFICIAL DE MERCADO (TABELA FIPE)', '💰', report.fipe.valorFormatado, 'success');
    drawDataGrid([
      { label: 'Preço Médio de Referência FIPE', value: report.fipe.valorFormatado, highlight: 'success' },
      { label: 'Código Oficial FIPE', value: report.fipe.codigoFipe },
      { label: 'Mês de Referência da Tabela', value: report.fipe.mesReferencia },
      { label: 'Comportamento de Mercado (12M)', value: `${report.fipe.variacao12MesesPerc}% (Estável no Mercado Nacional)` }
    ], 2);
  }

  // 8. ESTIMATIVA DE IPVA E TRIBUTAÇÃO ESTADUAL
  if (report.ipva) {
    drawSectionHeader(`8. ESTIMATIVA DE IPVA & TRIBUTAÇÃO ESTADUAL (${report.ipva.uf})`, '🏛️', report.ipva.isento ? 'ISENTO' : 'REGULAR', 'success');
    drawDataGrid([
      { 
        label: 'Estimativa de IPVA Anual', 
        value: report.ipva.isento ? 'ISENTO DE IPVA (POR TEMPO DE FABRICAÇÃO)' : `R$ ${report.ipva.valorIpvaEstimado.toLocaleString('pt-BR')}`,
        highlight: report.ipva.isento ? 'success' : 'warn'
      },
      { label: `Alíquota Estadual Estimada (${report.ipva.uf})`, value: `${report.ipva.aliquotaPerc}% sobre a Tabela FIPE` },
      { label: 'Taxa Anual de Licenciamento', value: `R$ ${report.ipva.taxaLicenciamentoEstimada.toFixed(2).replace('.', ',')}` },
      { label: 'Custo Tributário Total Anual', value: `R$ ${report.ipva.custoTotalAnual.toFixed(2).replace('.', ',')}` }
    ], 2);
  }

  // 9. RECALL DE FÁBRICA
  if (report.recall) {
    const recallOk = !report.recall.possuiRecall;
    drawSectionHeader('9. SEGURANÇA & RECALLS PENDENTES DE FÁBRICA', '🛠️', recallOk ? 'SEM RECALL' : 'RECALL PENDENTE', recallOk ? 'success' : 'warn');
    drawDataGrid([
      { 
        label: 'Status de Campanhas de Recall', 
        value: recallOk ? 'NENHUM RECALL PENDENTE' : `${report.recall.totalRecalls} CAMPANHA(S) REGISTRADA(S)`,
        highlight: recallOk ? 'success' : 'danger'
      },
      { 
        label: 'Conformidade de Segurança', 
        value: recallOk ? 'Conforme para transferência veicular' : 'Atenção: Comparecer à concessionária autorizada',
        highlight: recallOk ? 'success' : 'warn'
      }
    ], 2);
  }

  // 10. FICHA TÉCNICA E CONSUMO (INMETRO)
  if (report.technicalSpecs) {
    const t = report.technicalSpecs;
    drawSectionHeader('10. FICHA TÉCNICA & EFICIÊNCIA ENERGÉTICA (INMETRO PBEV)', '⚡', `Nota: ${t.classificacaoPbev}`, 'success');
    drawDataGrid([
      { label: 'Consumo Urbano / Rodoviário (Gasolina)', value: `${t.consumoUrbanoGasolinaKml} km/l (Cidade) • ${t.consumoRodoviarioGasolinaKml} km/l (Estrada)` },
      { label: 'Consumo Urbano / Rodoviário (Etanol)', value: `${t.consumoUrbanoEtanolKml} km/l (Cidade) • ${t.consumoRodoviarioEtanolKml} km/l (Estrada)` },
      { label: 'Potência / Cilindrada', value: `${t.potenciaCv} cv (${t.cilindradasCm3} cm³)` },
      { label: 'Autonomia Rodoviária Máxima', value: `Até ${t.autonomiaRodoviariaKm} km (${t.capacidadeTanqueLitros}L)`, highlight: 'success' }
    ], 2);
  }

  // ==========================================
  // RODAPÉ E CERTIFICADO DE AUTENTICIDADE
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 16;
    
    // Linha divisória do rodapé
    doc.setDrawColor(...borderSubtle);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    // Textos do rodapé
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...textMuted);
    doc.text(
      'Documento oficial emitido eletronicamente pela AutoCheck Brasil. Dados obtidos por cruzamento em bases públicas e parceiros homologados.',
      margin,
      footerY + 4
    );
    doc.text(
      `Pesquisa realizada em ${dataFormatada} às ${horaFormatada} • Protocolo: ${protocolNum} • Em conformidade com a LGPD (Lei Federal 13.709/2018).`,
      margin,
      footerY + 7.5
    );

    // Hash e numeração de página
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...brandBlue);
    doc.text('AutoCheck Brasil • www.autocheck.com.br', margin, footerY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY + 11, { align: 'right' });
  }

  const safePlate = (report.plateFormatted || report.plate || 'veiculo').replace(/[^A-Za-z0-9]/g, '');
  const filename = `AutoCheck-Laudo-${safePlate}-${dataFormatada.replace(/\//g, '-')}.pdf`;

  return { doc, filename };
}

export async function generateVehiclePdf(report: VehicleReport, user?: UserAccount | null): Promise<void> {
  const { doc, filename } = await buildVehiclePdfDoc(report, user);
  doc.save(filename);
}

export async function generateVehiclePdfBlob(report: VehicleReport, user?: UserAccount | null): Promise<{ blob: Blob; filename: string }> {
  const { doc, filename } = await buildVehiclePdfDoc(report, user);
  const blob = doc.output('blob');
  return { blob, filename };
}

export async function generateVehiclePdfFile(report: VehicleReport, user?: UserAccount | null): Promise<File> {
  const { blob, filename } = await generateVehiclePdfBlob(report, user);
  return new File([blob], filename, { type: 'application/pdf' });
}
