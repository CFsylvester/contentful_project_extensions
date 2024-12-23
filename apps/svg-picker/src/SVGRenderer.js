// SVGRenderer.js
import React, { useEffect, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Spinner, Typography } from '@contentful/forma-36-react-components';

const SVGRenderer = () => {
  const sdk = useSDK();
  const [loading, setLoading] = useState(true);
  const [svgGroup, setSvgGroup] = useState('');
  const [svgAssets, setSvgAssets] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConfiguration = () => {
      try {
        const instanceGroup = sdk.parameters.instance?.svgGroup;
        if (!instanceGroup) {
          throw new Error('SVG Group parameter is not set.');
        }
        setSvgGroup(instanceGroup);
      } catch (err) {
        console.error('Configuration Error:', err);
        setError(err.message);
      }
    };

    fetchConfiguration();
  }, [sdk]);

  useEffect(() => {
    const fetchSVGs = async () => {
      try {
        // Query assets tagged with the selected svgGroup
        const entries = await sdk.space.getEntries({
          content_type: 'yourContentType', // Replace with your content type ID if necessary
          'metadata.tags.sys.id[in]': svgGroup,
          include: 1,
        });

        // Filter assets to only include images (assuming SVGs are stored as image assets)
        const svgAssets = entries.items
          .filter((item) => item.fields.file?.['en-US']?.contentType === 'image/svg+xml')
          .map((item) => ({
            id: item.sys.id,
            title: item.fields.title['en-US'],
            url: item.fields.file['en-US'].url,
          }));

        setSvgAssets(svgAssets);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching SVGs:', err);
        setError('Failed to fetch SVGs.');
        setLoading(false);
      }
    };

    if (svgGroup) {
      fetchSVGs();
    }
  }, [svgGroup, sdk.space]);

  if (loading) return <Spinner />;

  if (error) {
    return (
      <Typography style={{ color: 'red', padding: '20px' }}>
        {error}
      </Typography>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Typography>
        <h2>SVG Picker - {svgGroup}</h2>
      </Typography>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {svgAssets.map((svg) => (
          <div key={svg.id} style={{ margin: '10px', textAlign: 'center' }}>
            <img
              src={`https:${svg.url}`}
              alt={svg.title}
              style={{ width: '100px', height: '100px' }}
            />
            <Typography>{svg.title}</Typography>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SVGRenderer;
