import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
// import './output.css'; // Removed conflicting Tailwind output
import './styles.css'; // Use our custom state-of-the-art styles
import performanceMonitor from './utils/performanceMonitor';

// Lazy load components for better performance
const StarPath = lazy(() => import('./components/StarPath'));
const AIFootballCoach = lazy(() => import('./components/AIFootballCoach'));
const NCAA = lazy(() => import('./components/NCAA'));
const Players = lazy(() => import('./components/Players'));
const Rankings = lazy(() => import('./components/Rankings'));
const InternationalSports = lazy(() => import('./components/InternationalSports'));
const RecruitingHub = lazy(() => import('./components/RecruitingHub'));
const Admin = lazy(() => import('./components/Admin'));

// Loading component
const LoadingSpinner = () => (
    <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading...</p>
    </div>
);

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('[Service Worker] Registered:', registration);
            })
            .catch((error) => {
                console.error('[Service Worker] Registration failed:', error);
            });
    });
}

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="app">
                    <Header />
                    <main>
                        <Suspense fallback={<LoadingSpinner />}>
                            <Switch>
                                <Route path="/" exact component={StarPath} />
                                <Route path="/starpath" component={StarPath} />
                                <Route path="/ai-football-coach" component={AIFootballCoach} />
                                <Route path="/ncaa-tracker" component={NCAA} />
                                <Route path="/players" component={Players} />
                                <Route path="/rankings" component={Rankings} />
                                <Route path="/international-sports" component={InternationalSports} />
                                <Route path="/recruiting-hub" component={RecruitingHub} />
                                <Route path="/admin" component={Admin} />
                                {/* Add more routes as needed */}
                            </Switch>
                        </Suspense>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));
