import React, { useEffect, useState } from 'react';
import { Spinner, Typography } from '@contentful/forma-36-react-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import './SVGPicker.css';

const SVGPicker = () => {
    const sdk = useSDK();
    const [loading, setLoading] = useState(true);
    const [svgAssets, setSvgAssets] = useState([]);
    const [selectedSvg, setSelectedSvg] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSVGs = async () => {
            try {
                sdk.window.startAutoResizer();

                const svgGroup = sdk.parameters.instance?.svgGroup;
                if (!svgGroup) throw new Error('SVG Group parameter is not set.');
                setGroupName(svgGroup.replace('svg', '')); // Remove 'svg' prefix from group name

                const assets = await sdk.space.getAssets({
                    'metadata.tags.sys.id[in]': svgGroup,
                    limit: 100,
                });

                const filteredSvgAssets = assets.items
                    .filter((asset) => {
                        const file = asset.fields.file?.['en-US'];
                        return file && file.contentType === 'image/svg+xml';
                    })
                    .map((asset) => ({
                        id: asset.sys.id,
                        title: asset.fields.title['en-US'] || 'Untitled',
                        url: `https:${asset.fields.file['en-US'].url}`,
                    }));

                const currentSvgUrl = sdk.field.getValue();
                if (currentSvgUrl) {
                    const currentSvg = filteredSvgAssets.find((svg) => svg.url === currentSvgUrl);
                    if (currentSvg) setSelectedSvg(currentSvg);
                }

                setSvgAssets(filteredSvgAssets);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchSVGs();
    }, [sdk]);

    const handleSelect = (svg) => {
        setSelectedSvg(svg);
        sdk.field.setValue(svg ? svg.url : null);
        sdk.notifier.success(svg ? `SVG "${svg.title}" has been selected.` : 'Selection cleared.');
    };

    if (loading) return <Spinner />;

    return (
        <div className="svg-picker-container">
            {/* Header */}
            <div className="svg-picker-header">
                <img src="./images/logo.svg" alt="Brand Logo" className="svg-picker-logo" />
                <div>
                <Typography className="svg-picker-title">Svg Selector</Typography>
                <Typography className="svg-picker-subtitle"><br/> {groupName} Icons</Typography>
                </div>
            </div>

            {svgAssets.length === 0 ? (
                <Typography className="no-svgs-message">No SVGs found for the selected group.</Typography>
            ) : (
                <div className="icon-grid">
                    {svgAssets.map((svg) => (
                        <div>
                            <div key={svg.id} className="icon-card-container">
                                <div className="icon-card">
                                    <img src={svg.url} alt={`Preview of ${svg.title}`} className="icon-image" />
                                </div>
                                <label className="checkbox">
                                    <input
                                        type="checkbox"
                                        className="checkbox-input"
                                        checked={selectedSvg?.id === svg.id}
                                        onChange={() => handleSelect(svg)}
                                    />
                                    <span className="checkbox-control"></span>
                                </label>
                            </div>
                            <Typography className="checkbox-label">{svg.title}</Typography>

                        </div>
                    ))}
                    <div>
                        <div className="icon-card-container">
                            <div className="icon-card">
                                <Typography className="none-title">None</Typography>
                            </div>
                            <label className="checkbox">
                                <input
                                    type="checkbox"
                                    className="checkbox-input"
                                    checked={selectedSvg === null}
                                    onChange={() => handleSelect(null)}
                                />
                                <span className="checkbox-control"></span>

                            </label>
                        </div>
                        <Typography className="checkbox-label">None</Typography>


                    </div>
                </div>
            )}
        </div>
    );
};

export default SVGPicker;
