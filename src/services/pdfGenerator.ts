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
  const maxUsableY = pageHeight - 25; // 272mm (leaves 7mm safe buffer before footer at 279mm)
  let y = margin;

  type RGB = readonly [number, number, number];

  // Paleta Executiva e Moderna AutoCheck Brasil (Light Apple/Automotive Inspection System)
  const primaryNavy: RGB = [7, 17, 31];       // #07111F
  const brandBlue: RGB = [29, 78, 216];       // #1D4ED8
  const lightBlueBg: RGB = [238, 246, 255];   // #EEF6FF
  const iceWhite: RGB = [255, 255, 255];      // #FFFFFF
  const cardBg: RGB = [248, 250, 253];        // #F8FAFD
  const borderLight: RGB = [226, 232, 240];   // #E2E8F0
  const borderSubtle: RGB = [203, 213, 225];  // #CBD5E1
  const textDark: RGB = [15, 23, 42];         // #0F172A
  const textBody: RGB = [51, 65, 85];         // #334155
  const textMuted: RGB = [100, 116, 139];     // #64748B
  const greenSafe: RGB = [21, 128, 61];       // #15803D
  const greenBg: RGB = [240, 253, 244];       // #F0FDF4
  const amberWarn: RGB = [180, 83, 9];        // #B45309
  const amberBg: RGB = [254, 252, 232];       // #FEFCE8
  const redAlert: RGB = [185, 28, 28];        // #B91C1C
  const redBg: RGB = [254, 242, 242];         // #FEF2F2

  const isComplete = report.queryType === 'complete' || report.queryType === 'professional';
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
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Faixa de destaque azul royal inferior
  doc.setFillColor(...brandBlue);
  doc.rect(0, 32, pageWidth, 2, 'F');

  // Linha fina de brilho
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 34, pageWidth, 0.5, 'F');

  // Logo / Nome da Plataforma
  doc.setTextColor(...iceWhite);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('AUTOCHECK BRASIL', margin, 12);

  // Subtítulo técnico
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(191, 219, 254);
  doc.text('SISTEMA NACIONAL DE AUDITORIA & HISTÓRICO VEICULAR', margin, 17.5);

  // Badge do Tipo de Consulta
  const badgeWidth = isComplete ? 48 : 44;
  const badgeColor = isComplete ? greenSafe : amberWarn;
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(margin, 21, badgeWidth, 5.5, 1, 1, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...iceWhite);
  doc.text(isComplete ? 'CONSULTA COMPLETA 360' : 'CONSULTA PRELIMINAR', margin + 3, 25);

  // Bloco de Autenticidade à Direita
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...iceWhite);
  doc.text(`PROTOCOLO: ${protocolNum}`, pageWidth - margin, 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text(`EMISSÃO: ${dataFormatada} às ${horaFormatada}`, pageWidth - margin, 16, { align: 'right' });
  doc.text(`SOLICITANTE: ${clientName.toUpperCase()}`, pageWidth - margin, 21, { align: 'right' });
  doc.setTextColor(96, 165, 250);
  doc.text('CONFORMIDADE COM A LEI GERAL DE PROTEÇÃO DE DADOS (LGPD)', pageWidth - margin, 26, { align: 'right' });

  y = 39;

  // ==========================================
  // 2. HERO CARD: PLACA ESTAMPADA + VEÍCULO + SCORE
  // ==========================================
  const heroHeight = 35;
  doc.setFillColor(...cardBg);
  doc.setDrawColor(...borderSubtle);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, heroHeight, 2, 2, 'FD');

  // Placa Padrão Mercosul Estilizada (Precisão milimétrica)
  const plateBoxW = 42;
  const plateBoxH = 24;
  const plateX = margin + 4;
  const plateY = y + 5.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(0, 51, 153);
  doc.setLineWidth(0.6);
  doc.roundedRect(plateX, plateY, plateBoxW, plateBoxH, 1.8, 1.8, 'FD');

  // Faixa Azul Mercosul superior
  doc.setFillColor(0, 51, 153);
  doc.roundedRect(plateX, plateY, plateBoxW, 6.2, 1.8, 1.8, 'F');
  doc.rect(plateX, plateY + 3.8, plateBoxW, 2.4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(255, 255, 255);
  doc.text('BRASIL', plateX + plateBoxW / 2, plateY + 4.5, { align: 'center' });

  // Detalhe bandeira verde/amarelo
  doc.setFillColor(34, 197, 94);
  doc.circle(plateX + plateBoxW - 4.5, plateY + 3.2, 1.2, 'F');
  doc.setFillColor(234, 179, 8);
  doc.circle(plateX + plateBoxW - 4.5, plateY + 3.2, 0.6, 'F');

  // Caracteres da Placa em Helvetica Bold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...textDark);
  doc.text(report.plateFormatted || report.plate, plateX + plateBoxW / 2, plateY + 16.5, { align: 'center' });

  // Nome e Ficha Principal do Veículo
  const vehicleName = report.vehicle 
    ? `${report.vehicle.marca} ${report.vehicle.modelo}`.toUpperCase()
    : `VEÍCULO CADASTRADO • PLACA ${report.plateFormatted || report.plate}`;

  const textStartX = margin + plateBoxW + 8;
  const maxVehicleTextW = contentWidth - plateBoxW - 48;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...textDark);
  const displayVehName = doc.getTextWidth(vehicleName) > maxVehicleTextW
    ? vehicleName.substring(0, 38) + '...'
    : vehicleName;
  doc.text(displayVehName, textStartX, y + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textBody);
  const vehicleSub = report.vehicle
    ? `Ano ${report.vehicle.anoFabricacao}/${report.vehicle.anoModelo} • Cor ${report.vehicle.cor} • ${report.vehicle.combustivel} • ${report.vehicle.municipio}/${report.vehicle.uf}`
    : 'Auditoria veicular consolidada através de cruzamento de bases públicas e parceiros homologados.';
  doc.text(vehicleSub, textStartX, y + 16.5);

  // Status de Circulação
  const isCirculando = report.vehicle?.situacaoVeiculo === 'EM_CIRCULACAO' || !report.vehicle?.situacaoVeiculo;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...(isCirculando ? greenSafe : amberWarn));
  doc.text(
    `Status Cadastral: ${isCirculando ? 'EM CIRCULAÇÃO (REGULAR)' : (report.vehicle?.situacaoVeiculo || 'REGULAR')}`,
    textStartX,
    y + 22.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...textMuted);
  doc.text(`Relatório de consulta informativa emitido para ${clientName} (${clientEmail})`, textStartX, y + 28);

  // Medidor / Score de Risco Moderno à Direita (Sem colisões)
  const scoreBoxW = 34;
  const scoreBoxH = 27;
  const scoreBoxX = pageWidth - margin - scoreBoxW - 4;
  const scoreBoxY = y + 4;

  let scoreBg = greenSafe;
  let scoreLabel = 'BAIXO RISCO';
  if (report.score < 50) {
    scoreBg = redAlert;
    scoreLabel = 'ALTO RISCO';
  } else if (report.score < 80) {
    scoreBg = amberWarn;
    scoreLabel = 'RISCO MODERADO';
  }

  doc.setFillColor(scoreBg[0], scoreBg[1], scoreBg[2]);
  doc.roundedRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(255, 255, 255);
  doc.text('SCORE DE RISCO', scoreBoxX + scoreBoxW / 2, scoreBoxY + 5.5, { align: 'center' });

  doc.setFontSize(16);
  doc.text(String(report.score), scoreBoxX + scoreBoxW / 2, scoreBoxY + 14.5, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('DE 100 PONTOS', scoreBoxX + scoreBoxW / 2, scoreBoxY + 19, { align: 'center' });

  // Pílula com o veredito
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(scoreBoxX + 3, scoreBoxY + 20.5, scoreBoxW - 6, 4.8, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(scoreBg[0], scoreBg[1], scoreBg[2]);
  doc.text(scoreLabel, scoreBoxX + scoreBoxW / 2, scoreBoxY + 24, { align: 'center' });

  y += heroHeight + 5;

  // ==========================================
  // FUNÇÕES AUXILIARES DE RENDERIZAÇÃO
  // ==========================================
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > maxUsableY) {
      doc.addPage();
      
      // Cabeçalho da página de continuação
      doc.setFillColor(...primaryNavy);
      doc.rect(0, 0, pageWidth, 14, 'F');
      doc.setFillColor(...brandBlue);
      doc.rect(0, 14, pageWidth, 1.2, 'F');
      
      doc.setTextColor(...iceWhite);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('AUTOCHECK BRASIL • CONSULTA DE HISTÓRICO VEICULAR (CONTINUAÇÃO)', margin, 9);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(191, 219, 254);
      doc.text(`PLACA: ${report.plateFormatted || report.plate} • PROTOCOLO: ${protocolNum}`, pageWidth - margin, 9, { align: 'right' });
      
      y = 20;
    }
  };

  /**
   * Renderiza uma seção completa de dados mantendo o cabeçalho e dados juntos.
   * Evita cabeçalhos órfãos no rodapé das páginas!
   */
  const renderSection = (
    sectionNumber: string,
    title: string,
    statusText: string,
    statusType: 'success' | 'warn' | 'danger',
    items: Array<{ label: string; value: string; highlight?: 'success' | 'warn' | 'danger' }>,
    cols = 2
  ) => {
    const colWidth = contentWidth / cols;
    const rowHeight = 10;
    const totalRows = Math.ceil(items.length / cols);
    const gridHeight = totalRows * rowHeight + 2;
    const totalSectionHeight = 12 + gridHeight;

    // Se o cabeçalho + as primeiras linhas não couberem, quebra página ANTES do cabeçalho
    checkPageBreak(Math.min(totalSectionHeight, 35));

    // Badge numérico lateral [01]
    doc.setFillColor(...brandBlue);
    doc.roundedRect(margin, y, 7.5, 6, 1, 1, 'F');
    doc.setTextColor(...iceWhite);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text(sectionNumber, margin + 3.75, y + 4.3, { align: 'center' });

    // Título da seção (Texto limpo, sem emojis)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.text(title, margin + 9.5, y + 4.5);

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

      const cleanStatus = statusText.toUpperCase();
      const stWidth = doc.getTextWidth(cleanStatus) + 5;
      doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
      doc.setDrawColor(badgeText[0], badgeText[1], badgeText[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(pageWidth - margin - stWidth, y, stWidth, 5.5, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
      doc.text(cleanStatus, pageWidth - margin - stWidth / 2, y + 3.9, { align: 'center' });
    }

    // Linha divisória sutil
    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

    y += 10;

    // Renderiza células do grid
    items.forEach((item, index) => {
      const colIndex = index % cols;
      if (colIndex === 0 && index > 0) {
        y += rowHeight;
        checkPageBreak(rowHeight + 2);
      }
      const x = margin + colIndex * colWidth;

      // Fundo sutil para alternância
      const isAltRow = Math.floor(index / cols) % 2 === 1;
      if (isAltRow) {
        doc.setFillColor(250, 252, 255);
        doc.rect(x, y - 1.5, colWidth - 1.5, rowHeight, 'F');
      }

      // Rótulo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...textMuted);
      doc.text(item.label.toUpperCase(), x + 1.5, y + 2);

      // Valor
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);

      if (item.highlight === 'success') {
        doc.setTextColor(...greenSafe);
      } else if (item.highlight === 'danger') {
        doc.setTextColor(...redAlert);
      } else if (item.highlight === 'warn') {
        doc.setTextColor(...amberWarn);
      } else {
        doc.setTextColor(...textDark);
      }

      const safeVal = String(item.value || '-');
      const maxValWidth = colWidth - 5;
      const displayVal = doc.getTextWidth(safeVal) > maxValWidth 
        ? safeVal.substring(0, 36) + '...'
        : safeVal;

      doc.text(displayVal, x + 1.5, y + 6.2);
    });

    y += rowHeight + 3.5;
  };

  const drawLockedModule = (sectionNum: string, moduleName: string, description: string) => {
    checkPageBreak(24);
    
    // Header
    doc.setFillColor(...brandBlue);
    doc.roundedRect(margin, y, 7.5, 6, 1, 1, 'F');
    doc.setTextColor(...iceWhite);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text(sectionNum, margin + 3.75, y + 4.3, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.text(moduleName, margin + 9.5, y + 4.5);

    y += 8;

    doc.setFillColor(...amberBg);
    doc.setDrawColor(...amberWarn);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, contentWidth, 12, 1.2, 1.2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...amberWarn);
    doc.text(`BLOQUEADO: DISPONÍVEL NA CONSULTA COMPLETA 360`, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...textBody);
    doc.text(`${description} — Efetue a consulta completa para desbloquear todos os dados.`, margin + 3, y + 8.8);

    y += 15;
  };

  // ==========================================
  // SEÇÕES DO LAUDO AUDITADO (SEM EMOJIS, 100% ALINHADO)
  // ==========================================

  // 1. DADOS CADASTRAIS DO VEÍCULO
  if (report.vehicle) {
    const v = report.vehicle;
    renderSection(
      '01',
      'IDENTIFICACAO CADASTRAL & ESPECIFICACOES SENATRAN',
      'BASE NACIONAL SENATRAN',
      'success',
      [
        { label: 'Marca / Modelo Homologado', value: `${v.marca} ${v.modelo}` },
        { label: 'Submodelo / Versão', value: `${v.submodelo || ''} ${v.versao || 'Padrão Homologado'}`.trim() },
        { label: 'Ano Fab. / Ano Modelo', value: `${v.anoFabricacao} / ${v.anoModelo}` },
        { label: 'Cor Predominante', value: v.cor || 'Não informada' },
        { label: 'Combustível / Propulsão', value: v.combustivel || 'Flex' },
        { label: 'Câmbio / Transmissão', value: v.cambio || 'Automático / Manual' },
        { label: 'Município / UF Emplacamento', value: `${v.municipio} / ${v.uf}` },
        { label: 'Data do Emplacamento', value: v.dataEmplacamento || 'Regular' },
        { label: 'Chassi (Protegido LGPD)', value: v.chassiMascarado || '*** PROTEGIDO ***' },
        { label: 'Motor (Protegido LGPD)', value: v.motorMascarado || '*** PROTEGIDO ***' },
        { label: 'RENAVAM (Protegido LGPD)', value: v.renavamMascarado || '*** PROTEGIDO ***' },
        { label: 'Categoria / Carroceria', value: `${v.categoria || 'Particular'} / ${v.carroceria || 'Passeio'}` },
        { label: 'Espécie / Segmento', value: `${v.tipoVeiculo || 'Automóvel'} (${v.segmento || 'Passeio'})` },
        { label: 'Eixos / Lotação', value: `${v.eixos ? `${v.eixos} eixos` : '2 eixos'} • ${v.lotacao || '5 Ocupantes'}` },
        { label: 'Peso Bruto Total (PBT) / CMT', value: `${v.pesoBrutoTotal || 'Conforme catálogo'} / ${v.capacidadeTracao || '450 kg'}` },
        { label: 'Situação de Circulação', value: v.situacaoVeiculo === 'EM_CIRCULACAO' ? 'EM CIRCULAÇÃO (REGULAR)' : (v.situacaoVeiculo || 'REGULAR'), highlight: v.situacaoVeiculo === 'EM_CIRCULACAO' ? 'success' : 'warn' }
      ],
      2
    );
  }

  // 2. CHECAGEM DE ROUBO E FURTO
  const theftOk = report.theft.status === 'NADA_CONSTA';
  renderSection(
    '02',
    'CHECAGEM POLICIAL & ALERTA DE ROUBO E FURTO (SINESP)',
    theftOk ? 'NADA CONSTA' : 'ALERTA ATIVO',
    theftOk ? 'success' : 'danger',
    [
      { 
        label: 'Situação Policial Roubo/Furto', 
        value: theftOk ? 'NADA CONSTA (LIVRE DE RESTRIÇÃO CRIMINAL)' : 'ALERTA DE ROUBO/FURTO REGISTRADO',
        highlight: theftOk ? 'success' : 'danger'
      },
      { label: 'Data da Auditoria Policial', value: `${dataFormatada} às ${horaFormatada}` },
      { label: 'Boletim de Ocorrência Policial', value: report.theft.boletimOcorrencia || 'Nenhum registro ativo' },
      { label: 'Parecer do Sistema', value: report.theft.mensagem || 'Veículo com histórico criminal limpo.' }
    ],
    2
  );

  // 3. GRAVAME E FINANCIAMENTO (SNG)
  const financingOk = report.financing.status === 'SEM_RESTRICAO';
  if (!isComplete) {
    drawLockedModule('03', 'GRAVAME FINANCEIRO & ALIENACAO FIDUCIARIA', 'Verificação no Sistema Nacional de Gravames (SNG) de alienação fiduciária, leasing ou reserva de domínio.');
  } else {
    renderSection(
      '03',
      'GRAVAME FINANCEIRO & ALIENACAO FIDUCIARIA (SNG / B3)',
      financingOk ? 'SEM RESTRICAO' : 'COM GRAVAME',
      financingOk ? 'success' : 'warn',
      [
        { 
          label: 'Situação Financeira / Gravame', 
          value: financingOk ? 'SEM RESTRIÇÃO (VEÍCULO QUITADO)' : (report.financing.descricao || 'GRAVAME REGISTRADO'),
          highlight: financingOk ? 'success' : 'warn'
        },
        { label: 'Instituição / Agente Financeiro', value: report.financing.agenteFinanceiro || 'Sem agente financeiro vinculado' },
        { label: 'Data de Inclusão do Gravame', value: report.financing.dataInclusao || 'Não se aplica' },
        { label: 'Contrato Protegido', value: report.financing.contratoMascarado || 'Sem contratos em aberto' }
      ],
      2
    );
  }

  // 4. HISTÓRICO DE LEILÃO E SINISTROS
  const auctionOk = report.auction.status === 'SEM_REGISTRO';
  const accidentOk = report.accident.status === 'SEM_REGISTRO';
  const hasAuctionOrAccident = !auctionOk || !accidentOk;
  if (!isComplete) {
    drawLockedModule('04', 'HISTORICO DE LEILAO & SINISTROS SECURITARIOS', 'Cruzamento com 120+ leiloeiros oficiais do Brasil e apontamentos de perda total / média monta.');
  } else {
    renderSection(
      '04',
      'HISTORICO DE LEILAO & SINISTROS SECURITARIOS (120+ BASES)',
      hasAuctionOrAccident ? 'OCORRENCIA' : 'NADA CONSTA',
      hasAuctionOrAccident ? 'danger' : 'success',
      [
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
      ],
      2
    );
  }

  // 5. DÉBITOS, MULTAS E AUTUAÇÕES
  const totalDeb = report.debitos?.totalGeral ?? report.fines.valorTotalEstimado ?? 0;
  const finesOk = (report.fines.status === 'SEM_REGISTROS' || report.fines.quantidade === 0) && totalDeb === 0;
  if (!isComplete) {
    drawLockedModule('05', 'DEBITOS, MULTAS & AUTUACOES (RENAINF / DETRAN)', 'Pesquisa consolidada de multas Renainf, IPVA em atraso, DPVAT e taxas de licenciamento anual.');
  } else {
    renderSection(
      '05',
      'DEBITOS, MULTAS & AUTUACOES (RENAINF / DETRAN / SEFAZ)',
      finesOk ? 'QUITADO' : 'PENDENCIAS',
      finesOk ? 'success' : 'danger',
      [
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
      ],
      2
    );
  }

  // 6. RESTRIÇÕES ADMINISTRATIVAS E JUDICIAIS (RENAJUD)
  const restrictions = report.restricoesAdministrativas || report.administrativeRestrictions;
  const hasRestrictions = restrictions && (restrictions.status === 'RESTRICOES_ENCONTRADAS' || (restrictions.quantidade && restrictions.quantidade > 0));
  if (!isComplete) {
    drawLockedModule('06', 'RESTRICOES ADMINISTRATIVAS & BLOQUEIOS (RENAJUD)', 'Ordens de penhora judicial RENAJUD, busca e apreensão, guincho e restrições no DETRAN.');
  } else {
    renderSection(
      '06',
      'RESTRICOES ADMINISTRATIVAS & BLOQUEIOS JUDICIAIS (RENAJUD)',
      !hasRestrictions ? 'SEM RESTRICAO' : 'RESTRICAO ATIVA',
      !hasRestrictions ? 'success' : 'danger',
      [
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
      ],
      2
    );
  }

  // 7. TABELA FIPE OFICIAL
  if (report.fipe) {
    renderSection(
      '07',
      'PRECIFICACAO OFICIAL DE MERCADO (TABELA FIPE)',
      report.fipe.valorFormatado,
      'success',
      [
        { label: 'Preço Médio de Referência FIPE', value: report.fipe.valorFormatado, highlight: 'success' },
        { label: 'Código Oficial FIPE', value: report.fipe.codigoFipe },
        { label: 'Mês de Referência da Tabela', value: report.fipe.mesReferencia },
        { label: 'Comportamento de Mercado (12M)', value: `${report.fipe.variacao12MesesPerc}% (Estável no Mercado Nacional)` }
      ],
      2
    );
  }

  // 8. ESTIMATIVA DE IPVA E TRIBUTAÇÃO ESTADUAL
  if (report.ipva) {
    renderSection(
      '08',
      `ESTIMATIVA DE IPVA & TRIBUTACAO ESTADUAL (${report.ipva.uf})`,
      report.ipva.isento ? 'ISENTO' : 'REGULAR',
      'success',
      [
        { 
          label: 'Estimativa de IPVA Anual', 
          value: report.ipva.isento ? 'ISENTO DE IPVA (POR TEMPO DE FABRICAÇÃO)' : `R$ ${report.ipva.valorIpvaEstimado.toLocaleString('pt-BR')}`,
          highlight: report.ipva.isento ? 'success' : 'warn'
        },
        { label: `Alíquota Estadual Estimada (${report.ipva.uf})`, value: `${report.ipva.aliquotaPerc}% sobre a Tabela FIPE` },
        { label: 'Taxa Anual de Licenciamento', value: `R$ ${report.ipva.taxaLicenciamentoEstimada.toFixed(2).replace('.', ',')}` },
        { label: 'Custo Tributário Total Anual', value: `R$ ${report.ipva.custoTotalAnual.toFixed(2).replace('.', ',')}` }
      ],
      2
    );
  }

  // 9. RECALL DE FÁBRICA
  if (report.recall) {
    const recallOk = !report.recall.possuiRecall;
    renderSection(
      '09',
      'SEGURANCA & RECALLS PENDENTES DE FABRICA (MONTADORA)',
      recallOk ? 'SEM RECALL' : 'RECALL PENDENTE',
      recallOk ? 'success' : 'warn',
      [
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
      ],
      2
    );
  }

  // 10. FICHA TÉCNICA E CONSUMO (INMETRO)
  if (report.technicalSpecs) {
    const t = report.technicalSpecs;
    renderSection(
      '10',
      'FICHA TECNICA & EFICIENCIA ENERGETICA (INMETRO PBEV)',
      `SELO NOTA ${t.classificacaoPbev}`,
      'success',
      [
        { label: 'Consumo Urbano / Rodoviário (Gasolina)', value: `${t.consumoUrbanoGasolinaKml} km/l (Cidade) • ${t.consumoRodoviarioGasolinaKml} km/l (Estrada)` },
        { label: 'Consumo Urbano / Rodoviário (Etanol)', value: `${t.consumoUrbanoEtanolKml} km/l (Cidade) • ${t.consumoRodoviarioEtanolKml} km/l (Estrada)` },
        { label: 'Potência / Cilindrada', value: `${t.potenciaCv} cv (${t.cilindradasCm3} cm³)` },
        { label: 'Autonomia Rodoviária Máxima', value: `Até ${t.autonomiaRodoviariaKm} km (${t.capacidadeTanqueLitros}L)`, highlight: 'success' }
      ],
      2
    );
  }

  // 11. TERMO DE RESPONSABILIDADE E DISCLAIMER OBRIGATÓRIO (LGPD & DETRAN)
  checkPageBreak(25);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...borderSubtle);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 23, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...textDark);
  doc.text('AVISO LEGAL & DISCLAIMER OBRIGATÓRIO DE RESPONSABILIDADE', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(...textBody);
  
  // Disclaimer textual exato requerido pelo usuário:
  const disclaimerLine1 = `Dados informativos conforme base SENATRAN / SINESP / RENAINF / SEFAZ / DETRAN em ${dataFormatada} às ${horaFormatada}.`;
  const disclaimerLine2 = 'Não substitui vistoria cautelar e não garante ausência de débitos. Consulte DETRAN para validação.';
  const disclaimerLine3 = 'Aviso: Laudo pericial e de transferência é ato privativo de Empresas Credenciadas de Vistoria (ECV) e Despachantes Oficiais.';
  
  doc.text(disclaimerLine1, margin + 3, y + 9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(disclaimerLine2, margin + 3, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(disclaimerLine3, margin + 3, y + 18.5);

  y += 27;

  // ==========================================
  // RODAPÉ E CERTIFICADO DE AUTENTICIDADE EM TODAS AS PÁGINAS
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 19;
    
    // Linha divisória do rodapé
    doc.setDrawColor(...borderSubtle);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    // Textos do rodapé com disclaimer obrigatório e conformidade LGPD
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(...textMuted);
    doc.text(
      `Dados informativos conforme base SENATRAN / SINESP / RENAINF em ${dataFormatada} às ${horaFormatada}. Não substitui vistoria cautelar e não garante ausência de débitos. Consulte DETRAN para validação.`,
      margin,
      footerY + 3.8
    );
    doc.text(
      `Pesquisa realizada em conformidade com a LGPD (Lei 13.709/2018). Dados pessoais de proprietário protegidos. Protocolo: ${protocolNum}`,
      margin,
      footerY + 7.2
    );

    // Razão Social / CNPJ e numeração de página
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...brandBlue);
    doc.text('AUTOCHECK BRASIL TECNOLOGIA VEICULAR LTDA • CNPJ: 52.194.882/0001-94 • www.autocheck.com.br', margin, footerY + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY + 11.5, { align: 'right' });
  }

  const safePlate = (report.plateFormatted || report.plate || 'veiculo').replace(/[^A-Za-z0-9]/g, '');
  const filename = `AutoCheck-Consulta-Historico-${safePlate}-${dataFormatada.replace(/\//g, '-')}.pdf`;

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
