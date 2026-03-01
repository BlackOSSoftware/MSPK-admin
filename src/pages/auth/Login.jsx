import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/authSlice';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

    const loginSideImage =
        "https://images.unsplash.com/photo-1767424412548-1a1ac7f4b9bc?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const onSubmit = async (data) => {
        try {
            // Fetch User IP
            const ipResponse = await axios.get('https://api.ipify.org?format=json');
            const userIp = ipResponse.data.ip;

            // Generate Session ID
            const sessionId = Date.now().toString();

            // Store in LocalStorage (Mock Backend Session)
            localStorage.setItem('user_ip', userIp);
            localStorage.setItem('session_id', sessionId);

            const result = await dispatch(login({ ...data, ip: userIp, sessionId }));
            if (result.meta.requestStatus === 'fulfilled') {
                navigate('/');
            }
        } catch (err) {
            console.error("Login failed or IP fetch error", err);
            // Proceed even if IP fetch fails (optional fallback)
            const result = await dispatch(login(data));
            if (result.meta.requestStatus === 'fulfilled') {
                navigate('/');
            }
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans transition-colors duration-300">
            {/* Background accents */}
            <div className="absolute inset-0 pointer-events-none opacity-60 bg-cyber-grid"></div>
            <div className="absolute top-[-25%] left-[-15%] w-[700px] h-[700px] bg-primary/10 rounded-full blur-[130px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-15%] w-[650px] h-[650px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none"></div>

            <Card
                noPadding
                className="w-full max-w-5xl relative z-20 border-border bg-card/60 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[560px]">
                    {/* Side Image */}
                    <div className="relative h-56 sm:h-72 lg:h-auto">
                        <img
                            src={loginSideImage}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/45 to-black/15"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 mix-blend-overlay"></div>

                        <div className="relative z-10 h-full p-8 sm:p-10 flex flex-col justify-end lg:justify-between">
                            <div className="hidden lg:flex items-center gap-2 self-start rounded-full bg-black/35 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/10 backdrop-blur">
                                <ShieldCheck size={14} className="text-primary" />
                                Secure Admin Console
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-widest text-white/70">MSPK Trade Solutions</p>
                                <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight">
                                    Welcome back
                                </h2>
                                <p className="mt-3 text-sm text-white/70 max-w-md">
                                    Sign in to manage users, signals, brokers, and subscriptions with confidence.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Login Form */}
                    <div className="p-8 sm:p-10 lg:p-12 bg-background/40 lg:border-l border-border/60 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                                <img
                                    src="/logo.jpeg"
                                    alt="MSPK TRADE SOLUTIONS"
                                    className="w-9 h-9 object-contain"
                                />
                            </div>
                            <div className="leading-tight">
                                <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                                    MSPK <span className="text-primary">TRADE SOLUTIONS</span>
                                </h1>
                                <p className="text-xs text-muted-foreground font-medium">Administrator Sign In</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-5">
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                    <Input
                                        placeholder="Email Address"
                                        className="pl-10 h-12 bg-background/50"
                                        autoComplete="email"
                                        {...register("email", { required: "Email is required" })}
                                        error={errors.email?.message}
                                    />
                                </div>

                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        className="pl-10 h-12 bg-background/50"
                                        autoComplete="current-password"
                                        {...register("password", { required: "Password is required" })}
                                        error={errors.password?.message}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center font-medium">
                                    {typeof error === 'string' ? error : (error?.message || 'Invalid credentials provided')}
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full py-3.5 text-base shadow-lg hover:shadow-primary/20 font-bold tracking-wide text-primary-foreground"
                                disabled={loading}
                            >
                                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                            </Button>
                        </form>

                        <div className="mt-8 border-t border-border pt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
                            <ShieldCheck size={14} className="text-primary" />
                            Secure encrypted connection
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Login;
