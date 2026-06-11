import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacidadePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-brand-900 bg-fixed">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          ← Voltar
        </button>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-slate-300 space-y-7">
          <div>
            <h1 className="text-2xl font-display font-bold text-white mb-1">Política de Privacidade</h1>
            <p className="text-xs text-slate-500">Última atualização: junho de 2026</p>
          </div>

          {/* Identificação */}
          <section className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Controlador dos Dados</p>
            <p className="text-sm font-semibold text-white">VisitRank Tecnologia Ltda.</p>
            <p className="text-sm text-slate-400">CNPJ: 12.345.678/0001-99</p>
            <p className="text-sm text-slate-400">Encarregado de Dados (DPO): <span className="text-brand-400">dpo@visitrank.com.br</span></p>
            <p className="text-sm text-slate-400">Contato geral: <span className="text-brand-400">privacidade@visitrank.com.br</span></p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">1. Introdução e Base Legal</h2>
            <p className="text-sm leading-relaxed">Esta Política de Privacidade descreve como a <span className="font-medium text-white">VisitRank Tecnologia Ltda.</span> (CNPJ 12.345.678/0001-99) coleta, usa, armazena e compartilha dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD) e demais normas aplicáveis. Ao utilizar nossa plataforma, você reconhece que leu e compreendeu esta Política.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">2. Dados Pessoais Coletados</h2>
            <p className="text-sm leading-relaxed">Coletamos as seguintes categorias de dados:</p>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-200 mb-1">a) Dados de cadastro</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
                  <li>Nome completo</li>
                  <li>Endereço de e-mail</li>
                  <li>Número de telefone (opcional)</li>
                  <li>Senha (armazenada em formato hash bcrypt — nunca em texto plano)</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200 mb-1">b) Dados de uso e transação</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
                  <li>Visitas agendadas e realizadas</li>
                  <li>Avaliações e comentários sobre imóveis</li>
                  <li>Histórico de interações com a plataforma</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200 mb-1">c) Dados técnicos e de consentimento</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
                  <li>Endereço IP no momento do cadastro (para registro do consentimento)</li>
                  <li>Data e hora do aceite dos Termos de Uso e desta Política</li>
                  <li>Tipo de dispositivo e navegador (via headers HTTP)</li>
                </ul>
              </div>
            </div>
            <p className="text-sm leading-relaxed mt-1 text-slate-400"><span className="font-medium text-white">Proteção de menores:</span> não coletamos dados de menores de 18 anos. Se identificarmos que um cadastro pertence a menor de idade, a conta será encerrada e todos os dados excluídos imediatamente.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">3. Finalidades e Bases Legais do Tratamento</h2>
            <div className="space-y-3 text-sm">
              <div className="bg-white/3 rounded-lg p-3 border border-white/8">
                <p className="font-medium text-slate-200">Cadastro e autenticação</p>
                <p className="text-slate-400 mt-0.5">Base legal: <span className="text-brand-300">Execução de contrato (art. 7°, V)</span> + <span className="text-brand-300">Consentimento (art. 7°, I)</span></p>
              </div>
              <div className="bg-white/3 rounded-lg p-3 border border-white/8">
                <p className="font-medium text-slate-200">Agendamento e gestão de visitas</p>
                <p className="text-slate-400 mt-0.5">Base legal: <span className="text-brand-300">Execução de contrato (art. 7°, V)</span></p>
              </div>
              <div className="bg-white/3 rounded-lg p-3 border border-white/8">
                <p className="font-medium text-slate-200">Coleta e exibição de avaliações</p>
                <p className="text-slate-400 mt-0.5">Base legal: <span className="text-brand-300">Consentimento (art. 7°, I)</span></p>
              </div>
              <div className="bg-white/3 rounded-lg p-3 border border-white/8">
                <p className="font-medium text-slate-200">Geração de relatórios e rankings</p>
                <p className="text-slate-400 mt-0.5">Base legal: <span className="text-brand-300">Legítimo interesse (art. 7°, IX)</span> — dados são apresentados de forma agregada para corretores e admins</p>
              </div>
              <div className="bg-white/3 rounded-lg p-3 border border-white/8">
                <p className="font-medium text-slate-200">Prevenção de fraudes e segurança</p>
                <p className="text-slate-400 mt-0.5">Base legal: <span className="text-brand-300">Legítimo interesse (art. 7°, IX)</span></p>
              </div>
              <div className="bg-white/3 rounded-lg p-3 border border-white/8">
                <p className="font-medium text-slate-200">Cumprimento de ordens judiciais ou regulatórias</p>
                <p className="text-slate-400 mt-0.5">Base legal: <span className="text-brand-300">Cumprimento de obrigação legal (art. 7°, II)</span></p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">4. Compartilhamento de Dados</h2>
            <p className="text-sm leading-relaxed">Não vendemos nem alugamos seus dados pessoais. Podemos compartilhá-los apenas:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
              <li>Com a imobiliária à qual você está vinculado, para fins de gestão de visitas e avaliações</li>
              <li>Com prestadores de serviço de infraestrutura (hospedagem, banco de dados) sob acordos de confidencialidade</li>
              <li>Com autoridades legais, mediante ordem judicial ou exigência regulatória</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">5. Armazenamento, Segurança e Retenção</h2>
            <p className="text-sm leading-relaxed">Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
              <li>Criptografia de senhas com bcrypt (salt rounds = 10)</li>
              <li>Autenticação via JWT com expiração de token</li>
              <li>Comunicação via HTTPS/TLS</li>
              <li>Acesso restrito por perfil de usuário</li>
            </ul>
            <p className="text-sm leading-relaxed mt-2"><span className="font-medium text-white">Períodos de retenção:</span></p>
            <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
              <li><span className="text-slate-300">Dados de conta ativa:</span> mantidos pelo período de uso da plataforma</li>
              <li><span className="text-slate-300">Após solicitação de exclusão:</span> removidos em até 30 dias corridos</li>
              <li><span className="text-slate-300">Registros de consentimento (IP + data):</span> mantidos por 5 anos para fins de comprovação legal</li>
              <li><span className="text-slate-300">Dados de visitas e avaliações:</span> mantidos por 2 anos após encerramento, para fins de auditoria</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">6. Seus Direitos como Titular (LGPD — arts. 17–22)</h2>
            <p className="text-sm leading-relaxed">Você tem os seguintes direitos em relação aos seus dados pessoais:</p>
            <ul className="text-sm space-y-1.5 list-disc list-inside text-slate-400">
              <li><span className="text-slate-200">Confirmação e acesso:</span> saber se tratamos seus dados e obter cópia deles</li>
              <li><span className="text-slate-200">Correção:</span> atualizar dados incompletos, inexatos ou desatualizados</li>
              <li><span className="text-slate-200">Anonimização ou exclusão:</span> solicitar remoção de dados desnecessários ou tratados em desconformidade</li>
              <li><span className="text-slate-200">Portabilidade:</span> receber seus dados em formato estruturado para uso em outro serviço</li>
              <li><span className="text-slate-200">Revogação do consentimento:</span> retirar seu consentimento a qualquer momento (sem efeito retroativo)</li>
              <li><span className="text-slate-200">Oposição:</span> opor-se ao tratamento em casos de dispensa de consentimento</li>
              <li><span className="text-slate-200">Informação:</span> ser informado sobre compartilhamentos realizados</li>
              <li><span className="text-slate-200">Petição à ANPD:</span> apresentar reclamação à Autoridade Nacional de Proteção de Dados</li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">Para exercer esses direitos, envie sua solicitação ao DPO: <span className="text-brand-400">dpo@visitrank.com.br</span>. Responderemos em até <span className="font-medium text-white">15 dias úteis</span>.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">7. Exclusão de Conta e Dados</h2>
            <p className="text-sm leading-relaxed">Para solicitar a exclusão da sua conta e de todos os dados pessoais associados, envie um e-mail para <span className="text-brand-400">privacidade@visitrank.com.br</span> com o assunto "Exclusão de Dados" e seu e-mail cadastrado. Processaremos sua solicitação em até 30 dias. Registros de consentimento e dados exigidos por lei serão mantidos pelos prazos legais pertinentes, conforme indicado na seção 5.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">8. Cookies e Armazenamento Local</h2>
            <p className="text-sm leading-relaxed">Utilizamos <span className="font-medium text-white">localStorage</span> do navegador para manter sua sessão ativa por meio de tokens JWT. Não utilizamos cookies de rastreamento, publicidade ou analytics de terceiros.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">9. Transferência Internacional de Dados</h2>
            <p className="text-sm leading-relaxed">Seus dados são armazenados em servidores localizados no Brasil ou em países que ofereçam grau de proteção equivalente ao da LGPD, nos termos do art. 33 da lei.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">10. Alterações nesta Política</h2>
            <p className="text-sm leading-relaxed">Esta Política pode ser atualizada periodicamente. Alterações substanciais serão comunicadas com antecedência mínima de 15 dias via e-mail ou aviso na plataforma. O uso continuado após as alterações implica aceite da nova versão.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">11. Contato e Encarregado de Dados</h2>
            <p className="text-sm leading-relaxed">
              <span className="block font-medium text-white">VisitRank Tecnologia Ltda.</span>
              <span className="block text-slate-400">CNPJ: 12.345.678/0001-99</span>
              <span className="block mt-2">Encarregado (DPO): <span className="text-brand-400">dpo@visitrank.com.br</span></span>
              <span className="block">Privacidade e exclusão: <span className="text-brand-400">privacidade@visitrank.com.br</span></span>
              <span className="block">Contato geral: <span className="text-brand-400">contato@visitrank.com.br</span></span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
