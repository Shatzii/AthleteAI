import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { initiateGoogleLogin, initiateGithubLogin, initiateFacebookLogin } from '../utils/api';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose }) => {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await login(formData);
            if (result.success) {
                onClose();
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthLogin = (provider) => {
        switch (provider) {
            case 'google':
                initiateGoogleLogin();
                break;
            case 'github':
                initiateGithubLogin();
                break;
            case 'facebook':
                initiateFacebookLogin();
                break;
            default:
                break;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {/* OAuth Buttons */}
                    <div className="oauth-section">
                        <button
                            className="oauth-btn google-btn"
                            onClick={() => handleOAuthLogin('google')}
                        >
                            <img src="/google-icon.png" alt="Google" className="oauth-icon" />
                            Continue with Google
                        </button>

                        <button
                            className="oauth-btn github-btn"
                            onClick={() => handleOAuthLogin('github')}
                        >
                            <img src="/github-icon.png" alt="GitHub" className="oauth-icon" />
                            Continue with GitHub
                        </button>

                        <button
                            className="oauth-btn facebook-btn"
                            onClick={() => handleOAuthLogin('facebook')}
                        >
                            <img src="/facebook-icon.png" alt="Facebook" className="oauth-icon" />
                            Continue with Facebook
                        </button>
                    </div>

                    <div className="divider">
                        <span>or</span>
                    </div>

                    {/* Traditional Login/Register Form */}
                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username || ''}
                                    onChange={handleInputChange}
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="modal-footer">
                        <p>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                className="switch-mode-btn"
                                onClick={() => setIsLogin(!isLogin)}
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
