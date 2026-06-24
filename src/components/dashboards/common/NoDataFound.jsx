import React from 'react';
import nodataImage from '../../../assets/images/nodata.png';
import { useTranslation } from 'react-i18next';

/**
 * NoDataFound Component
 * 
 * A reusable component to display when no data is available or an error occurs.
 * Shows the nodata.png asset with "No data was found" text.
 * 
 * @param {Object} props
 * @param {string} props.message - Optional custom message (defaults to "No data was found")
 * @param {string} props.size - Size variant: 'small', 'medium', or 'large' (defaults to 'medium')
 * @param {Object} props.style - Additional inline styles
 */

const NoDataFound = ({ message, size = "medium", style = {} }) => {
  const { t } = useTranslation('cscCleaning');

  const displayMessage = message || t('csc:noDataFound');

  const sizes = {
    small: {
      imageWidth: '190px',
      fontSize: '14px',
      padding: '20px'
    },
    medium: {
      imageWidth: '260px',
      fontSize: '16px',
      padding: '40px'
    },
    large: {
      imageWidth: '320px',
      fontSize: '18px',
      padding: '60px'
    }
  };

  const sizeConfig = sizes[size] || sizes.medium;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: sizeConfig.padding,
      textAlign: 'center',
      width: '100%',
      ...style
    }}>
      <img
        src={nodataImage}
        alt="No data found"
        style={{
          width: sizeConfig.imageWidth,
          height: 'auto',
          marginBottom: '16px',
          opacity: 0.9
        }}
      />
      <p style={{
        color: '#6b7280',
        fontSize: sizeConfig.fontSize,
        fontWeight: '500',
        margin: 0
      }}>
        {displayMessage}
      </p>
    </div>
  );
};

export default NoDataFound;

