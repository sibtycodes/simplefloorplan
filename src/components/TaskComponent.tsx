import React, { useEffect, useRef, useState } from 'react';

interface Point {
  X: number;
  Y: number;
  Z: number;
}

interface Door {
  Location: Point;
  Rotation: number;
  Width: number;
}

interface Furniture {
  MinBound: Point;
  MaxBound: Point;
  equipName: string;
  xPlacement: number;
  yPlacement: number;
  rotation: number;
}

interface FloorPlanData {
  Regions: [Point, Point][];
  Doors: Door[];
  Furnitures: Furniture[];
}

const floorplanData: FloorPlanData = {
  Regions: [
    [
      { X: 0, Y: 0, Z: 52.49343832020996 },
      { X: 38.27436931869327, Y: 34.868392433523155, Z: 52.49343832020996 },
    ],
    [
      { X: 0, Y: 100, Z: 52.49343832020996 },
      { X: 55.65625908245986, Y: 34.86839243352309, Z: 52.49343832020996 },
    ],
    [
      { X: 100, Y: 100, Z: 52.49343832020996 },
      { X: 55.656259082459876, Y: 44.38282812906108, Z: 52.49343832020996 },
    ],
    [
      { X: 100, Y: 0, Z: 52.49343832020996 },
      { X: 38.27436931869315, Y: 44.38282812906114, Z: 52.49343832020996 },
    ],
  ],
  Doors: [
    {
      Location: { X: 38.11032732394258, Y: 37.32902235448528, Z: 52.49343832020996 },
      Rotation: 4.712388980384696,
      Width: 4.284776902887138,
    },
  ],
  Furnitures: [
    {
      MinBound: { X: -10, Y: -20, Z: -2.4868995751603507e-14 },
      MaxBound: { X: 10, Y: 20, Z: 2.7887139107611625 },
      equipName: "Equipment 1",
      xPlacement: 0,
      yPlacement: 0,
      rotation: 1.5707963267948966,
    },
    {
      MinBound: { X: -1.416666666666667, Y: -1.8501516343696665, Z: -2.6645352591003757e-15 },
      MaxBound: { X: 1.4166666666666665, Y: 1.2500000000000004, Z: 7.083333333333304 },
      equipName: "Equipment 2",
      xPlacement: 39.69103598405127,
      yPlacement: 42.96309243717516,
      rotation: 3.141592653589793,
    },
    {
      MinBound: { X: -0.6118766404199494, Y: -1.2729658792650858, Z: -4.440892098500626e-16 },
      MaxBound: { X: 0.6118766404199577, Y: 0.6364829396325504, Z: 3.2972440944882178 },
      equipName: "Equipment 3",
      xPlacement: 42.64820625787592,
      yPlacement: 43.86914569417966,
      rotation: 3.141592653589793,
    },
  ],
};

export default function ImprovedFloorPlanViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredEquipment, setHoveredEquipment] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const calculateBoundsAndScale = () => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      // Calculate bounds including furniture
      floorplanData.Regions.forEach(region => {
        region.forEach(point => {
          minX = Math.min(minX, point.X);
          minY = Math.min(minY, point.Y);
          maxX = Math.max(maxX, point.X);
          maxY = Math.max(maxY, point.Y);
        });
      });

      floorplanData.Furnitures.forEach(furniture => {
        minX = Math.min(minX, furniture.xPlacement + furniture.MinBound.X);
        minY = Math.min(minY, furniture.yPlacement + furniture.MinBound.Y);
        maxX = Math.max(maxX, furniture.xPlacement + furniture.MaxBound.X);
        maxY = Math.max(maxY, furniture.yPlacement + furniture.MaxBound.Y);
      });

      const width = maxX - minX;
      const height = maxY - minY;
      const scale = Math.min(canvas.width / width, canvas.height / height) * 0.9;

      return {
        bounds: { minX, minY, maxX, maxY },
        scale,
        offset: {
          x: (canvas.width - width * scale) / 2 - minX * scale,
          y: (canvas.height - height * scale) / 2 - minY * scale
        }
      };
    };

    const { bounds, scale, offset } = calculateBoundsAndScale();

    const transform = (x: number, y: number) => [
      x * scale + offset.x,
      y * scale + offset.y
    ];

    const drawFloorPlan = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw regions (walls)
      ctx.beginPath();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      floorplanData.Regions.forEach((region, index) => {
        const [startX, startY] = transform(region[0].X, region[0].Y);
        if (index === 0) {
          ctx.moveTo(startX, startY);
        } else {
          ctx.lineTo(startX, startY);
        }
      });
      ctx.closePath();
      ctx.stroke();

      // Draw doors
      ctx.fillStyle = '#8B4513';
      floorplanData.Doors.forEach(door => {
        ctx.save();
        const [x, y] = transform(door.Location.X, door.Location.Y);
        ctx.translate(x, y);
        ctx.rotate(door.Rotation);
        ctx.fillRect(-door.Width * scale / 2, -2, door.Width * scale, 4);
        ctx.restore();
      });

      // Draw furniture
      floorplanData.Furnitures.forEach(furniture => {
        ctx.save();
        const [x, y] = transform(furniture.xPlacement, furniture.yPlacement);
        ctx.translate(x, y);
        ctx.rotate(furniture.rotation);
        const width = (furniture.MaxBound.X - furniture.MinBound.X) * scale;
        const height = (furniture.MaxBound.Y - furniture.MinBound.Y) * scale;
        ctx.fillStyle = 'rgba(0, 128, 255, 0.5)';
        ctx.fillRect(-width / 2, -height / 2, width, height);
        ctx.restore();
      });
    };

    drawFloorPlan();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - offset.x) / scale;
      const y = (event.clientY - rect.top - offset.y) / scale;

      const hoveredFurniture = floorplanData.Furnitures.find(furniture => {
        const dx = x - furniture.xPlacement;
        const dy = y - furniture.yPlacement;
        const rotatedX = dx * Math.cos(-furniture.rotation) - dy * Math.sin(-furniture.rotation);
        const rotatedY = dx * Math.sin(-furniture.rotation) + dy * Math.cos(-furniture.rotation);
        const width = furniture.MaxBound.X - furniture.MinBound.X;
        const height = furniture.MaxBound.Y - furniture.MinBound.Y;
        return Math.abs(rotatedX) < width / 2 && Math.abs(rotatedY) < height / 2;
      });

      setHoveredEquipment(hoveredFurniture ? hoveredFurniture.equipName : null);
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="relative bg-white">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-gray-300"
      />
      {hoveredEquipment && (
        <div className="hoverbox">
          {hoveredEquipment}
        </div>
      )}
    </div>
  );
}