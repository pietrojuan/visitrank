import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

export const autenticar = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ erro: 'Token não fornecido' }); return; }
  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch { res.status(401).json({ erro: 'Token inválido ou expirado' }); }
};

export const apenasAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.perfil !== 'admin') { res.status(403).json({ erro: 'Acesso restrito a administradores' }); return; }
  next();
};

export const apenasAdminOuModerador = (req: Request, res: Response, next: NextFunction): void => {
  if (!['admin', 'moderador'].includes(req.user?.perfil || '')) {
    res.status(403).json({ erro: 'Acesso restrito a administradores e moderadores' }); return;
  }
  next();
};

export const autenticarCliente = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ erro: 'Token não fornecido' }); return; }
  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET!) as Record<string, unknown>;
    if (payload.tipo !== 'cliente') { res.status(403).json({ erro: 'Acesso restrito a clientes' }); return; }
    req.clienteUser = payload as { clienteId: string; imobiliariaId: string; email: string };
    next();
  } catch { res.status(401).json({ erro: 'Token inválido ou expirado' }); }
};
