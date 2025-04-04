import React from 'react';
import '../styles/AnimatedBackground.css';

const AnimatedBackground = ({ children }) => {
  return (
    <div className="app-container">
      <div className="bubbles">
        {Array.from({ length: 40 }).map((_, i) => (
          <span 
            key={i} 
            style={{ '--i': Math.floor(Math.random() * 30) + 10 }}
          />
        ))}
      </div>
      {children}
    </div>
  );
};

export default AnimatedBackground;