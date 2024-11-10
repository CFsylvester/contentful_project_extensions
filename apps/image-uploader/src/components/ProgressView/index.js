// src/components/ProgressView.js

import React from 'react';
import PropTypes from 'prop-types';
import {  Typography } from '@contentful/forma-36-react-components';
import CustomProgressBar from '../CustomProgressBar';

const ProgressView = ({ uploadProgresses }) => {
  console.log('ProgressView Rendered');
  
  return (
    <div style={{ padding: '20px' }}>
      {uploadProgresses.map(({ fileName, percent }) => (
        <div key={fileName} style={{ marginBottom: '20px' }}>
          <Typography variant="small">{fileName}</Typography>
          <CustomProgressBar value={percent} />
        </div>
      ))}
    </div>
  );
};

ProgressView.propTypes = {
  uploadProgresses: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string.isRequired,
      percent: PropTypes.number.isRequired
    })
  ).isRequired
};

export default ProgressView;
