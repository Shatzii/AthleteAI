import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AIFootballCoach from './components/AIFootballCoach';
import NCAA from './components/NCAA';
import Players from './components/Players';
import Admin from './components/Admin';
import InternationalSports from './components/InternationalSports';
import MarketingDashboard from './components/MarketingDashboard';
import StarPath from './components/StarPath';
import RecruitingHub from './components/RecruitingHub';
import './styles.css';

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="app">
                    <Header />
                    <main>
                        <Switch>
                            <Route path="/" exact component={Dashboard} />
                            <Route path="/ai-football-coach" component={AIFootballCoach} />
                            <Route path="/ncaa-tracker" component={NCAA} />
                            <Route path="/players" component={Players} />
                            <Route path="/admin" component={Admin} />
                            <Route path="/admin/marketing" component={MarketingDashboard} />
                            <Route path="/international-sports" component={InternationalSports} />
                            <Route path="/starpath" component={StarPath} />
                            <Route path="/recruiting-hub" component={RecruitingHub} />
                            {/* Add more routes as needed */}
                        </Switch>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));