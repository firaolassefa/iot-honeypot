import React from 'react'

const Card = ({ children, style, ...props }) => {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        backdropFilter: 'blur(10px)',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card