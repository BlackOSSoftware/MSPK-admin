
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import client from '../../api/client';

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
                // Exchange request_token for access_token and persist it in DB (backend stores under `kite_access_token` setting).
                // Use the shared axios client so baseURL normalization works even if env has a trailing slash.
                await client.get('/market/login/kite', {
                    params: { request_token: requestToken },
                    withCredentials: true,
                });

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
