export interface JwtPayload {
  userId: string;
  imobiliariaId: string;
  perfil: 'Administrador' | 'Corretor';
  email: string;
}

export interface ClienteJwtPayload {
  clienteId: string;
  imobiliariaId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      clienteUser?: ClienteJwtPayload;
    }
  }
}
