
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export type TabKey = 'create' | 'gallery';

interface UseTabNavigationProps {
  defaultTab?: TabKey;
  tabs: TabKey[];
}

export const useTabNavigation = ({ defaultTab = 'create', tabs }: UseTabNavigationProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize from URL if needed
  useEffect(() => {
    const tabFromUrl = new URLSearchParams(location.search).get('tab') as TabKey;
    if (tabFromUrl && tabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [location.search, tabs]);
  
  // Change tab and update URL
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    
    // Update URL without full page reload
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', tab);
    
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    }, { replace: true });
  };
  
  return {
    activeTab,
    setActiveTab: handleTabChange
  };
};
