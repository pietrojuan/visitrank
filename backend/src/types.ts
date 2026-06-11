export interface JwtPayload {
  userId: string;
  imobiliariaId: string;
  perfil: string;
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
