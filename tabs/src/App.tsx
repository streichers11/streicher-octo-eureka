import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  TabList,
  Tab,
} from '@fluentui/react-components';
import {
  DataBarVertical24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  nav: {
    display: 'flex',
    gap: '4px',
  },
  navLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  content: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
});

const App: React.FC = () => {
  const classes = useStyles();
  const [selectedTab, setSelectedTab] = React.useState('dashboard');

  return (
    <BrowserRouter>
      <div className={classes.root}>
        <header className={classes.header}>
          <span className={classes.title}>ORHA Money & Retention Dashboard</span>
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => setSelectedTab(data.value as string)}
          >
            <NavLink to="/" className={classes.navLink}>
              <Tab
                value="dashboard"
                icon={<DataBarVertical24Regular />}
              >
                Dashboard
              </Tab>
            </NavLink>
            <NavLink to="/admin" className={classes.navLink}>
              <Tab
                value="admin"
                icon={<Settings24Regular />}
              >
                Admin
              </Tab>
            </NavLink>
          </TabList>
        </header>
        <main className={classes.content}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
