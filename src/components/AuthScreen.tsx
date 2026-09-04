import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  User as UserIcon, 
  DollarSign, 
  AlertCircle, 
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [income, setIncome] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (tab === 'login') {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Erro ao fazer login.');
      }
    } else {
      if (!name.trim()) {
        setErrorMsg('Por favor, informe seu nome completo.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('A senha deve conter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas digitadas não coincidem.');
        return;
      }

      const incomeNum = parseFloat(income.replace(',', '.')) || 0;
      const res = await register(name, email, password, incomeNum);
      if (!res.success) {
        setErrorMsg(res.message || 'Erro ao criar conta.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090b10] flex items-center justify-center p-4 selection:bg-brand-blue selection:text-white relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#00d284]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Auth Container */}
      <div className="w-full max-w-md bg-[#11141e] border border-[#1d2232] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img 
            src="/planiflow.png" 
            alt="PlaniFlow" 
            className="w-16 h-16 mx-auto object-contain drop-shadow-[0_4px_16px_rgba(0,102,255,0.35)]" 
          />
          <h1 className="text-2xl font-black tracking-tight text-white">
            PlaniFlow
          </h1>
          <p className="text-xs text-slate-500">
            Controle financeiro inteligente, planilhas e investimentos
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#141824] p-1 rounded-2xl border border-[#202638]">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Criar Conta (Cadastro)
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-[#ff4d6a]/10 border border-[#ff4d6a]/30 rounded-xl text-xs text-[#ff4d6a] flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {tab === 'register' && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Nome Completo *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-400 font-semibold mb-1">E-mail *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#151926] border border-[#202638] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Senha *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#151926] border border-[#202638] rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Confirmar Senha *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue transition"
                />
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Renda Mensal Estimada (Opcional)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 5000.00"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-brand-blue transition"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-brand-blue hover:bg-brand-blueHover disabled:opacity-50 text-white rounded-xl font-bold transition shadow-lg shadow-brand-blue/25 flex items-center justify-center gap-2 active:scale-95 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span>Processando...</span>
            ) : (
              <>
                <span>{tab === 'login' ? 'Entrar no PlaniFlow' : 'Concluir Cadastro de Conta'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Cryptography Trust Badge */}
        <div className="pt-3 border-t border-[#1b202e] flex items-center gap-3 bg-[#131722]/50 p-3 rounded-2xl border border-[#202638]">
          <div className="w-8 h-8 rounded-xl bg-[#00d284]/15 border border-[#00d284]/30 flex items-center justify-center shrink-0 text-[#00d284]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <span>Proteção Criptografada AES-256</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d284] animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Seus registros, contas e lançamentos são criptografados com segurança bancária. Privacidade 100% garantida.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
