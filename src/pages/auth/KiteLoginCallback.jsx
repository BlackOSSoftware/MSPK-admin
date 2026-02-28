
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const KiteLoginCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Verifying Kite Login...');
    const processed = useRef(false);

    useEffect(() => {
        const verifyLogin = async () => {
            const requestToken = searchParams.get('request_token');
            const action = searchParams.get('action');
            const type = searchParams.get('status');

            if (processed.current) return; // Prevent double call
            processed.current = true;

            if (!requestToken) {
                setStatus('Login Failed: No Request Token found.');
                return;
            }

            if (type === 'error') {
                setStatus('Login Failed: Provider returned error.');
                return;
            }

            try {
                // Backend verifies and generates session
                // Note: The backend controller expects query params, so we pass them along
                // Use the callback endpoint on backend
                // Correct Route: /v1/market/login/:provider

                // Construct backend URL (assuming proxy or full path)
                const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1';
                const backendUrl = `${apiBase}/market/login/kite?request_token=${requestToken}`;

                // Or if you use an axios instance with base URL:
                // await api.get(`/market/login/kite?request_token=${requestToken}`);

                // Since we don't know exact Axios setup, using direct fetch for safety or assuming generic axios
                await axios.get(backendUrl, { withCredentials: true });

                setStatus('Login Successful!');
                toast.success('Kite Login Successful');

                // Redirect to Market Data or Dashboard
                setTimeout(() => {
                    navigate('/market/data');
                }, 1500);

            } catch (error) {
                console.error('Kite Callback Error', error);
                const msg = error.response?.data?.message || error.message;
                setStatus(`Login Failed: ${msg}`);
                toast.error('Kite Login Failed');
            }
        };

        verifyLogin();
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-2xl font-bold mb-4">Kite Connect</h1>
            <div className="p-4 border border-gray-700 rounded bg-gray-800">
                <p className="text-lg">{status}</p>
                <p className="text-sm text-gray-400 mt-2">Please wait while we complete the authentication...</p>
            </div>
        </div>
    );
};

export default KiteLoginCallback;
