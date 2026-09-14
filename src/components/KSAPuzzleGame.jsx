import React, { useState, useEffect } from "react";
import { Stage, Layer, Path, Text, Group } from "react-konva";
import confetti from "canvas-confetti";
import { mapSilhouette, regionsData } from "../data/regions";
import { regionsInfo } from "../data/info";

const SNAP_THRESHOLD = 30; // Generous distance threshold in pixels for smooth snapping
const STAGE_WIDTH = 1900; // Fixed virtual coordinate width
const STAGE_HEIGHT = 900; // Fixed virtual coordinate height

// Centering offset for the map silhouette (Adjust if your SVG paths drift off-center)
const MAP_OFFSET_X = 425;
const MAP_OFFSET_Y = 0;
const MAP_BOUNDS = regionsData.reduce(
  (bounds, region) => ({
    minX: Math.min(bounds.minX, region.bounds.minX),
    minY: Math.min(bounds.minY, region.bounds.minY),
    maxX: Math.max(bounds.maxX, region.bounds.maxX),
    maxY: Math.max(bounds.maxY, region.bounds.maxY),
  }),
  { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
);
const MAP_RIGHT_EDGE = MAP_OFFSET_X + MAP_BOUNDS.maxX;
const PIECES_AREA_PADDING = 20;

const getScrambledPiecePosition = (region) => {
  const piecesAreaLeft = MAP_RIGHT_EDGE + PIECES_AREA_PADDING;
  const piecesAreaWidth = STAGE_WIDTH - piecesAreaLeft - PIECES_AREA_PADDING;
  const maxX = Math.max(0, piecesAreaWidth - region.bounds.width);
  const maxY = Math.max(
    0,
    STAGE_HEIGHT - region.bounds.height - PIECES_AREA_PADDING * 2,
  );

  return {
    x: piecesAreaLeft + Math.floor(Math.random() * maxX) - region.bounds.minX,
    y:
      PIECES_AREA_PADDING +
      Math.floor(Math.random() * maxY) -
      region.bounds.minY,
  };
};

export default function KSAPuzzleGame() {
  const [pieces, setPieces] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Initialize piece positions to the right of the map silhouette
  useEffect(() => {
    const scrambled = regionsData.map((region) => {
      const position = getScrambledPiecePosition(region);

      return {
        ...region,
        ...position,
        isSnapped: false,
      };
    });

    setPieces(scrambled);
  }, []);

  // Handle Drag End & Exact Snap
  const handleDragEnd = (e, id) => {
    const draggedX = e.target.x();
    const draggedY = e.target.y();

    const distance = Math.hypot(
      draggedX - MAP_OFFSET_X,
      draggedY - MAP_OFFSET_Y,
    );

    setPieces((prevPieces) => {
      const updated = prevPieces.map((piece) => {
        if (piece.id === id) {
          if (distance < SNAP_THRESHOLD) {
            // Find information for this region
            const regionInfo = regionsInfo.find(
              (region) => region.id === piece.id,
            );

            if (regionInfo) {
              setSelectedRegion(regionInfo);
            }

            return {
              ...piece,
              x: MAP_OFFSET_X,
              y: MAP_OFFSET_Y,
              isSnapped: true,
            };
          }

          return {
            ...piece,
            x: draggedX,
            y: draggedY,
          };
        }

        return piece;
      });

      const allSnapped = updated.every((p) => p.isSnapped);

      if (allSnapped) {
        setIsCompleted(true);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      return updated;
    });
  };

  // Bring current active piece to top during drag
  const handleDragStart = (e) => {
    const id = e.target.id();
    setPieces((prevPieces) => {
      const copy = [...prevPieces];
      const index = copy.findIndex((p) => p.id === id);
      if (index > -1) {
        const [item] = copy.splice(index, 1);
        copy.push(item);
      }
      return copy;
    });
  };

  const handleReset = () => {
    setIsCompleted(false);
    setSelectedRegion(null);

    setPieces((prevPieces) =>
      prevPieces.map((region) => {
        const position = getScrambledPiecePosition(region);

        return {
          ...region,
          ...position,
          isSnapped: false,
        };
      }),
    );
  };

  const sortedPieces = [...pieces].sort((firstPiece, secondPiece) => {
    if (firstPiece.isSnapped === secondPiece.isSnapped) {
      return 0;
    }

    return firstPiece.isSnapped ? -1 : 1;
  });

  const arabicRegionNames = new Map(
    regionsInfo.map((region) => [region.id, region.name]),
  );

  return (
    <div
      style={{
        // padding: "20px",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        fontSize: "20px",
        textAlign: "center",
        backgroundImage: `url(${process.env.PUBLIC_URL}${mapSilhouette.backgroundSrc})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "8px 32px",
          boxSizing: "border-box",
        }}
      >
        <img
          src={`${process.env.PUBLIC_URL}/l1.png`}
          alt=""
          style={{ maxHeight: "96px", maxWidth: "42vw", objectFit: "contain" }}
        />
        <div
          style={{
            marginBottom: "15px",
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            alignItems: "center",
          }}
        >
          <h2 style={{ color: "#fff" }}>اليوم الوطني السعودي 96</h2>
          <button
            onClick={handleReset}
            style={{
              padding: "8px 16px",
              backgroundColor: "green",
              opacity: 0.5,
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            ⭯
          </button>
          {isCompleted && (
            <span
              style={{ color: "#16a34a", fontWeight: "bold", fontSize: "24px" }}
            >
              🎉 Great job! Map assembled!
            </span>
          )}
        </div>
        <img
          src={`${process.env.PUBLIC_URL}/l2.png`}
          alt=""
          style={{ maxHeight: "64px", maxWidth: "42vw", objectFit: "contain" }}
        />
      </div>

      {/* <div
        style={{
          marginBottom: "15px",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          alignItems: "center",
        }}
      >
        <h2 style={{ color: "#fff",padding: "10px 0px" }}>Saudi Arabia Regions Puzzle</h2>
        <button
          onClick={handleReset}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          Reset Game
        </button>
        {isCompleted && (
          <span
            style={{ color: "#16a34a", fontWeight: "bold", fontSize: "24px" }}
          >
            🎉 Great job! Map assembled!
          </span>
        )}
      </div> */}

      <div
        style={{
          // border: "2px solid #e5e7eb",
          borderRadius: "8px",
          display: "block",
          width: `${STAGE_WIDTH}px`,
          margin: "0 auto",
          backgroundColor: "transparent",
        }}
      >
        <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT}>
          {/* Layer 1: Centered Target Silhouette Outline */}
          <Layer x={MAP_OFFSET_X} y={MAP_OFFSET_Y}>
            {regionsData.map((region) => (
              <Path
                key={`outline-${region.id}`}
                data={region.path}
                fill="#fff"
                opacity={0.3}
                // stroke="#94a3b8"
                // strokeWidth={1.5}
                // dash={[4, 4]}
              />
            ))}
          </Layer>

          {/* Layer 2: Interactive Puzzle Pieces */}
          <Layer>
            {sortedPieces.map((piece) => (
              <Group
                key={piece.id}
                id={piece.id}
                x={piece.x}
                y={piece.y}
                draggable={!piece.isSnapped}
                onDragStart={handleDragStart}
                onDragEnd={(e) => handleDragEnd(e, piece.id)}
              >
                {/* SVG Region Shape */}
                <Path
                  data={piece.path}
                  fill={piece.isSnapped ? "#22c55e" : piece.fill || "#3b82f6"}
                  stroke="#ffffff"
                  strokeWidth={2}
                  shadowColor="black"
                  shadowBlur={piece.isSnapped ? 0 : 8}
                  shadowOpacity={piece.isSnapped ? 0 : 0.25}
                  shadowOffset={{ x: 3, y: 3 }}
                />

                {/* Region Label at SVG Center Point */}
                <Text
                  text={arabicRegionNames.get(piece.id) || piece.name}
                  x={piece.center.x - 30}
                  y={piece.center.y - 6}
                  fontSize={20}
                  fontStyle="bold"
                  fill={piece.isSnapped ? "#ffffff" : "#1e293b"}
                  align="center"
                  listening={false}
                />
              </Group>
            ))}
          </Layer>
        </Stage>
        {selectedRegion && (
          <div
            style={{
              position: "fixed",
              left: "20px",
              bottom: "20px",
              width: "320px",
              maxHeight: "calc(100vh - 40px)",
              overflowY: "auto",
              padding: "20px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
              textAlign: "right",
              zIndex: 10,
              direction: "rtl",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: "26px",
                color: "#1e293b",
              }}
            >
              {selectedRegion.name}
            </h3>

            <p
              style={{
                margin: "0 0 16px",
                fontSize: "18px",
                lineHeight: "1.6",
                color: "#475569",
              }}
            >
              {selectedRegion.description}
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div>
                <strong>الجغرافيا</strong>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#64748b",
                    fontSize: "20px",
                    lineHeight: "1.5",
                  }}
                >
                  {selectedRegion.geography}
                </p>
              </div>

              <div>
                <strong>التاريخ</strong>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#64748b",
                    fontSize: "20px",
                    lineHeight: "1.5",
                  }}
                >
                  {selectedRegion.history}
                </p>
              </div>

              <div>
                <strong>الثقافة</strong>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#64748b",
                    fontSize: "20px",
                    lineHeight: "1.5",
                  }}
                >
                  {selectedRegion.culture}
                </p>
              </div>

              <div>
                <strong>أبرز المعالم</strong>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#64748b",
                    fontSize: "20px",
                    lineHeight: "1.5",
                  }}
                >
                  {selectedRegion.landmarks}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
