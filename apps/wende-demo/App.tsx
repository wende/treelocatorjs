import React, { useState } from 'react';
import { TreeLocatorDemo } from './components/TreeLocatorDemo';
import { ExploreMoreDemo } from './components/ExploreMoreDemo';

function App() {
  const [view, setView] = useState<'intro' | 'explore'>('intro');

  if (view === 'explore') {
    return <ExploreMoreDemo onBack={() => setView('intro')} />;
  }

  return <TreeLocatorDemo onExploreMore={() => setView('explore')} />;
}

export default App;
