import React, { useEffect, useState } from "react";
import {
  Spinner,
  Typography,
  Grid,
  RadioButton,
  Icon,
} from "@contentful/forma-36-react-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import "./SVGPicker.css";

const SVGPicker = () => {
  const sdk = useSDK();
  const [loading, setLoading] = useState(true);
  const [svgAssets, setSvgAssets] = useState([]);
  const [selectedSvg, setSelectedSvg] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSVGs = async () => {
      try {
        sdk.window.startAutoResizer();

        const svgGroup = sdk.parameters.instance?.svgGroup;
        if (!svgGroup) throw new Error("SVG Group parameter is not set.");
        setGroupName(svgGroup.replace("svg", "")); // Remove 'svg' prefix from group name

        const assets = await sdk.space.getAssets({
          "metadata.tags.sys.id[in]": svgGroup,
          limit: 100,
        });

        const filteredSvgAssets = assets.items
          .filter((asset) => {
            const file = asset.fields.file?.["en-US"];
            return file && file.contentType === "image/svg+xml";
          })
          .map((asset) => ({
            id: asset.sys.id,
            title: asset.fields.title["en-US"] || "Untitled",
            url: `https:${asset.fields.file["en-US"].url}`,
          }));

        const currentSvgUrl = sdk.field.getValue();
        if (currentSvgUrl) {
          const currentSvg = filteredSvgAssets.find(
            (svg) => svg.url === currentSvgUrl
          );
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
    sdk.notifier.success(
      svg ? `SVG "${svg.title}" has been selected.` : "Selection cleared."
    );
  };

  const renderIcon = (svg) => {
    const isSelected = svg ? selectedSvg?.id === svg.id : selectedSvg === null;

    const iconStyles = {
      width: "40px",
      height: "40px",
      border: `1px solid ${isSelected ? "#85D1AF" : "#CFD9E0"}`,
      borderRadius: "2px",
      padding: "8px",
      backgroundColor: "#FFFFFF",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: isSelected ? "0 0 0 2px #85D1AF" : "none",
      margin: "0 auto",
      position: "relative",
    };

    const containerStyles = {
      cursor: "pointer",
      textAlign: "center",
      width: "40px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "2px",
    };

    const noneTextStyle = {
      fontSize: "12px",
      color: "#536171",
      fontWeight: isSelected ? "600" : "normal",
    };

    if (!svg) {
      return (
        <div
          style={containerStyles}
          onClick={() => handleSelect(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleSelect(null)}
        >
          <div style={iconStyles}>
            <span style={noneTextStyle}>None</span>
          </div>
        </div>
      );
    }

    return (
      <div
        style={containerStyles}
        onClick={() => handleSelect(svg)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleSelect(svg)}
      >
        <div style={iconStyles}>
          <img
            src={svg.url}
            alt={svg.title}
            style={{
              height: "24px",
              width: "24px",
            }}
          />
        </div>
      </div>
    );
  };

  if (loading) return <Spinner />;

  return (
    <div>
      {svgAssets.length === 0 ? (
        <Typography>No SVGs found for the selected group.</Typography>
      ) : (
        <Grid
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
            maxWidth: "200px",
            gap: "12px",
            justifyItems: "start",
            padding: "2px 2px 2px 0px",
          }}
        >
          {svgAssets.map((svg) => renderIcon(svg))}
          {renderIcon(null)}
        </Grid>
      )}
    </div>
  );
};

export default SVGPicker;
