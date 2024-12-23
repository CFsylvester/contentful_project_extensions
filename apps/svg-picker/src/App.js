// App.js
import React, { useEffect, useState } from 'react';
import {
  Select,
  Option,
  Spinner,
  Typography,
  Button,
  FormLabel,
} from '@contentful/forma-36-react-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import SVGPicker from './SVGPicker'; // Import the main app view

const App = () => {
  const sdk = useSDK(); // Access SDK via hook
  const [loading, setLoading] = useState(true);
  const [tagGroups, setTagGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false); // State to determine view

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        console.log('SDK Object:', sdk);
        console.log('SDK Space Object:', sdk.space); // Debugging

        if (!sdk) {
          throw new Error('SDK not initialized');
        }

        if (!sdk.window || typeof sdk.window.startAutoResizer !== 'function') {
          throw new Error('SDK.window.startAutoResizer is not available');
        }

        sdk.window.startAutoResizer(); // Initialize auto-resizer

        // Fetch existing configuration parameters
        const existingGroup = sdk.parameters.instance?.svgGroup || '';
        setSelectedGroup(existingGroup);

        // Determine if already configured
        if (existingGroup) {
          setIsConfigured(true);
          setLoading(false);
          return;
        }

        // Verify if readTags exists
        if (typeof sdk.space.readTags !== 'function') {
          throw new Error('sdk.space.readTags is not available. Check your permissions and SDK version.');
        }

        // Fetch tags with 'svgPicker' prefix
        const tags = await sdk.space.readTags();
        const svgPickerTags = tags.items.filter((tag) =>
          tag.sys.id.startsWith('svgPicker')
        );

        if (isMounted) {
          setTagGroups(svgPickerTags.map((tag) => tag.sys.id));
          setLoading(false);
        }
      } catch (err) {
        console.error('Initialization Error:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false; // Cleanup flag on unmount
    };
  }, [sdk]);

  const handleGroupChange = (e) => {
    setSelectedGroup(e.target.value);
    setError(null); // Clear previous errors
    console.log('Selected Group:', e.target.value);
  };

  const handleSave = async () => {
    console.log('handleSave invoked');
    if (!selectedGroup) {
      setError('Please select a group before saving.');
      console.log('Save failed: No group selected');
      return;
    }

    try {
      setSaving(true);
      console.log('Saving svgGroup:', selectedGroup);
      await sdk.parameters.instance.set({
        svgGroup: selectedGroup,
      });

      console.log('Configuration saved successfully.');

      // Notify the user of success
      sdk.notifier.success('Configuration saved successfully.');

      // Switch to the main app view
      setIsConfigured(true);

      // Optionally, close the configuration modal
      // sdk.window.close();
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError('Failed to save configuration.');
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <Typography style={{ color: 'red', padding: '20px' }}>
        {error}
      </Typography>
    );
  }

  if (isConfigured) {
    // Render the main app view
    return <SVGPicker />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Typography>
        <h1>SVG Picker - Configuration</h1>
      </Typography>
      <div style={{ marginBottom: '20px' }}>
        {/* Using FormLabel to properly associate the label with the Select component */}
        <FormLabel htmlFor="group-select">Select a SVG Group</FormLabel>
        <Select
          id="group-select"
          name="group-select"
          value={selectedGroup}
          onChange={handleGroupChange}
          disabled={saving}
          required
        >
          <Option value="" disabled>
            Select a group
          </Option>
          {tagGroups.map((tag) => (
            <Option key={tag} value={tag}>
              {tag}
            </Option>
          ))}
        </Select>
      </div>
      {error && (
        <Typography style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </Typography>
      )}
      <Button
        buttonType="positive"
        onClick={handleSave}
        disabled={saving || !selectedGroup}
        style={{ marginTop: '10px' }}
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
};

export default App;
