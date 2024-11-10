// src/components/FileView.js

import React from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button, Typography } from '@contentful/forma-36-react-components';

const FileView = ({
  assets,
  isPublished,
  onDragEnd,
  onClickEdit,
  onClickRemove,
  remainingSlots,
  onDropFiles,
  isDraggingOver,
  onDragOverStart,
  onDragOverEnd
}) => {
  console.log('FileView Rendered');

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOverStart(e);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOverEnd(e);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOverStart(e);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDropFiles(e);
    onDragOverEnd(e);
  };

  const handleFileChange = (e) => {
    onDropFiles(e);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="assets-droppable" direction="horizontal">
        {(provided) => (
          <div
            className="file-view"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '20px',
              justifyContent: 'flex-start',
              padding: '20px',
              position: 'relative'
            }}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {assets.map((asset, index) => (
              <Draggable key={asset.sys.id} draggableId={asset.sys.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      position: 'relative',
                      width: '150px',
                      height: '150px',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                      ...provided.draggableProps.style
                    }}
                  >
                    <div style={{ width: '100%', height: '100px', overflow: 'hidden' }}>
                      <img
                        src={`https:${asset.fields.file['en-US'].url}`}
                        alt={asset.fields.title['en-US'] || asset.fields.file['en-US'].fileName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ padding: '8px' }}>
                      <Typography variant="small">
                        {asset.fields.title['en-US'] || asset.fields.file['en-US'].fileName}
                      </Typography>
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '5px',
                        left: '5px',
                        right: '5px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        padding: '5px',
                        borderRadius: '4px'
                      }}
                    >
                      <Button
                        onClick={() => onClickEdit(asset.sys.id)}
                        variant="secondary"
                        size="small"
                        style={{
                          padding: '4px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => onClickRemove(asset.sys.id)}
                        variant="negative"
                        size="small"
                        style={{
                          padding: '4px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: isPublished ? '#28a745' : '#ffc107',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {isPublished ? 'Published' : 'Unpublished'}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}

            {/* Drag-and-Drop Placeholder */}
            {remainingSlots > 0 && (
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`upload-placeholder ${isDraggingOver ? 'dragging' : ''}`}
                style={{
                  width: '150px',
                  height: '150px',
                  border: '2px dashed #ccc',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDraggingOver ? '#f0f0f0' : '#fafafa',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload-placeholder"
                  disabled={remainingSlots === 0}
                />
                <label htmlFor="file-upload-placeholder" style={{ cursor: 'pointer' }}>
                  <Typography variant="small" color="muted">
                    Drag & Drop or Click to Add
                  </Typography>
                </label>
              </div>
            )}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

FileView.propTypes = {
  assets: PropTypes.arrayOf(
    PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired
      }).isRequired,
      fields: PropTypes.shape({
        file: PropTypes.object.isRequired
      }).isRequired
    })
  ).isRequired,
  isPublished: PropTypes.bool.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onClickEdit: PropTypes.func.isRequired,
  onClickRemove: PropTypes.func.isRequired,
  remainingSlots: PropTypes.number.isRequired,
  onDropFiles: PropTypes.func.isRequired,
  isDraggingOver: PropTypes.bool.isRequired,
  onDragOverStart: PropTypes.func.isRequired,
  onDragOverEnd: PropTypes.func.isRequired
};

export default FileView;
