import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermosPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-brand-900 bg-fixed">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          ← Voltar
        </button>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-slate-300 space-y-7">
          <div>
            <h1 className="text-2xl font-display font-bold text-white mb-1">Termos de Uso</h1>
            <p className="text-xs text-slate-500">Última atualização: junho de 2026</p>
          </div>

          {/* Identificação */}
          <section className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Controlador dos Dados</p>
            <p className="text-sm font-semibold text-white">VisitRank Tecnologia Ltda.</p>
            <p className="text-sm text-slate-400">CNPJ: 12.345.678/0001-99</p>
            <p className="text-sm text-slate-400">Encarregado de Dados (DPO): <span className="text-brand-400">dpo@visitrank.com.br</span></p>
            <p className="text-sm text-slate-400">Contato geral: <span className="text-brand-400">contato@visitrank.com.br</span></p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">1. Aceitação dos Termos</h2>
            <p className="text-sm leading-relaxed">Ao acessar ou utilizar a plataforma VisitRank — seja por login, criação de conta ou qualquer interação — você declara que leu, compreendeu e concorda com estes Termos de Uso e com a Política de Privacidade. Para clientes, a aceitação é feita mediante marcação de checkbox no ato do cadastro, constituindo consentimento livre, informado e inequívoco nos termos do art. 8° da LGPD. Caso não concorde, não utilize a plataforma.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">2. Sobre a Plataforma</h2>
            <p className="text-sm leading-relaxed">O VisitRank é uma plataforma SaaS de gestão de visitas e avaliações de imóveis, destinada a imobiliárias, corretores e clientes. Permite o agendamento de visitas, avaliação de imóveis, moderação de conteúdo e geração de relatórios de desempenho.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">3. Cadastro, Conta e Acesso</h2>
            <p className="text-sm leading-relaxed">Para utilizar a plataforma, é necessário fornecer informações verdadeiras, precisas e completas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas com sua conta. Em caso de uso não autorizado, notifique-nos imediatamente via <span className="text-brand-400">contato@visitrank.com.br</span>.</p>
            <p className="text-sm leading-relaxed mt-1"><span className="font-medium text-white">Restrição de idade:</span> a plataforma é destinada exclusivamente a maiores de 18 anos. Ao criar uma conta, você declara ter pelo menos 18 anos. Contas de menores de idade identificadas serão encerradas e os dados excluídos.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">4. Uso Permitido</h2>
            <p className="text-sm leading-relaxed">Você concorda em utilizar a plataforma somente para fins lícitos. É proibido:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
              <li>Fornecer informações falsas ou enganosas</li>
              <li>Utilizar a plataforma para fins fraudulentos ou concorrência desleal</li>
              <li>Tentar acessar contas ou dados de outros usuários</li>
              <li>Realizar engenharia reversa, scraping ou comprometer a segurança do sistema</li>
              <li>Publicar conteúdos ofensivos, difamatórios ou que violem direitos de terceiros</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">5. Avaliações e Moderação de Conteúdo</h2>
            <p className="text-sm leading-relaxed">As avaliações publicadas por clientes passam por moderação antes de serem exibidas publicamente. O VisitRank reserva-se o direito de remover conteúdos que violem estes Termos ou que sejam considerados inapropriados, sem necessidade de aviso prévio.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">6. Tratamento de Dados Pessoais (LGPD)</h2>
            <p className="text-sm leading-relaxed">O tratamento de dados pessoais pela VisitRank Tecnologia Ltda. observa a Lei nº 13.709/2018 (LGPD). As bases legais utilizadas são:</p>
            <ul className="text-sm space-y-1.5 list-disc list-inside text-slate-400">
              <li><span className="text-slate-300 font-medium">Consentimento (art. 7°, I):</span> para cadastro de clientes, envio de comunicações e coleta de avaliações</li>
              <li><span className="text-slate-300 font-medium">Execução de contrato (art. 7°, V):</span> para gerenciamento de visitas e prestação do serviço contratado</li>
              <li><span className="text-slate-300 font-medium">Legítimo interesse (art. 7°, IX):</span> para prevenção de fraudes, segurança e melhoria da plataforma</li>
              <li><span className="text-slate-300 font-medium">Cumprimento de obrigação legal (art. 7°, II):</span> quando exigido por autoridades competentes</li>
            </ul>
            <p className="text-sm leading-relaxed mt-1"><span className="font-medium text-white">Retenção:</span> dados de conta são mantidos enquanto a conta estiver ativa. Após solicitação de exclusão ou encerramento, os dados são removidos em até 30 dias, salvo obrigação legal de retenção.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">7. Seus Direitos como Titular</h2>
            <p className="text-sm leading-relaxed">Nos termos dos arts. 17 a 22 da LGPD, você tem direito a:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
              <li>Confirmar a existência de tratamento de seus dados</li>
              <li>Acessar, corrigir ou atualizar seus dados pessoais</li>
              <li>Solicitar a anonimização, bloqueio ou exclusão de dados desnecessários</li>
              <li>Solicitar a portabilidade dos dados a outro fornecedor de serviço</li>
              <li>Revogar o consentimento a qualquer momento, sem prejuízo da legalidade do tratamento anterior</li>
              <li>Opor-se a tratamento realizado com fundamento em uma das hipóteses de dispensa do consentimento</li>
            </ul>
            <p className="text-sm leading-relaxed mt-1">Para exercer esses direitos, entre em contato com nosso DPO: <span className="text-brand-400">dpo@visitrank.com.br</span>. Responderemos em até 15 dias úteis.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">8. Limitação de Responsabilidade</h2>
            <p className="text-sm leading-relaxed">O VisitRank não se responsabiliza por danos diretos ou indiretos decorrentes do uso ou impossibilidade de uso da plataforma, nem pela veracidade das informações fornecidas por usuários. A plataforma é fornecida "no estado em que se encontra", sem garantias de disponibilidade ininterrupta.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">9. Alterações nos Termos</h2>
            <p className="text-sm leading-relaxed">Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações substanciais serão comunicadas por e-mail ou aviso na plataforma com antecedência mínima de 15 dias. O uso continuado após as alterações constitui aceitação dos novos Termos.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">10. Foro e Legislação Aplicável</h2>
            <p className="text-sm leading-relaxed">Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de São Paulo/SP para dirimir eventuais controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">11. Contato</h2>
            <p className="text-sm leading-relaxed">
              <span className="block">Dúvidas sobre estes Termos: <span className="text-brand-400">contato@visitrank.com.br</span></span>
              <span className="block">Encarregado de Dados (DPO): <span className="text-brand-400">dpo@visitrank.com.br</span></span>
              <span className="block text-slate-500 text-xs mt-1">VisitRank Tecnologia Ltda. — CNPJ 12.345.678/0001-99</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
