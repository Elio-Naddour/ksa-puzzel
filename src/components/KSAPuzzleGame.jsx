import React, { useState, useEffect } from "react";
import { Stage, Layer, Path, Text, Group } from "react-konva";
import confetti from "canvas-confetti";
import { regionsData } from "../data/regions";
import { regionsInfo } from "../data/info";

const SNAP_THRESHOLD = 30; // Generous distance threshold in pixels for smooth snapping
const STAGE_WIDTH = 1700; // Fixed virtual coordinate width
const STAGE_HEIGHT = 900; // Fixed virtual coordinate height

// Centering offset for the map silhouette (Adjust if your SVG paths drift off-center)
const MAP_OFFSET_X = STAGE_WIDTH / 4;
const MAP_OFFSET_Y = 0;

export default function KSAPuzzleGame() {
  const [pieces, setPieces] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Initialize piece positions: half on the left side, half on the right side
  useEffect(() => {
    const scrambled = regionsData.map((region, index) => {
      // Alternate pieces between Left and Right drop zones
      const isLeftSide = index % 2 === 0;

      const randomX = isLeftSide
        ? Math.floor(Math.random() * 200) - 100 // Left zone: X = 20px to 140px
        : Math.floor(Math.random() * 200) + 700; // Right zone: X = 1000px to 1120px

      const randomY = Math.floor(Math.random() * 100) - 50; // Spread across full height

      return {
        ...region,
        x: randomX,
        y: randomY,
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
      prevPieces.map((region, index) => {
        const isLeftSide = index % 2 === 0;

        return {
          ...region,
          x: isLeftSide
            ? Math.floor(Math.random() * 200) - 100
            : Math.floor(Math.random() * 200) + 700,
          y: Math.floor(Math.random() * 100) - 50,
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
        padding: "20px",
        fontFamily: "sans-serif",
        fontSize: "20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          marginBottom: "15px",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          alignItems: "center",
        }}
      >
        <h2>Saudi Arabia Regions Puzzle</h2>
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
      </div>

      <div
        style={{
          border: "2px solid #e5e7eb",
          borderRadius: "8px",
          display: "inline-block",
          backgroundColor: "#f8fafc",
        }}
      >
        <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT}>
          {/* Layer 1: Centered Target Silhouette Outline */}
          <Layer x={MAP_OFFSET_X} y={MAP_OFFSET_Y}>
            {regionsData.map((region) => (
              <Path
                key={`outline-${region.id}`}
                data={region.path}
                fill="#e2e8f0"
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
              position: "absolute",
              left: `${STAGE_WIDTH - 180}px`,
              top: "40px",
              width: "320px",
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
