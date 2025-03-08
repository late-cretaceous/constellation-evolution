import React, { useState } from 'react';

/**
 * A collapsible help panel with information about the simulation
 */
const HelpPanel = () => {
  const [showHelp, setShowHelp] = useState(false);
  
  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };
  
  return (
    <div>
      <button 
        onClick={toggleHelp}
        className="help-toggle"
      >
        {showHelp ? 'Hide Help' : 'Show Help'}
      </button>
      
      {showHelp && (
        <div className="help-content">
          <p><strong>Green dots</strong> are moving joints.</p>
          <p><strong>Red dots</strong> are anchored joints.</p>
          <p><strong>Yellow dots</strong> are food.</p>
          <p>The number above each organism is its fitness score.</p>
          <p>The blue text shows how many joints each organism has.</p>
          <p>Organisms need at least one anchored joint to move effectively.</p>
          <p>Organisms with higher fitness are more likely to reproduce in the next generation.</p>
        </div>
      )}
    </div>
  );
};

export default HelpPanel;
