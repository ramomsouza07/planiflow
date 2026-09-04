import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { 
  encryptText, 
  decryptUser, 
  getSecurityStatus 
} from '../utils/encryption';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'finflow_secure_jwt_secret_token_2026_isolated';

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

// Security status endpoint to verify encryption health
router.get('/security-status', (_req, res): void => {
  res.json(getSecurityStatus());
});

// Register
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const encryptedName = encryptText(name.trim());

    const user = await prisma.user.create({
      data: {
        name: encryptedName,
        email: cleanEmail,
        password: hashedPassword,
        categories: {
          create: DEFAULT_CATEGORIES.map(cat => ({
            name: cat.name,
            type: cat.type,
            color: cat.color,
            icon: cat.icon,
          })),
        },
        emergencyFund: {
          create: {
            targetMonths: 6,
            currentAmount: 0,
            institution: encryptText('NuConta / Tesouro Selic'),
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      user: decryptUser(user),
      token,
      message: 'Conta criada com sucesso com criptografia ativada!',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erro ao criar conta no banco de dados.' });
  }
});

// Login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      user: decryptUser({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      }),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao autenticar.' });
  }
});

// Get Current User Profile
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    res.json({ user: decryptUser(user) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Erro ao carregar perfil do usuário.' });
  }
});

// Update Profile
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    const dataToUpdate: Record<string, any> = {};
    if (name !== undefined) {
      dataToUpdate.name = encryptText(String(name).trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    res.json({ user: decryptUser(updatedUser) });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil do usuário.' });
  }
});

// Change Password
router.put('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'A senha atual e a nova senha são obrigatórias.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ error: 'A senha atual informada está incorreta.' });
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedNewPassword },
    });

    res.json({ success: true, message: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erro ao alterar a senha do usuário.' });
  }
});

export default router;
