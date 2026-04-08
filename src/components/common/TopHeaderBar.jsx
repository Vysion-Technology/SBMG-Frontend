import React from 'react';

import headerLeft from '../../assets/header/image copy 3.png';
import bharatlogo from '../../assets/header/bharatlogo.png';
import swachhBharatLogo from '../../assets/header/swachh bharat.png';
import swachhrajasthanLogo from '../../assets/logos/swach.png';
import headerRight from '../../assets/header/image copy.png';
import headerBg from '../../../assets/header/header-bg.png';

/**
 * Top Header Bar - Navbar with 2 images displayed horizontally.
 */
const TopHeaderBar = () => {
  return (
    <nav
      className="top-header-bar"
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), url(${headerBg})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '60px 60px',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 32px',
        margin: 0,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 40,
        flexWrap: 'wrap'
      }}
    >
      <figure>
        <img
          src={headerLeft}
          alt="Government of India - Swachhata Hi Seva - Swachh Rajasthan"
          style={{
            maxHeight: 60,
            height: 'auto',
            objectFit: 'contain'
          }}
        />
      </figure>
      <figure style={{
        display: 'flex',
        gap: '10px'
      }}>
        <img
          src={swachhrajasthanLogo}
          alt="Swachh Bharat Mission initiative logos"
          style={{
            maxHeight: 60,
            height: 'auto',
            objectFit: 'contain',
          }}
        />
        <span style={{ borderRight: '2px solid #D1D5DB' }} />

        <img
          src={swachhBharatLogo}
          alt="Swachh Bharat Mission initiative logos"
          style={{
            maxHeight: 60,
            height: 'auto',
            objectFit: 'contain'
          }}
        />
      </figure>
    </nav>
  );
};

export default TopHeaderBar;
