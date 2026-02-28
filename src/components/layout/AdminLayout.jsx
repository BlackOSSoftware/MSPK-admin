import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import Sidebar from './Sidebar';
import Header from './Header';

const AdminLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we are on the Live Market page
    const isMarketPage = location.pathname === '/market/data';

    // Initial check
    const initialSessionId = useRef(localStorage.getItem('session_id'));

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    // Session Enforcement Logic
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'session_id') {
                const currentSession = localStorage.getItem('session_id');
                // If session ID changed in storage, logout
                if (currentSession && currentSession !== initialSessionId.current) {
                    // Alert commented out to avoid annoying popup on refresh if logic is flawed, 
                    // but keeping logic. Use console for now.
                    console.warn('Session changed, logging out.');
                    // alert('Session changed. Logging out.'); 
                    handleLogout();
                }
            }
        };

        const currentId = localStorage.getItem('session_id');
        initialSessionId.current = currentId;

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [dispatch]); // handleLogout is stable mostly, but it depends on dispatch/navigate. 
    // Better to rely on dispatch stability or just omit handleLogout from dep array if infinite loop fears.

    return (
        <div className={`flex h-screen bg-background overflow-hidden font-sans ${isMarketPage ? 'market-scroll-hidden' : ''}`}>
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col overflow-hidden relative w-full z-10">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                {/* TERMINAL MODE: Reduced padding to p-2 normally, p-0 for Market */}
                <main className={`flex-1 overflow-x-hidden overflow-y-auto relative z-10 scroll-smooth ${isMarketPage ? 'p-0' : 'p-2'}`}>
                    <Outlet />
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default AdminLayout;
