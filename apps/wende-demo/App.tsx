import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Experience } from './components/Experience';
import { Skills } from './components/Skills';
import { Portfolio } from './components/Portfolio';
import { Contact } from './components/Contact';

function App() {
  return (
    <div className="min-h-screen bg-off-white selection:bg-black selection:text-white">
      <Header />
      <main>
        <Hero />
        <Skills />
        <Experience />
        <Portfolio />
        <Contact />
      </main>
    </div>
  );
}

export default App;
