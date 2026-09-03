import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply requireAuth to all transaction routes
router.use(requireAuth);

// GET /api/transactions - Returns only transactions belonging to the authenticated user
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Erro ao buscar lançamentos.' });
  }
});

// POST /api/transactions - Create new transaction isolated to this user
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type, description, amount, date, category, paymentMethod, status, notes } = req.body;

    if (!description || amount === undefined || !date || !category) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        type: type === 'income' ? 'income' : 'expense',
        description: String(description).trim(),
        amount: Number(amount),
        date: String(date),
        category: String(category),
        paymentMethod: String(paymentMethod || 'pix'),
        status: String(status || 'completed'),
        notes: notes ? String(notes).trim() : null,
      },
    });

    res.status(201).json({ transaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Erro ao salvar operação.' });
  }
});

// PUT /api/transactions/:id - Update transaction ensuring user owns it
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, description, amount, date, category, paymentMethod, status, notes } = req.body;

    // Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Operação não encontrada ou acesso negado.' });
      return;
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(type !== undefined && { type: type === 'income' ? 'income' : 'expense' }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(date !== undefined && { date: String(date) }),
        ...(category !== undefined && { category: String(category) }),
        ...(paymentMethod !== undefined && { paymentMethod: String(paymentMethod) }),
        ...(status !== undefined && { status: String(status) }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
      },
    });

    res.json({ transaction: updated });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Erro ao atualizar operação.' });
  }
});

// DELETE /api/transactions/:id - Delete transaction ensuring user owns it
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Operação não encontrada ou acesso negado.' });
      return;
    }

    await prisma.transaction.delete({
      where: { id },
    });

    res.json({ message: 'Operação excluída com sucesso.' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Erro ao excluir operação.' });
  }
});

// POST /api/transactions/bulk - Bulk import (for CSV imports)
router.post('/bulk', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Lista de operações vazia.' });
      return;
    }

    const created = await prisma.$transaction(
      items.map((item) =>
        prisma.transaction.create({
          data: {
            userId: req.userId!,
            type: item.type === 'income' ? 'income' : 'expense',
            description: String(item.description).trim(),
            amount: Number(item.amount),
            date: String(item.date),
            category: String(item.category || 'Outras Despesas'),
            paymentMethod: String(item.paymentMethod || 'other'),
            status: String(item.status || 'completed'),
            notes: item.notes ? String(item.notes).trim() : null,
          },
        })
      )
    );

    res.status(201).json({ count: created.length });
  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({ error: 'Erro ao importar operações em lote.' });
  }
});

// DELETE /api/transactions - Clear all transactions for the current user only
router.delete('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.transaction.deleteMany({
      where: { userId: req.userId },
    });

    res.json({ message: 'Histórico de lançamentos limpo.', count: result.count });
  } catch (error) {
    console.error('Error clearing transactions:', error);
    res.status(500).json({ error: 'Erro ao limpar lançamentos.' });
  }
});

export default router;
