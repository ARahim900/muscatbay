
export interface WaterZone {
  name: string;
  consumption: number;
  loss: number;
}

export interface WaterData {
  total: {
    consumption: number;
    loss: number;
  };
  zones: WaterZone[];
}

export const waterData: WaterData = {
  total: {
    consumption: 48234,
    loss: 2892,
  },
  zones: [
    {
      name: "Residential",
      consumption: 21450,
      loss: 1072,
    },
    {
      name: "Commercial",
      consumption: 14780,
      loss: 739,
    },
    {
      name: "Landscape",
      consumption: 9860,
      loss: 892,
    },
    {
      name: "Amenities",
      consumption: 2144,
      loss: 189,
    },
  ],
};
