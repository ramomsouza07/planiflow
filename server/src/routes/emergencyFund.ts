import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { 
  encryptText, 
  decryptEmergencyFund 
} from '../utils/encryption';

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
          institution: encryptText('NuConta / Tesouro Selic'),
        },
      });
    }

    res.json({ emergencyFund: fund ? decryptEmergencyFund(fund) : null });
  } catch (error) {
    console.error('Error fetching emergency fund:', error);
    res.status(500).json({ error: 'Erro ao buscar reserva de emergência.' });
  }
});

// PUT /api/emergency-fund
router.put('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { targetMonths, currentAmount, customTargetAmount, institution } = req.body;

    const defaultInst = institution ? String(institution).trim() : 'NuConta / Tesouro Selic';

    const updated = await prisma.emergencyFund.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        targetMonths: targetMonths !== undefined ? Number(targetMonths) : 6,
        currentAmount: currentAmount !== undefined ? Number(currentAmount) : 0,
        customTargetAmount: customTargetAmount !== undefined ? Number(customTargetAmount) : null,
        institution: encryptText(defaultInst),
      },
      update: {
        ...(targetMonths !== undefined && { targetMonths: Number(targetMonths) }),
        ...(currentAmount !== undefined && { currentAmount: Number(currentAmount) }),
        ...(customTargetAmount !== undefined && { customTargetAmount: Number(customTargetAmount) }),
        ...(institution !== undefined && { institution: encryptText(String(institution).trim()) }),
      },
    });

    res.json({ emergencyFund: decryptEmergencyFund(updated) });
  } catch (error) {
    console.error('Error updating emergency fund:', error);
    res.status(500).json({ error: 'Erro ao atualizar reserva de emergência.' });
  }
});

export default router;
