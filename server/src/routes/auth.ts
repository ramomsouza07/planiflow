import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { 
  encryptText, 
  encryptEmail,
  decryptText,
  decryptUser, 
  getSecurityStatus,
  getCandidateSecrets,
  encryptDeterministic,
} from '../utils/encryption';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'planiflow_super_seguro_jwt_2026_isolated';

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
    const candidateEmails = getCandidateSecrets().map((s: string) => encryptDeterministic(cleanEmail, s));

    // Check by encrypted email across all candidate secrets or plaintext legacy
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...candidateEmails.map((e: string) => ({ email: e })),
          { email: cleanEmail },
        ],
      },
    });

    if (existingUser) {
      res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const encryptedName = encryptText(name.trim());
    const encEmail = encryptEmail(cleanEmail);

    const user = await prisma.user.create({
      data: {
        name: encryptedName,
        email: encEmail,
        password: hashedPassword,
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
      { userId: user.id, email: decryptText(user.email) },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      user: decryptUser(user),
      token,
      message: 'Conta criada com sucesso com criptografia ativada!',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Erro ao criar conta no banco de dados.',
      details: error?.message || 'Erro desconhecido',
    });
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
    const candidateEmails = getCandidateSecrets().map((s: string) => encryptDeterministic(cleanEmail, s));

    // Look for user by any deterministic encrypted email candidate or plaintext
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          ...candidateEmails.map((e: string) => ({ email: e })),
          { email: cleanEmail },
        ],
      },
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

    // Auto-migrate: ensure user email and name are securely encrypted with primary secret
    const primaryEncEmail = encryptEmail(cleanEmail);
    const cleanName = decryptText(user.name);
    if (user.email !== primaryEncEmail || user.name.startsWith('enc:v1:') && decryptText(user.name) !== user.name) {
      try {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            email: primaryEncEmail,
            name: encryptText(cleanName),
          },
        });
      } catch (upgradeErr) {
        console.warn('Silent user upgrade skipped:', upgradeErr);
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: cleanEmail },
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
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Erro ao autenticar.',
      details: error?.message || 'Erro desconhecido',
    });
  }
});

// Get Current User Profile
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let user = await prisma.user.findUnique({
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

    // Auto-heal if database has older encryption or plaintext email
    const decryptedEmail = decryptText(user.email);
    const decryptedName = decryptText(user.name);
    const primaryEncEmail = encryptEmail(decryptedEmail);

    if (decryptedEmail && user.email !== primaryEncEmail) {
      try {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            email: primaryEncEmail,
            name: encryptText(decryptedName),
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        });
      } catch {
        // Migration can continue silently
      }
    }

    res.json({ user: decryptUser(user) });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Erro ao carregar perfil do usuário.',
      details: error?.message || 'Erro desconhecido',
    });
  }
});

// Update Profile
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;

    const dataToUpdate: Record<string, any> = {};
    if (name !== undefined && String(name).trim()) {
      const cleanName = decryptText(String(name).trim());
      dataToUpdate.name = encryptText(cleanName);
    }

    if (email !== undefined && String(email).trim()) {
      const cleanEmail = decryptText(String(email).trim().toLowerCase());
      const candidateEmails = getCandidateSecrets().map((s: string) => encryptDeterministic(cleanEmail, s));

      const existing = await prisma.user.findFirst({
        where: {
          id: { not: req.userId },
          OR: [
            ...candidateEmails.map((e: string) => ({ email: e })),
            { email: cleanEmail },
          ],
        },
      });

      if (existing) {
        res.status(400).json({ error: 'Este e-mail já está sendo utilizado por outra conta.' });
        return;
      }

      dataToUpdate.email = encryptEmail(cleanEmail);
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
