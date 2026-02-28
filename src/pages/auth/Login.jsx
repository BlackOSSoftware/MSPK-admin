import React from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

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
                window.location.href = '/';
            }
        } catch (err) {
            console.error("Login failed or IP fetch error", err);
            // Proceed even if IP fetch fails (optional fallback)
            const result = await dispatch(login(data));
            if (result.meta.requestStatus === 'fulfilled') {
                window.location.href = '/';
            }
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-300">
            {/* Elegant Background - Dynamic Colors */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] pointer-events-none"></div>

            <Card className="w-full max-w-md p-8 relative z-20 border-border bg-card/60 shadow-2xl backdrop-blur-xl">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                        <img
                            src="/logo.jpeg"
                            alt="MSPK TRADE SOLUTIONS"
                            className="w-16 h-16 object-contain rounded-lg shadow-lg"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">MSPK <span className="text-primary">TRADE SOLUTIONS</span></h1>
                    <p className="text-muted-foreground text-sm mt-2 font-medium">Professional Trading Administration</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-5">
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                            <Input
                                placeholder="Email Address"
                                className="pl-10 h-12 bg-background/50"
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

                <div className="mt-8 text-center border-t border-border pt-6">
                    <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-2">
                        <ShieldCheck size={14} className="text-primary" />
                        Secure Encrypted Connection
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
