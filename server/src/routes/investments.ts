import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/investments
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const investments = await prisma.investmentAsset.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ investments });
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({ error: 'Erro ao buscar investimentos.' });
  }
});

// POST /api/investments
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, ticker, type, institution, totalInvested, currentValue, monthlyYield, notes } = req.body;

    if (!name || totalInvested === undefined) {
      res.status(400).json({ error: 'Nome e total aplicado são obrigatórios.' });
      return;
    }

    const investedNum = Number(totalInvested);
    const currentNum = currentValue !== undefined ? Number(currentValue) : investedNum;
    const yieldNum = monthlyYield !== undefined ? Number(monthlyYield) : null;

    const asset = await prisma.investmentAsset.create({
      data: {
        userId: req.userId!,
        name: String(name).trim(),
        ticker: ticker ? String(ticker).trim().toUpperCase() : null,
        type: String(type || 'renda_fixa'),
        institution: String(institution || 'Corretora').trim(),
        totalInvested: investedNum,
        currentValue: currentNum,
        monthlyYield: yieldNum,
        notes: notes ? String(notes).trim() : null,
      },
    });

    res.status(201).json({ investment: asset });
  } catch (error) {
    console.error('Error creating investment:', error);
    res.status(500).json({ error: 'Erro ao cadastrar investimento.' });
  }
});

// PUT /api/investments/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, ticker, type, institution, totalInvested, currentValue, monthlyYield, notes } = req.body;

    const existing = await prisma.investmentAsset.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Investimento não encontrado ou acesso negado.' });
      return;
    }

    const updated = await prisma.investmentAsset.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(ticker !== undefined && { ticker: ticker ? String(ticker).trim().toUpperCase() : null }),
        ...(type !== undefined && { type: String(type) }),
        ...(institution !== undefined && { institution: String(institution).trim() }),
        ...(totalInvested !== undefined && { totalInvested: Number(totalInvested) }),
        ...(currentValue !== undefined && { currentValue: Number(currentValue) }),
        ...(monthlyYield !== undefined && { monthlyYield: Number(monthlyYield) }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
      },
    });

    res.json({ investment: updated });
  } catch (error) {
    console.error('Error updating investment:', error);
    res.status(500).json({ error: 'Erro ao atualizar investimento.' });
  }
});

// DELETE /api/investments/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.investmentAsset.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Investimento não encontrado ou acesso negado.' });
      return;
    }

    await prisma.investmentAsset.delete({
      where: { id },
    });

    res.json({ message: 'Investimento excluído com sucesso.' });
  } catch (error) {
    console.error('Error deleting investment:', error);
    res.status(500).json({ error: 'Erro ao excluir investimento.' });
  }
});

export default router;
