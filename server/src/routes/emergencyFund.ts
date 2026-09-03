import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/emergency-fund
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let fund = await prisma.emergencyFund.findUnique({
      where: { userId: req.userId },
    });

    if (!fund && req.userId) {
      fund = await prisma.emergencyFund.create({
        data: {
          userId: req.userId,
          targetMonths: 6,
          currentAmount: 0,
          institution: 'NuConta / Tesouro Selic',
        },
      });
    }

    res.json({ emergencyFund: fund });
  } catch (error) {
    console.error('Error fetching emergency fund:', error);
    res.status(500).json({ error: 'Erro ao buscar reserva de emergência.' });
  }
});

// PUT /api/emergency-fund
router.put('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { targetMonths, currentAmount, customTargetAmount, institution } = req.body;

    const updated = await prisma.emergencyFund.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        targetMonths: targetMonths !== undefined ? Number(targetMonths) : 6,
        currentAmount: currentAmount !== undefined ? Number(currentAmount) : 0,
        customTargetAmount: customTargetAmount !== undefined ? Number(customTargetAmount) : null,
        institution: institution ? String(institution).trim() : 'NuConta / Tesouro Selic',
      },
      update: {
        ...(targetMonths !== undefined && { targetMonths: Number(targetMonths) }),
        ...(currentAmount !== undefined && { currentAmount: Number(currentAmount) }),
        ...(customTargetAmount !== undefined && { customTargetAmount: Number(customTargetAmount) }),
        ...(institution !== undefined && { institution: String(institution).trim() }),
      },
    });

    res.json({ emergencyFund: updated });
  } catch (error) {
    console.error('Error updating emergency fund:', error);
    res.status(500).json({ error: 'Erro ao atualizar reserva de emergência.' });
  }
});

export default router;
