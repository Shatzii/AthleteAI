import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
    const { handleOAuthLogin } = useAuth();
    const history = useHistory();
    const location = useLocation();

    useEffect(() => {
        const handleCallback = async () => {
            const urlParams = new URLSearchParams(location.search);
            const token = urlParams.get('token');
            const provider = urlParams.get('provider');
            const error = urlParams.get('error');

            if (error) {
                console.error('OAuth error:', error);
                history.push('/?error=oauth_failed');
                return;
            }

            if (token && provider) {
                try {
                    const result = await handleOAuthLogin(token, provider);
                    if (result.success) {
                        history.push('/dashboard');
                    } else {
                        history.push('/?error=login_failed');
                    }
                } catch (error) {
                    console.error('OAuth callback error:', error);
                    history.push('/?error=oauth_callback_failed');
                }
            } else {
                history.push('/?error=missing_token');
            }
        };

        handleCallback();
    }, [location, handleOAuthLogin, history]);

    return (
        <div className="oauth-callback">
            <div className="loading-container">
                <h2>Completing sign in...</h2>
                <div className="spinner"></div>
                <p>Please wait while we finish setting up your account.</p>
            </div>
            <style jsx>{`
                .oauth-callback {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .loading-container {
                    text-align: center;
                    background: white;
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }
                .spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 1rem auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default OAuthCallback;
