import type { Transaction, PaymentMethod, TransactionStatus, TransactionType } from '../types/finance';

export const exportToCSV = (transactions: Transaction[], filename = 'transacoes-financeiras.csv') => {
  const headers = ['ID', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Data', 'Forma de Pagamento', 'Status', 'Observações'];
  
  const rows = transactions.map((t) => [
    t.id,
    t.type === 'income' ? 'Entrada' : 'Saída',
    `"${t.description.replace(/"/g, '""')}"`,
    `"${t.category.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.date,
    t.paymentMethod,
    t.status === 'completed' ? 'Concluído' : 'Pendente',
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const parseCSV = async (file: File): Promise<Partial<Transaction>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return resolve([]);

        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) return resolve([]);

        const headerLine = lines[0];
        const separator = headerLine.includes(';') ? ';' : ',';

        const parsed: Partial<Transaction>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(separator).map(col => col.replace(/^"(.*)"$/, '$1').trim());
          if (cols.length < 5) continue;

          const typeStr = cols[1]?.toLowerCase() || '';
          const type: TransactionType = (typeStr.includes('sa') || typeStr.includes('exp')) ? 'expense' : 'income';
          const description = cols[2] || 'Transação Importada';
          const category = cols[3] || (type === 'income' ? 'Salário' : 'Outras Saídas');
          const amountRaw = cols[4]?.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
          const amount = Math.abs(parseFloat(amountRaw) || 0);
          const date = cols[5]?.match(/^\d{4}-\d{2}-\d{2}$/) ? cols[5] : new Date().toISOString().split('T')[0];
          const paymentMethod = (cols[6] || 'pix') as PaymentMethod;
          const statusStr = cols[7]?.toLowerCase() || '';
          const status: TransactionStatus = statusStr.includes('pend') ? 'pending' : 'completed';
          const notes = cols[8] || 'Importado via CSV';

          parsed.push({
            id: `imported-${Date.now()}-${i}`,
            type,
            description,
            category,
            amount,
            date,
            paymentMethod,
            status,
            notes,
            createdAt: new Date().toISOString(),
          });
        }

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};
