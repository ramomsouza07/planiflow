import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação & Supermercado', type: 'expense', color: '#ff4d6a', icon: 'Utensils' },
  { name: 'Moradia & Aluguel', type: 'expense', color: '#ffa800', icon: 'Home' },
  { name: 'Transporte & Combustível', type: 'expense', color: '#00c4df', icon: 'Car' },
  { name: 'Saúde & Farmácia', type: 'expense', color: '#9b51e0', icon: 'HeartPulse' },
  { name: 'Lazer & Entretenimento', type: 'expense', color: '#0066ff', icon: 'Film' },
  { name: 'Educação & Cursos', type: 'expense', color: '#60a5fa', icon: 'GraduationCap' },
  { name: 'Outras Despesas', type: 'expense', color: '#64748b', icon: 'Tag' },
  { name: 'Salário & Renda Fixa', type: 'income', color: '#00d284', icon: 'Briefcase' },
  { name: 'Freelance & Projetos', type: 'income', color: '#10b981', icon: 'Laptop' },
  { name: 'Rendimentos & Dividendos', type: 'income', color: '#34d399', icon: 'TrendingUp' },
  { name: 'Outras Entradas', type: 'income', color: '#059669', icon: 'Wallet' },
];

// GET /api/categories
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: { name: 'asc' },
    });

    // If user has no categories yet, initialize defaults
    if (categories.length === 0 && req.userId) {
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map(c => ({
          userId: req.userId!,
          name: c.name,
          type: c.type,
          color: c.color,
          icon: c.icon,
        })),
      });

      categories = await prisma.category.findMany({
        where: { userId: req.userId },
        orderBy: { name: 'asc' },
      });
    }

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
});

// POST /api/categories
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, type, color, icon } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
      return;
    }

    const cleanName = String(name).trim();
    const existing = await prisma.category.findFirst({
      where: {
        userId: req.userId,
        name: cleanName,
        type: type === 'income' ? 'income' : 'expense',
      },
    });

    if (existing) {
      res.json({ category: existing });
      return;
    }

    const category = await prisma.category.create({
      data: {
        userId: req.userId!,
        name: cleanName,
        type: type === 'income' ? 'income' : 'expense',
        color: color || '#0066FF',
        icon: icon || 'Tag',
      },
    });

    res.status(201).json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Erro ao criar categoria.' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Categoria não encontrada ou acesso negado.' });
      return;
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: 'Categoria excluída com sucesso.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Erro ao excluir categoria.' });
  }
});

export default router;
