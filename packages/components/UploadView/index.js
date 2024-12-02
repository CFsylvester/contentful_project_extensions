// src/components/UploadView.js

import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@contentful/forma-36-react-components';

const UploadView = ({
  isDraggingOver,
  onDrop,
  onDragOverStart,
  onDragOverEnd,
  remainingSlots
}) => {
  console.log('UploadView Rendered');

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag Enter');
    onDragOverStart(e);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag Leave');
    onDragOverEnd(e);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag Over');
    onDragOverStart(e);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop Event');
    onDrop(e);
    onDragOverEnd(e);
  };

  const handleFileChange = (e) => {
    console.log('File Input Change');
    onDrop(e);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`upload-view ${isDraggingOver ? 'dragging' : ''}`}
      style={{
        border: '2px dashed #ccc',
        padding: '40px', // Increased padding for better visibility
        textAlign: 'center',
        borderRadius: '10px', // Increased border radius
        backgroundColor: isDraggingOver ? '#f0f0f0' : '#fff',
        cursor: 'pointer',
        position: 'relative',
        marginBottom: '20px',
        width: '100%',
        minHeight: '200px'
      }}
    >
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="file-upload"
        disabled={remainingSlots === 0}
      />
      <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
        <Typography variant="h6">
          Drag and drop images here, or click to select files
        </Typography>
      </label>
      {remainingSlots === 0 && (
        <Typography variant="small" color="negative" marginTop="spacingS">
          Maximum number of assets reached.
        </Typography>
      )}
    </div>
  );
};

UploadView.propTypes = {
  isDraggingOver: PropTypes.bool.isRequired,
  onDrop: PropTypes.func.isRequired,
  onDragOverStart: PropTypes.func.isRequired,
  onDragOverEnd: PropTypes.func.isRequired,
  remainingSlots: PropTypes.number.isRequired
};

export default UploadView;
