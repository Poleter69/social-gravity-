/**
 * Social Gravity — Project Aurora
 * LoginPage: Premium split-screen authentication experience.
 * Left: animated network visualization + branding
 * Right: frosted-glass login card with Framer Motion animations
 * 
 * Design: Arc Browser × Linear × Apple × Palantir Foundry
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Activity, ArrowRight, ArrowLeft, Loader2, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from './authContext';

// ─── Animated Network Background ─────────────────────────────────────────────

interface NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
  color: string;
}

interface NetworkEdge {
  a: number;
  b: number;
}

const COLORS = ['#4F8CFF', '#22C55E', '#8B5CF6', '#F59E0B', '#4F8CFF'];

function generateNetwork(count: number, w: number, h: number): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  const nodes: NetworkNode[] = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 3 + 2,
    opacity: Math.random() * 0.5 + 0.3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
  const edges: NetworkEdge[] = [];
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) edges.push({ a: i, b: j });
    }
  }
  return { nodes, edges };
}

const AnimatedNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const networkRef = useRef<{ nodes: NetworkNode[]; edges: NetworkEdge[] } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    networkRef.current = generateNetwork(45, W, H);

    const tick = () => {
      if (!networkRef.current) return;
      const { nodes } = networkRef.current;

      ctx.clearRect(0, 0, W, H);

      // Draw edges
      for (const edge of networkRef.current.edges) {
        const a = nodes[edge.a];
        const b = nodes[edge.b];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = Math.max(0, (1 - dist / 120) * 0.15);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(79,140,255,${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Draw nodes
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = node.color + Math.round(node.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 3, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 3);
        grad.addColorStop(0, node.color + '20');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();

        // Move
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > W) node.vx *= -1;
        if (node.y < 0 || node.y > H) node.vy *= -1;
      }

      // Rebuild edges dynamically
      networkRef.current.edges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          if (dx * dx + dy * dy < 14400) {
            networkRef.current.edges.push({ a: i, b: j });
          }
        }
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.6 }}
    />
  );
};

// ─── Floating Stat Pills ──────────────────────────────────────────────────────

const FloatingStat: React.FC<{ label: string; value: string; color: string; delay: number; x: string; y: string }> = ({
  label, value, color, delay, x, y
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    style={{ left: x, top: y }}
    className="absolute px-3 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white"
  >
    <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-0.5">{label}</div>
    <div className="text-[15px] font-semibold" style={{ color }}>{value}</div>
  </motion.div>
);

// ─── Input Field ──────────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  rightElement?: React.ReactNode;
  error?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, type, value, onChange, autoFocus, disabled, rightElement, error }) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const lifted = focused || hasValue;

  return (
    <div className="relative">
      <motion.div
        animate={{
          borderColor: error ? '#EF4444' : focused ? '#4F8CFF' : 'rgba(255,255,255,0.1)',
          boxShadow: focused
            ? error
              ? '0 0 0 3px rgba(239,68,68,0.15)'
              : '0 0 0 3px rgba(79,140,255,0.15)'
            : '0 0 0 0px transparent',
        }}
        transition={{ duration: 0.18 }}
        className="relative rounded-xl border bg-white/5 backdrop-blur-sm overflow-hidden"
      >
        {/* Floating label */}
        <motion.label
          animate={{
            y: lifted ? -9 : 0,
            scale: lifted ? 0.78 : 1,
            color: error ? '#EF4444' : focused ? '#4F8CFF' : 'rgba(255,255,255,0.4)',
          }}
          transition={{ duration: 0.18 }}
          className="absolute left-4 top-4 text-[14px] font-medium origin-left pointer-events-none z-10"
        >
          {label}
        </motion.label>

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
          disabled={disabled}
          className="w-full bg-transparent pt-6 pb-2 px-4 text-white text-[15px] outline-none disabled:opacity-50 font-sans"
          style={{ paddingRight: rightElement ? '44px' : '16px' }}
        />

        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Login Page ───────────────────────────────────────────────────────────────

export interface LoginPageProps {
  onSuccess?: () => void;
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onBackToLanding }) => {
  const { login, continueAsDemo, loginWithOAuth, isCloudAuthAvailable, isAuthenticated } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is already authenticated when landing on login page, forward to dashboard
  useEffect(() => {
    if (isAuthenticated && !isSuccess) {
      onSuccess?.();
    }
  }, [isAuthenticated, isSuccess, onSuccess]);

  // When login completes successfully, let animation play briefly then invoke onSuccess
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onSuccess?.();
      }, 950);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError('Please enter your User ID and password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const result = await login(userId.trim(), password);
    if (result.success) {
      setIsSuccess(true);
    } else {
      setIsSubmitting(false);
      setError(result.error ?? 'Authentication failed.');
    }
  };

  const handleDemoLogin = () => {
    setIsSuccess(true);
    continueAsDemo();
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex select-none antialiased font-sans">

      {/* ── Left Panel: Branding & Animated Network ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #060911 0%, #0a0f1d 50%, #0d1530 100%)',
        }}
      >
        {/* Animated network canvas */}
        <AnimatedNetwork />

        {/* Radial gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 40%, rgba(79,140,255,0.12) 0%, transparent 60%)',
          }}
        />

        {/* Floating stat pills */}
        <FloatingStat label="Active Nodes" value="2,847" color="#4F8CFF" delay={1.2} x="15%" y="25%" />
        <FloatingStat label="Emotion Accuracy" value="98.0%" color="#22C55E" delay={1.5} x="55%" y="40%" />
        <FloatingStat label="Live Sources" value="4 Active" color="#8B5CF6" delay={1.8} x="20%" y="68%" />
        <FloatingStat label="Events/sec" value="315K" color="#F59E0B" delay={2.0} x="58%" y="72%" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#4F8CFF]" />
            </div>
            <span className="text-[16px] font-semibold text-white/90 tracking-tight">Social Gravity</span>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#4F8CFF]/70 mb-3">
              Version 3.0 · Project Aurora
            </div>
            <h1 className="text-[38px] leading-[1.1] font-semibold text-white tracking-[-0.03em] mb-4">
              Decision Intelligence<br />Operating System
            </h1>
            <p className="text-[15px] text-white/40 leading-relaxed max-w-sm">
              Real-time signal intelligence, emotion-aware graph analysis, and predictive narrative modeling.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="mt-8 flex items-center gap-4"
          >
            {['GoEmotions 27-class', 'Live Stream', 'Time-Travel Replay', 'Content Safety'].map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono uppercase tracking-wider text-white/25 border border-white/10 rounded-full px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── Right Panel: Login Card ── */}
      <div
        className="flex flex-1 lg:flex-none lg:w-[480px] items-center justify-center p-8"
        style={{ background: 'var(--bg)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Back to About Project Navigation */}
          {onBackToLanding && (
            <motion.button
              type="button"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 text-[12px] font-mono text-[var(--text-tertiary)] hover:text-[var(--text)] transition-colors mb-4 group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>← Back to About Project</span>
            </motion.button>
          )}

          {/* Card header */}
          <div className="mb-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                <Activity className="w-4 h-4 text-[#4F8CFF]" />
              </div>
              <span className="text-[14px] font-semibold text-[var(--text)] tracking-tight">Social Gravity</span>
            </div>

            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--text)] mb-2">
              Welcome back
            </h2>
            <p className="text-[14px] text-[var(--text-muted)]">
              Sign in to access Mission Control
            </p>
          </div>

          {/* Login form */}
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-[13px]"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* User ID field */}
                <InputField
                  label="User ID"
                  type="text"
                  value={userId}
                  onChange={(v) => { setUserId(v); setError(null); }}
                  autoFocus
                  disabled={isSubmitting}
                  error={Boolean(error)}
                />

                {/* Password field */}
                <InputField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(v) => { setPassword(v); setError(null); }}
                  disabled={isSubmitting}
                  error={Boolean(error)}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                {/* Demo hint */}
                <p className="text-[12px] text-[var(--text-tertiary)] px-1">
                  Demo credentials: <code className="font-mono text-[var(--text-muted)]">admin</code> / <code className="font-mono text-[var(--text-muted)]">socialgravity</code>
                </p>

                {/* Buttons */}
                <div className="space-y-3 pt-2">
                  {/* Sign In button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={!isSubmitting ? { scale: 1.01, y: -1 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                    transition={{ duration: 0.15 }}
                    className="w-full h-12 rounded-xl font-semibold text-[15px] text-white flex items-center justify-center gap-2.5 relative overflow-hidden disabled:opacity-70"
                    style={{
                      background: 'linear-gradient(135deg, #4F8CFF, #3B79F0)',
                      boxShadow: '0 4px 20px rgba(79,140,255,0.3)',
                    }}
                  >
                    {/* Ripple overlay on hover */}
                    <motion.div
                      className="absolute inset-0 bg-white/10 opacity-0"
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.18 }}
                    />

                    <AnimatePresence mode="wait">
                      {isSubmitting ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Authenticating...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          Sign In
                          <ArrowRight className="w-4 h-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Continue as Demo */}
                  <motion.button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.005, borderColor: 'rgba(79,140,255,0.3)' }}
                    whileTap={{ scale: 0.995 }}
                    transition={{ duration: 0.15 }}
                    className="w-full h-11 rounded-xl text-[14px] font-medium text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: 'var(--surface)' }}
                  >
                    <Zap className="w-4 h-4 text-[#F59E0B]" />
                    Continue as Demo (Instant Access)
                  </motion.button>

                  {/* GitHub OAuth Button (Zero-Cost Supabase Auth) */}
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (loginWithOAuth && isCloudAuthAvailable) {
                        loginWithOAuth('github');
                      } else {
                        // If Supabase not yet configured, seamlessly log in as demo analyst
                        handleDemoLogin();
                      }
                    }}
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.005, borderColor: 'rgba(255,255,255,0.2)' }}
                    whileTap={{ scale: 0.995 }}
                    transition={{ duration: 0.15 }}
                    className="w-full h-11 rounded-xl text-[14px] font-medium text-[var(--text)] border border-[var(--border)] hover:border-[var(--text-tertiary)] transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
                    style={{ background: 'var(--surface)' }}
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    Continue with GitHub
                  </motion.button>

                  {/* Zero-Cost Verification Pill */}
                  <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-tertiary)] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                    <span>Zero-Cost Infrastructure · $0/month production</span>
                  </div>
                </div>
              </motion.form>
            ) : (
              // Success state
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 30px rgba(34,197,94,0.4)', '0 0 15px rgba(34,197,94,0.2)'] }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center"
                >
                  <Activity className="w-8 h-8 text-[#22C55E]" />
                </motion.div>
                <div className="text-center">
                  <div className="text-[18px] font-semibold text-[var(--text)] mb-1">Authenticated</div>
                  <div className="text-[13px] text-[var(--text-muted)]">Launching Mission Control...</div>
                </div>
                <motion.div
                  className="w-48 h-0.5 bg-[var(--border)] rounded-full overflow-hidden"
                >
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                    className="h-full bg-gradient-to-r from-[#4F8CFF] to-[#22C55E]"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-[11px] text-[var(--text-tertiary)] font-mono uppercase tracking-wider">
              Social Gravity v3.0 · Project Aurora · Research Platform
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
