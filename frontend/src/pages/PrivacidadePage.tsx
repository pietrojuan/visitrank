import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacidadePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-brand-950 to-surface-900">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          ← Voltar
        </button>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-slate-300 space-y-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-white mb-1">Política de Privacidade</h1>
            <p className="text-xs text-slate-500">Última atualização: junho de 2026</p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">1. Informações que Coletamos</h2>
            <p className="text-sm leading-relaxed">Coletamos as seguintes informações ao utilizar o VisitRank:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
              <li><strong className="text-slate-300">Dados de cadastro:</strong> nome, e-mail, telefone</li>
              <li><strong className="text-slate-300">Dados de uso:</strong> visitas agendadas, avaliações realizadas</li>
              <li><strong className="text-slate-300">Dados técnicos:</strong> tipo de dispositivo, navegador, endereço IP</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">2. Como Utilizamos seus Dados</h2>
            <p className="text-sm leading-relaxed">Suas informações são utilizadas para:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
              <li>Fornecer e melhorar os serviços da plataforma</li>
              <li>Gerenciar sua conta e autenticar acessos</li>
              <li>Processar agendamentos e avaliações</li>
              <li>Enviar comunicações relacionadas ao serviço</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">3. Compartilhamento de Dados</h2>
            <p className="text-sm leading-relaxed">Não vendemos seus dados pessoais. Podemos compartilhá-los apenas com:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
              <li>A imobiliária à qual você está vinculado, para fins de gestão de visitas</li>
              <li>Prestadores de serviço necessários para operação da plataforma</li>
              <li>Autoridades legais, quando exigido por lei</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">4. Armazenamento e Segurança</h2>
            <p className="text-sm leading-relaxed">Seus dados são armazenados com medidas de segurança adequadas, incluindo criptografia de senhas e autenticação via token JWT. Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para prestação dos serviços.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">5. Seus Direitos (LGPD)</h2>
            <p className="text-sm leading-relaxed">Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-slate-400">
              <li>Confirmar a existência de tratamento de seus dados</li>
              <li>Acessar, corrigir ou atualizar seus dados</li>
              <li>Solicitar a exclusão de seus dados pessoais</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Solicitar a portabilidade dos dados</li>
            </ul>
            <p className="text-sm leading-relaxed">Para exercer esses direitos, entre em contato: <span className="text-brand-400">privacidade@visitrank.com.br</span></p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">6. Cookies</h2>
            <p className="text-sm leading-relaxed">Utilizamos armazenamento local (localStorage) para manter sua sessão ativa. Não utilizamos cookies de rastreamento ou publicidade.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">7. Alterações nesta Política</h2>
            <p className="text-sm leading-relaxed">Esta Política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas. O uso continuado da plataforma após as alterações implica aceitação da nova Política.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-display font-semibold text-white">8. Contato</h2>
            <p className="text-sm leading-relaxed">Para questões sobre privacidade: <span className="text-brand-400">privacidade@visitrank.com.br</span></p>
          </section>
        </div>
      </div>
    </div>
  );
}
