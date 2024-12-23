// SVGPicker.js
import React, { useEffect, useState } from 'react';
import {
  Spinner,
  Typography,
  Button,
  Grid,
  Card,
  TextInput,
} from '@contentful/forma-36-react-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import './SVGPicker.css'; // Optional: For additional styling

const SVGPicker = () => {
  const sdk = useSDK();
  const [loading, setLoading] = useState(true);
  const [svgAssets, setSvgAssets] = useState([]);
  const [error, setError] = useState(null);
  const [selectedSvg, setSelectedSvg] = useState(null);
  const [picking, setPicking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchSVGs = async () => {
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

        // Access the svgGroup parameter
        const svgGroup = sdk.parameters.instance?.svgGroup;
        if (!svgGroup) {
          throw new Error('SVG Group parameter is not set.');
        }

        console.log('Fetching SVGs for group:', svgGroup);

        // Fetch assets tagged with svgGroup
        const assets = await sdk.space.getAssets({
          'metadata.tags.sys.id[in]': svgGroup,
          limit: 100, // Adjust the limit as needed
        });

        // Filter SVG assets
        const filteredSvgAssets = assets.items.filter((asset) => {
          const file = asset.fields.file?.['en-US'];
          return file && file.contentType === 'image/svg+xml';
        }).map((asset) => ({
          id: asset.sys.id,
          title: asset.fields.title['en-US'] || 'Untitled',
          url: `https:${asset.fields.file['en-US'].url}`,
        }));

        // Retrieve the currently selected SVG from the field
        const currentSvgUrl = sdk.field.getValue();
        if (currentSvgUrl) {
          const currentSvg = filteredSvgAssets.find(svg => svg.url === currentSvgUrl);
          if (currentSvg) {
            setSelectedSvg(currentSvg);
          }
        }

        if (isMounted) {
          setSvgAssets(filteredSvgAssets);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching SVGs:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchSVGs();

    return () => {
      isMounted = false; // Cleanup flag on unmount
    };
  }, [sdk]);

  const handleSelect = (svg) => {
    setSelectedSvg(svg);
    setError(null); // Clear previous errors
    console.log('Selected SVG:', svg);
  };

  const handleConfirm = async () => {
    if (!selectedSvg) return;

    try {
      setPicking(true);
      // Example action: Insert SVG URL into a field named 'svgUrl'
      // Adjust the field ID ('svgUrl') as per your Content Type
      await sdk.field.setValue(selectedSvg.url);

      // Notify success
      sdk.notifier.success(`SVG "${selectedSvg.title}" has been inserted.`);

      // Close the app if it's running in a modal
      if (sdk.window && typeof sdk.window.close === 'function') {
        sdk.window.close();
      }

      setPicking(false);
    } catch (err) {
      console.error('Error handling selection:', err);
      setError('Failed to handle SVG selection.');
      setPicking(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <Typography style={{ color: 'red', padding: '20px' }}>
        {error}
      </Typography>
    );
  }

  // Filter SVGs based on search term
  const displayedSvgAssets = svgAssets.filter((svg) =>
    svg.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '20px' }}>
      <Typography>
        <h1>Select an SVG</h1>
      </Typography>
      <div style={{ marginBottom: '20px' }}>
        <Typography>
          <h2>Search SVGs</h2>
        </Typography>
        <TextInput
          name="search"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by title..."
        />
      </div>
      {displayedSvgAssets.length === 0 ? (
        <Typography>No SVGs found for the selected group.</Typography>
      ) : (
        <>
          <Grid columns={3} gutter="space30">
            {displayedSvgAssets.map((svg) => (
              <Card
                key={svg.id}
                onClick={() => handleSelect(svg)}
                className={selectedSvg?.id === svg.id ? 'selected-card' : ''}
                style={{
                  cursor: 'pointer',
                  border: selectedSvg?.id === svg.id ? '2px solid #0070f3' : '1px solid #e1e1e1',
                }}
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelect(svg);
                  }
                }}
              >
                <div style={{ padding: '10px', textAlign: 'center' }}>
                  <img
                    src={svg.url}
                    alt={`Preview of ${svg.title}`}
                    style={{ maxWidth: '100%', maxHeight: '100px' }}
                  />
                  <Typography>{svg.title}</Typography>
                </div>
              </Card>
            ))}
          </Grid>
          {selectedSvg && (
            <div style={{ marginTop: '20px' }}>
              <Typography>
                <strong>Selected SVG:</strong> {selectedSvg.title}
              </Typography>
              <Button
                buttonType="positive"
                onClick={handleConfirm}
                disabled={picking}
                style={{ marginTop: '10px' }}
              >
                {picking ? 'Processing...' : 'Confirm Selection'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SVGPicker;
