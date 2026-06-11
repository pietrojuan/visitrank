import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermosPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-brand-950 to-surface-900">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          ← Voltar
        </button>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-slate-300 space-y-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-white mb-1">Termos de Uso</h1>
            <p className="text-xs text-slate-500">Última atualização: junho de 2026</p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">1. Aceitação dos Termos</h2>
            <p className="text-sm leading-relaxed">Ao acessar ou utilizar a plataforma VisitRank — seja por meio de login, criação de conta ou qualquer outra interação — você declara que leu, compreendeu e concorda com estes Termos de Uso e com nossa Política de Privacidade. Caso não concorde com alguma disposição, não utilize a plataforma.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">2. Sobre a Plataforma</h2>
            <p className="text-sm leading-relaxed">O VisitRank é uma plataforma de gestão de visitas e avaliações de imóveis, destinada a imobiliárias, corretores e clientes. Permite o agendamento de visitas, avaliação de imóveis e geração de relatórios de desempenho.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">3. Cadastro e Conta</h2>
            <p className="text-sm leading-relaxed">Para utilizar a plataforma, é necessário fornecer informações verdadeiras, precisas e completas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas com sua conta. Em caso de uso não autorizado, notifique-nos imediatamente.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">4. Uso Permitido</h2>
            <p className="text-sm leading-relaxed">Você concorda em utilizar a plataforma somente para fins lícitos e de acordo com estes Termos. É proibido:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
              <li>Fornecer informações falsas ou enganosas</li>
              <li>Utilizar a plataforma para fins fraudulentos</li>
              <li>Tentar acessar contas ou dados de outros usuários</li>
              <li>Realizar engenharia reversa ou comprometer a segurança do sistema</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">5. Avaliações e Conteúdo</h2>
            <p className="text-sm leading-relaxed">As avaliações publicadas pelos clientes passam por moderação antes de serem exibidas. O VisitRank reserva-se o direito de remover conteúdos que violem estes Termos ou que sejam considerados inapropriados.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">6. Limitação de Responsabilidade</h2>
            <p className="text-sm leading-relaxed">O VisitRank não se responsabiliza por danos diretos ou indiretos decorrentes do uso ou impossibilidade de uso da plataforma, nem pela veracidade das informações fornecidas pelos usuários.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">7. Alterações nos Termos</h2>
            <p className="text-sm leading-relaxed">Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações entram em vigor imediatamente após a publicação na plataforma. O uso continuado após as alterações constitui aceitação dos novos Termos.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">8. Contato</h2>
            <p className="text-sm leading-relaxed">Dúvidas sobre estes Termos podem ser enviadas para: <span className="text-brand-400">contato@visitrank.com.br</span></p>
          </section>
        </div>
      </div>
    </div>
  );
}
