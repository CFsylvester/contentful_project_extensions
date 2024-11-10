// src/components/CustomProgressBar.js

import React from 'react';
import PropTypes from 'prop-types';

const CustomProgressBar = ({ percent }) => (
  <div style={styles.container}>
    <div style={{ ...styles.filler, width: `${percent}%` }}></div>
  </div>
);

const styles = {
  container: {
    height: '10px',
    width: '100%',
    backgroundColor: '#e0e0de',
    borderRadius: '5px',
    overflow: 'hidden',
    marginTop: '5px'
  },
  filler: {
    height: '100%',
    backgroundColor: '#0072ce',
    transition: 'width 0.2s ease-in'
  }
};

CustomProgressBar.propTypes = {
  percent: PropTypes.number.isRequired
};

export default CustomProgressBar;
