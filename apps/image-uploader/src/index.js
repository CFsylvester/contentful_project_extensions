// src/index.js

import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import '@contentful/forma-36-fcss/dist/styles.css';
import { Spinner, Button, Typography } from '@contentful/forma-36-react-components';
import { init } from '@contentful/app-sdk';
import FileView from './components/FileView';
import ProgressView from './components/ProgressView';
import {
  readFileAsUrl,
  findImageContentType,
  getImageUrlFromDataTransfer,
  getAssetIdFromDataTransfer,
  getBase64FromDataTransfer
} from './utils';

import './index.css';

class App extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };

  findProperLocale = () => {
    if (this.props.sdk.field.type === 'Link') {
      return this.props.sdk.locales.default;
    }

    return this.props.sdk.field.locale;
  };

  state = {
    isDraggingOver: false,
    assets: [], // Array to hold asset objects
    uploadProgresses: [], // Array to hold upload progress for each asset
    maxAssets: 10, // Default value, will be updated based on field validators
    linkExistingLoading: false
  };

  async componentDidMount() {
    this.props.sdk.window.startAutoResizer();
    // Handler for external field value changes (e.g., when multiple authors are working on the same entry).
    this.detachExternalChangeHandler = this.props.sdk.field.onValueChanged(this.onExternalChange);

    this.retrieveMaxAssets();
    this.loadAssets();
  }

  componentWillUnmount() {
    this.detachExternalChangeHandler();
  }

  isFieldArray = () => {
    return this.props.sdk.field.type === 'Array';
  };

  retrieveMaxAssets = async () => {
    console.log('Retrieving Max Assets');
    try {
      // Access validators from sdk.field.validations directly
      const validators = this.props.sdk.field.validations;
      console.log('Retrieved Validators:', validators);

      if (!validators || validators.length === 0) {
        console.warn('No validators found for the field. Using default maxAssets of 10.');
        return;
      }

      // Log each validator to inspect their structure
      validators.forEach((validator, index) => {
        console.log(`Validator ${index + 1}:`, validator);
      });

      // Find the Size Validator by checking if it contains a `size` object
      const sizeValidator = validators.find(validator => validator.size);
      console.log('Identified Size Validator:', sizeValidator);

      if (sizeValidator && typeof sizeValidator.size.max === 'number') {
        this.setState({ maxAssets: sizeValidator.size.max });
        console.log(`maxAssets set to ${sizeValidator.size.max} based on field validators.`);
      } else {
        console.warn('Size Validator not found or invalid. Using default maxAssets of 10.');
      }
    } catch (error) {
      console.error('Error retrieving validators:', error);
      console.warn('Using default maxAssets of 10.');
    }
  };


  loadAssets = async () => {
    const value = await this.props.sdk.field.getValue(this.findProperLocale());

    if (value) {
      if (Array.isArray(value)) {
        // Handle multiple assets
        try {
          const assets = await Promise.all(value.map(link => this.props.sdk.space.getAsset(link.sys.id)));
          console.log('Assets loaded:', assets.map(a => a.sys.id));
          // Ensure uniqueness
          const uniqueAssets = assets.filter((asset, index, self) =>
            index === self.findIndex(a => a.sys.id === asset.sys.id)
          );
          this.setState({ assets: uniqueAssets });
        } catch (error) {
          console.error('Error loading assets:', error);
          this.onError(error);
          this.unlinkAsset();
        }
      } else {
        // Handle single asset
        try {
          const asset = await this.props.sdk.space.getAsset(value.sys.id);
          console.log('Single asset loaded:', asset.sys.id);
          this.setState({ assets: [asset] });
        } catch (error) {
          console.error('Error loading asset:', error);
          this.onError(error);
          this.unlinkAsset();
        }
      }
    }
  };

  onDropFiles = async (event) => {
    console.log('onDropFiles Called');
    event.preventDefault();
    event.stopPropagation();

    let files = [];
    if (event.target && event.target.files) {
      files = Array.prototype.slice.call(event.target.files);
    } else if (event.dataTransfer && event.dataTransfer.files) {
      files = Array.prototype.slice.call(event.dataTransfer.files);
    }

    if (files.length) {
      console.log(`Files Dropped: ${files.length}`);
      return this.createNewAssetsFromFiles(files);
    }

    if (!event.dataTransfer) {
      console.log('No DataTransfer available');
      return;
    }

    const assetId = getAssetIdFromDataTransfer(event.dataTransfer);
    if (assetId) {
      console.log(`Reusing Existing Asset ID: ${assetId}`);
      return this.reuseExistingAsset(assetId);
    }

    const base64 = await getBase64FromDataTransfer(event.dataTransfer);
    if (base64) {
      console.log(`Creating New Asset from Base64`);
      return this.createNewAssetFromBase64(base64.prefix, base64.data, {
        name: 'Unnamed',
        type: base64.type
      });
    }

    const imageUrl = await getImageUrlFromDataTransfer(event.dataTransfer);
    if (imageUrl) {
      console.log(`Creating New Asset from Image URL: ${imageUrl}`);
      return this.createNewAssetFromImageUrl(imageUrl);
    }

    console.log('No valid drop action found');
  };

  onClickEdit = (assetId) => {
    console.log(`Edit clicked for Asset ID: ${assetId}`);
    this.props.sdk.navigator.openAsset(assetId, {
      slideIn: true
    });
  };

  onClickRemove = async (assetId) => {
    console.log(`Remove clicked for Asset ID: ${assetId}`);
    await this.removeAsset(assetId);
  };

  onClickLinkExisting = async () => {
    if (this.state.linkExistingLoading) return;
  
    this.setState({ linkExistingLoading: true });
    console.log('Opening Native Asset Picker');
  
    // Calculate remaining slots based on max assets and current assets count
    const remainingSlots = this.state.maxAssets - this.state.assets.length;
  
    try {
      const selectedAssets = await this.props.sdk.dialogs.selectMultipleAssets({
        title: 'Select Assets',
        parameters: {
          contentType: ['image/jpeg', 'image/png', 'image/gif'] // Adjust as needed
        },
        min: 1,
        max: remainingSlots // Limit selection to the number of empty slots
      });
  
      if (selectedAssets && selectedAssets.length > 0) {
        const assetIds = selectedAssets.map(asset => asset.sys.id);
        console.log('Selected Asset IDs from Native Picker:', assetIds);
        await this.handleAssetSelection(assetIds);
      } else {
        console.log('No assets selected from native picker.');
      }
    } catch (error) {
      console.error('Error opening native asset picker:', error);
      this.onError(error);
    } finally {
      this.setState({ linkExistingLoading: false });
    }
  };
  

  handleAssetSelection = async (selectedAssetIds) => {
    console.log('handleAssetSelection Called with Asset IDs:', selectedAssetIds);

    // Remove duplicate assetIds
    const uniqueAssetIds = [...new Set(selectedAssetIds)];
    console.log('Unique Asset IDs:', uniqueAssetIds);

    // Retrieve current field value
    const currentValue = await this.props.sdk.field.getValue(this.findProperLocale()) || (this.isFieldArray() ? [] : null);

    // Calculate current asset count
    const currentCount = this.isFieldArray() ? currentValue.length : (currentValue ? 1 : 0);

    // Calculate available slots
    const availableSlots = this.state.maxAssets - currentCount;

    if (uniqueAssetIds.length > availableSlots) {
      this.onError(new Error(`You can only add up to ${availableSlots} more asset(s).`));
      return;
    }

    await this.setFieldLinks(uniqueAssetIds);
  };

  onError = (error) => {
    console.error('Error:', error);
    this.props.sdk.notifier.error(error.message);
  };

  onExternalChange = async (value) => {
    console.log('onExternalChange Called with Value:', value);
    this.setState({ value });

    if (value) {
      if (this.isFieldArray()) {
        try {
          const assets = await Promise.all(
            value.map(link => this.props.sdk.space.getAsset(link.sys.id))
          );
          console.log('Assets loaded:', assets.map(a => a.sys.id));
          // Ensure uniqueness
          const uniqueAssets = assets.filter((asset, index, self) =>
            index === self.findIndex(a => a.sys.id === asset.sys.id)
          );
          this.setState({ assets: uniqueAssets });
        } catch (error) {
          console.error('Error loading assets:', error);
          this.onError(error);
          this.unlinkAsset();
        }
      } else {
        try {
          const asset = await this.props.sdk.space.getAsset(value.sys.id);
          console.log('Single asset loaded:', asset.sys.id);
          this.setState({ assets: [asset] });
        } catch (error) {
          console.error('Error loading asset:', error);
          this.onError(error);
          this.unlinkAsset();
        }
      }
    } else {
      this.setState({ assets: [] });
    }
  };

  createAsset = (upload, file, locale) => {
    const asset = {
      fields: {
        title: {},
        description: {},
        file: {}
      }
    };

    asset.fields.title[locale] = file.name;
    asset.fields.description[locale] = file.name;
    asset.fields.file[locale] = {
      contentType: file.type,
      fileName: file.name,
      uploadFrom: {
        sys: {
          type: 'Link',
          linkType: 'Upload',
          id: upload.sys.id
        }
      }
    };

    return this.props.sdk.space.createAsset(asset);
  };

  createAssetWithImageUrl = async (imageUrl, contentType, locale) => {
    const asset = {
      fields: {
        title: {},
        description: {},
        file: {}
      }
    };

    asset.fields.title[locale] = imageUrl;
    asset.fields.description[locale] = imageUrl;
    asset.fields.file[locale] = {
      contentType: contentType || 'image/jpeg', // Default to image/jpeg if not specified
      fileName: 'linked-image', // Assign a default file name or parse from URL
      upload: imageUrl
    };

    return this.props.sdk.space.createAsset(asset);
  };

  reuseExistingAsset = async (assetId) => {
    console.log(`Reusing Existing Asset ID: ${assetId}`);
    try {
      // Set the field value; the onValueChanged handler will update the state
      await this.setFieldValue(assetId);
    } catch (error) {
      console.error('Error reusing existing asset:', error);
      this.onError(error);
    }
  };

  createNewAssetsFromFiles = async (files) => {
    console.log('createNewAssetsFromFiles Called');
    const imageFiles = files.filter(file => /^image\/[\w-_|\w+\w]+$/.test(file.type));

    if (imageFiles.length === 0) {
      console.log('No valid image files found');
      return this.onError(new Error('Only images are allowed'));
    }

    // Retrieve current field value
    const currentValue = await this.props.sdk.field.getValue(this.findProperLocale()) || (this.isFieldArray() ? [] : null);

    // Calculate current asset count
    const currentCount = this.isFieldArray() ? currentValue.length : (currentValue ? 1 : 0);

    // Calculate available slots
    const availableSlots = this.state.maxAssets - currentCount;

    // Check if adding these files exceeds the maximum limit
    if (imageFiles.length > availableSlots) {
      this.onError(new Error(`You can only add up to ${availableSlots} more asset(s).`));
      return;
    }

    // Update uploadProgresses
    this.setState(prevState => ({
      uploadProgresses: [
        ...prevState.uploadProgresses,
        ...imageFiles.map(file => ({ fileName: file.name, percent: 0 }))
      ]
    }), () => {
      console.log('Upload Progresses Updated:', this.state.uploadProgresses);
    });

    for (let imageFile of imageFiles) {
      try {
        console.log(`Processing File: ${imageFile.name}`);
        const [base64Prefix, base64Data] = await readFileAsUrl(imageFile);
        await this.createNewAssetFromBase64(base64Prefix, base64Data, imageFile);
      } catch (error) {
        console.error('Error Creating New Asset from File:', error);
        this.onError(error);
      }
    }
  };

  createNewAssetFromBase64 = async (base64Prefix, base64Data, file) => {
    const fileName = file.name;
    console.log(`Creating asset from Base64 for file: ${fileName}`);
    this.setUploadProgress(fileName, 10);

    try {
      // Upload the Base64 encoded image
      const upload = await this.props.sdk.space.createUpload(base64Data);
      console.log(`Upload created: ${upload.sys.id}`);
      this.setUploadProgress(fileName, 40);

      const locale = this.findProperLocale();

      // Create an unprocessed asset record that links to the upload record created above
      const rawAsset = await this.createAsset(upload, file, locale);
      console.log(`Asset created: ${rawAsset.sys.id}`);
      this.setUploadProgress(fileName, 50);

      await this.processAndPublishAsset(rawAsset, locale);
    } catch (error) {
      console.error('Error in createNewAssetFromBase64:', error);
      this.onError(error);
    }
  };

  createNewAssetFromImageUrl = async (imageUrl) => {
    const fileName = 'linked-image'; // Assign a default file name or parse from URL
    console.log(`Creating asset from Image URL: ${imageUrl}`);
    this.setUploadProgress(fileName, 0);

    // Determine content type
    let contentType = 'image/jpeg'; // Default
    try {
      contentType = await findImageContentType(imageUrl);
      console.log(`Determined Content Type: ${contentType}`);
    } catch (error) {
      console.warn('Could not determine content type, defaulting to image/jpeg');
    }

    const locale = this.findProperLocale();
    const rawAsset = await this.createAssetWithImageUrl(imageUrl, contentType, locale);
    console.log(`Asset created from URL: ${rawAsset.sys.id}`);
    this.setUploadProgress(fileName, 25);
    await this.processAndPublishAsset(rawAsset, locale);
  };

  processAndPublishAsset = async (rawAsset, locale) => {
    try {
      console.log(`Processing asset: ${rawAsset.sys.id}`);
      // Start processing the asset
      await this.props.sdk.space.processAsset(rawAsset, locale);
      this.setUploadProgress(rawAsset.fields.file[locale].fileName, 55);
      console.log('Asset processing started.');

      // Wait until asset is processed
      const processedAsset = await this.props.sdk.space.waitUntilAssetProcessed(
        rawAsset.sys.id,
        locale
      );
      console.log(`Asset processed: ${processedAsset.sys.id}`);
      this.setUploadProgress(rawAsset.fields.file[locale].fileName, 85);

      // Publish the asset, ignore if it fails
      let publishedAsset;
      try {
        publishedAsset = await this.props.sdk.space.publishAsset(processedAsset);
        console.log(`Asset published: ${publishedAsset.sys.id}`);
      } catch (err) {
        console.warn('Publish failed:', err);
      }

      this.setUploadProgress(rawAsset.fields.file[locale].fileName, 95);

      const asset = publishedAsset || processedAsset;

      // Rely on onValueChanged to update the state
      await this.setFieldValue(asset.sys.id);

      console.log(`Upload complete for file: ${rawAsset.fields.file[locale].fileName}`);
    } catch (error) {
      console.error('Error in processAndPublishAsset:', error);
      this.onError(error);
    }
  };

  unlinkAsset = () => {
    console.log('Unlinking asset');
    this.props.sdk.field.setValue(this.isFieldArray() ? [] : null, this.findProperLocale());
    this.setState({
      assets: []
    });
  };

  setFieldValue = async (assetId) => {
    console.log(`Setting field value for Asset ID: ${assetId}`);
    const locale = this.findProperLocale();

    const linkObject = {
      sys: {
        type: 'Link',
        linkType: 'Asset',
        id: assetId
      }
    };

    if (this.isFieldArray()) {
      const currentValue = await this.props.sdk.field.getValue(locale) || [];
      const assetExists = currentValue.some(asset => asset.sys.id === assetId);

      if (!assetExists) {
        const updatedValue = [...currentValue, linkObject];
        console.log('Updating field value for Array Field:', updatedValue);
        await this.props.sdk.field.setValue(updatedValue, locale);
      } else {
        console.log('Asset already linked. Skipping addition.');
      }
    } else {
      console.log('Setting field value for Single Field:', linkObject);
      await this.props.sdk.field.setValue(linkObject, locale);
    }
  };

  setFieldLinks = async (assetIds) => {
    console.log('setFieldLinks Called with IDs:', assetIds);
    if (!assetIds || assetIds.length === 0) {
      console.log('No assets selected.');
      return;
    }

    // Remove duplicate assetIds
    const uniqueAssetIds = [...new Set(assetIds)];
    console.log('Unique Asset IDs:', uniqueAssetIds);

    // Retrieve current field value
    const currentValue = await this.props.sdk.field.getValue(this.findProperLocale()) || (this.isFieldArray() ? [] : null);

    // Calculate current asset count
    const currentCount = this.isFieldArray() ? currentValue.length : (currentValue ? 1 : 0);

    // Calculate available slots
    const availableSlots = this.state.maxAssets - currentCount;

    if (uniqueAssetIds.length > availableSlots) {
      this.onError(new Error(`You can only add up to ${availableSlots} more asset(s).`));
      return;
    }

    const locale = this.findProperLocale();

    const linkObjects = uniqueAssetIds.map(id => ({
      sys: {
        type: 'Link',
        linkType: 'Asset',
        id
      }
    }));

    if (this.isFieldArray()) {
      const newLinks = linkObjects.filter(link => !currentValue.some(existing => existing.sys.id === link.sys.id));
      const updatedValue = [...currentValue, ...newLinks];
      console.log('Updated Value for Array Field:', updatedValue);
      await this.props.sdk.field.setValue(updatedValue, locale);
    } else {
      // If field is single, take the first asset
      if (linkObjects.length > 0) {
        console.log('Setting value for Single Field:', linkObjects[0]);
        await this.props.sdk.field.setValue(linkObjects[0], locale);
      }
    }

    // The onValueChanged handler will update the state accordingly
  };

  removeAsset = async (assetId) => {
    console.log(`Removing Asset ID: ${assetId}`);
    const locale = this.findProperLocale();
    if (this.isFieldArray()) {
      const currentValue = await this.props.sdk.field.getValue(locale) || [];
      const updatedValue = currentValue.filter(asset => asset.sys.id !== assetId);
      console.log('Updated Value after Removal:', updatedValue);
      await this.props.sdk.field.setValue(updatedValue, locale);
      this.setState(prevState => ({
        assets: prevState.assets.filter(asset => asset.sys.id !== assetId)
      }), () => {
        console.log('Asset removed from state:', assetId);
      });
    } else {
      console.log('Removing Single Field Value');
      await this.props.sdk.field.removeValue(locale);
      this.setState({
        assets: []
      }, () => {
        console.log('Assets cleared from state.');
      });
    }
  };

  setUploadProgress = (fileName, percent) => {
    console.log(`Setting upload progress for ${fileName}: ${percent}%`);
    this.setState(prevState => ({
      uploadProgresses: prevState.uploadProgresses.map(up => {
        if (up.fileName === fileName) {
          return { ...up, percent };
        }
        return up;
      })
    }), () => {
      console.log('Upload Progresses Updated:', this.state.uploadProgresses);
    });
  };

  handleDragEnd = async (result) => {
    const { destination, source } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const reorderedAssets = Array.from(this.state.assets);
    const [movedAsset] = reorderedAssets.splice(source.index, 1);
    reorderedAssets.splice(destination.index, 0, movedAsset);

    this.setState({ assets: reorderedAssets }, async () => {
      console.log('Assets reordered:', this.state.assets.map(a => a.sys.id));

      // Update the Contentful field with the new order
      const locale = this.findProperLocale();
      const newValue = reorderedAssets.map(asset => ({
        sys: {
          type: 'Link',
          linkType: 'Asset',
          id: asset.sys.id
        }
      }));

      if (this.isFieldArray()) {
        console.log('Updating field value for reordered array:', newValue);
        await this.props.sdk.field.setValue(newValue, locale);
      } else {
        if (newValue.length > 0) {
          console.log('Updating field value for reordered single asset:', newValue[0]);
          await this.props.sdk.field.setValue(newValue[0], locale);
        }
      }
    });
  };

  render = () => {
    console.log('App Render Method Called');
    console.log('State:', this.state);

    const remainingSlots = this.state.maxAssets - this.state.assets.length;
    const isMaxReached = remainingSlots <= 0;

    return (
      <div style={{ padding: '20px' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '20px' }}>
          <Button
            onClick={this.onClickLinkExisting}
            variant="secondary"
            isFullWidth={false}
            disabled={isMaxReached || this.state.linkExistingLoading}
            style={{ marginRight: '10px' }}
          >
            {this.state.linkExistingLoading ? 'Linking...' : 'Link Existing Assets'}
          </Button>
          <Typography variant="body2" style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '12px',
            backgroundColor: isMaxReached ? '#FF0000' : '#28a745', // Red if max, green otherwise
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} left
          </Typography>
        </div>

        {/* FileView with Drag-and-Drop Placeholder */}
        <FileView
          assets={this.state.assets}
          isPublished={
            this.state.assets.every(asset =>
              asset.sys.version === (asset.sys.publishedVersion || 0) + 1
            )
          }
          onDragEnd={this.handleDragEnd}
          onClickEdit={this.onClickEdit}
          onClickRemove={this.onClickRemove}
          remainingSlots={remainingSlots}
          onDropFiles={this.onDropFiles}
          isDraggingOver={this.state.isDraggingOver}
          onDragOverStart={() => this.setState({ isDraggingOver: true })}
          onDragOverEnd={() => this.setState({ isDraggingOver: false })}
        />

        {/* Upload Progress */}
        {this.state.uploadProgresses.length > 0 && (
          <ProgressView
            uploadProgresses={this.state.uploadProgresses}
          />
        )}

        {/* Maximum Assets Reached Message */}
        {isMaxReached && (
          <Typography variant="h6" marginTop="spacingM">
            Maximum of {this.state.maxAssets} assets reached.
          </Typography>
        )}
      </div>
    );
  };
}

App.propTypes = {
  sdk: PropTypes.object.isRequired
};

init(sdk => {
  ReactDOM.render(<App sdk={sdk} />, document.getElementById('root'));
});

if (module.hot) {
  module.hot.accept();
}
