/**
 * Khung bố cục do Codex (qua BobDad Hub) thiết kế theo luật "1 chính – 1 phụ – nền thoáng":
 * 8 khung ngang 1600x1200 + 8 khung dọc 1200x1600. Toạ độ x, y là TÂM khung vuông của hình;
 * `main`/`companion` giả định hình chưa lật quay mặt sang phải. Dữ liệu sinh từ out/hub/coloring-templates.json.
 */
export interface Slot { x: number; y: number; size: number }
export interface Template {
  id: string;
  mood: string;
  main: Slot & { flip: boolean };
  companion: Slot & { flip: boolean };
  props: (Slot & { slot: 'sun' | 'cloud' | 'flower' | 'tree' | 'star' | 'butterfly' | 'balloon' })[];
  hills: { y: number; amp: number; tilt: number }[];
  clouds: Slot[];
}

export const TEMPLATES: { landscape: Template[]; portrait: Template[] } = {
 "landscape": [
  {
   "id": "landscape-sunny-meadow",
   "mood": "Sunny meadow",
   "main": {
    "x": 548,
    "y": 672,
    "size": 720,
    "flip": false
   },
   "companion": {
    "x": 1138,
    "y": 846,
    "size": 336,
    "flip": true
   },
   "props": [
    {
     "slot": "sun",
     "x": 1264,
     "y": 205,
     "size": 156
    },
    {
     "slot": "butterfly",
     "x": 1088,
     "y": 491,
     "size": 110
    },
    {
     "slot": "balloon",
     "x": 1437,
     "y": 710,
     "size": 100
    }
   ],
   "hills": [
    {
     "y": 950,
     "amp": 25,
     "tilt": 18
    },
    {
     "y": 1110,
     "amp": 22,
     "tilt": -14
    }
   ],
   "clouds": [
    {
     "x": 368,
     "y": 165,
     "size": 200
    },
    {
     "x": 862,
     "y": 185,
     "size": 125
    }
   ]
  },
  {
   "id": "landscape-first-star",
   "mood": "First star",
   "main": {
    "x": 1061,
    "y": 708,
    "size": 704,
    "flip": true
   },
   "companion": {
    "x": 248,
    "y": 801,
    "size": 352,
    "flip": false
   },
   "props": [
    {
     "slot": "star",
     "x": 332,
     "y": 292,
     "size": 138
    },
    {
     "slot": "balloon",
     "x": 558,
     "y": 488,
     "size": 112
    },
    {
     "slot": "butterfly",
     "x": 540,
     "y": 714,
     "size": 106
    }
   ],
   "hills": [
    {
     "y": 905,
     "amp": 23,
     "tilt": -16
    },
    {
     "y": 1030,
     "amp": 19,
     "tilt": 10
    },
    {
     "y": 1131,
     "amp": 14,
     "tilt": -10
    }
   ],
   "clouds": [
    {
     "x": 905,
     "y": 180,
     "size": 214
    },
    {
     "x": 1251,
     "y": 242,
     "size": 132
    }
   ]
  },
  {
   "id": "landscape-orchard-walk",
   "mood": "Orchard walk",
   "main": {
    "x": 522,
    "y": 552,
    "size": 688,
    "flip": false
   },
   "companion": {
    "x": 1327,
    "y": 830,
    "size": 328,
    "flip": true
   },
   "props": [
    {
     "slot": "sun",
     "x": 1342,
     "y": 240,
     "size": 144
    },
    {
     "slot": "tree",
     "x": 1035,
     "y": 992,
     "size": 174
    },
    {
     "slot": "flower",
     "x": 140,
     "y": 1010,
     "size": 100
    },
    {
     "slot": "butterfly",
     "x": 1052,
     "y": 567,
     "size": 106
    }
   ],
   "hills": [
    {
     "y": 735,
     "amp": 31,
     "tilt": 24
    },
    {
     "y": 850,
     "amp": 24,
     "tilt": -16
    },
    {
     "y": 1130,
     "amp": 15,
     "tilt": 10
    }
   ],
   "clouds": [
    {
     "x": 1020,
     "y": 182,
     "size": 208
    }
   ]
  },
  {
   "id": "landscape-balloon-breeze",
   "mood": "Balloon breeze",
   "main": {
    "x": 1070,
    "y": 548,
    "size": 744,
    "flip": true
   },
   "companion": {
    "x": 453,
    "y": 820,
    "size": 352,
    "flip": false
   },
   "props": [
    {
     "slot": "balloon",
     "x": 254,
     "y": 269,
     "size": 148
    },
    {
     "slot": "butterfly",
     "x": 512,
     "y": 494,
     "size": 110
    },
    {
     "slot": "flower",
     "x": 145,
     "y": 1012,
     "size": 112
    }
   ],
   "hills": [
    {
     "y": 764,
     "amp": 27,
     "tilt": -20
    },
    {
     "y": 1116,
     "amp": 18,
     "tilt": -12
    }
   ],
   "clouds": [
    {
     "x": 542,
     "y": 169,
     "size": 184
    }
   ]
  },
  {
   "id": "landscape-wide-blue-sky",
   "mood": "Wide blue sky",
   "main": {
    "x": 814,
    "y": 735,
    "size": 672,
    "flip": true
   },
   "companion": {
    "x": 224,
    "y": 853,
    "size": 320,
    "flip": false
   },
   "props": [
    {
     "slot": "sun",
     "x": 1300,
     "y": 192,
     "size": 160
    },
    {
     "slot": "butterfly",
     "x": 1303,
     "y": 570,
     "size": 118
    },
    {
     "slot": "balloon",
     "x": 290,
     "y": 426,
     "size": 132
    }
   ],
   "hills": [
    {
     "y": 970,
     "amp": 22,
     "tilt": -14
    },
    {
     "y": 1060,
     "amp": 17,
     "tilt": 12
    },
    {
     "y": 1137,
     "amp": 8,
     "tilt": -8
    }
   ],
   "clouds": [
    {
     "x": 483,
     "y": 177,
     "size": 202
    },
    {
     "x": 872,
     "y": 237,
     "size": 136
    }
   ]
  },
  {
   "id": "landscape-shady-grove",
   "mood": "Shady grove",
   "main": {
    "x": 754,
    "y": 475,
    "size": 664,
    "flip": false
   },
   "companion": {
    "x": 1380,
    "y": 812,
    "size": 312,
    "flip": true
   },
   "props": [
    {
     "slot": "tree",
     "x": 244,
     "y": 996,
     "size": 184
    },
    {
     "slot": "flower",
     "x": 1360,
     "y": 1050,
     "size": 94
    },
    {
     "slot": "sun",
     "x": 1362,
     "y": 206,
     "size": 132
    }
   ],
   "hills": [
    {
     "y": 754,
     "amp": 32,
     "tilt": -24
    },
    {
     "y": 853,
     "amp": 20,
     "tilt": 16
    },
    {
     "y": 1134,
     "amp": 12,
     "tilt": -8
    }
   ],
   "clouds": [
    {
     "x": 241,
     "y": 211,
     "size": 190
    },
    {
     "x": 1210,
     "y": 382,
     "size": 112
    }
   ]
  },
  {
   "id": "landscape-golden-afternoon",
   "mood": "Golden afternoon",
   "main": {
    "x": 598,
    "y": 656,
    "size": 752,
    "flip": false
   },
   "companion": {
    "x": 1252,
    "y": 686,
    "size": 352,
    "flip": true
   },
   "props": [
    {
     "slot": "sun",
     "x": 1338,
     "y": 178,
     "size": 148
    },
    {
     "slot": "flower",
     "x": 1343,
     "y": 1010,
     "size": 106
    },
    {
     "slot": "butterfly",
     "x": 1058,
     "y": 411,
     "size": 100
    }
   ],
   "hills": [
    {
     "y": 788,
     "amp": 30,
     "tilt": 20
    },
    {
     "y": 897,
     "amp": 20,
     "tilt": -16
    },
    {
     "y": 1122,
     "amp": 16,
     "tilt": 12
    }
   ],
   "clouds": [
    {
     "x": 480,
     "y": 152,
     "size": 164
    },
    {
     "x": 1245,
     "y": 346,
     "size": 120
    }
   ]
  },
  {
   "id": "landscape-twilight-balloon",
   "mood": "Twilight balloon",
   "main": {
    "x": 1008,
    "y": 710,
    "size": 760,
    "flip": true
   },
   "companion": {
    "x": 262,
    "y": 770,
    "size": 376,
    "flip": false
   },
   "props": [
    {
     "slot": "balloon",
     "x": 260,
     "y": 329,
     "size": 150
    },
    {
     "slot": "star",
     "x": 531,
     "y": 179,
     "size": 118
    }
   ],
   "hills": [
    {
     "y": 890,
     "amp": 32,
     "tilt": 18
    },
    {
     "y": 1135,
     "amp": 10,
     "tilt": -10
    }
   ],
   "clouds": [
    {
     "x": 868,
     "y": 165,
     "size": 174
    },
    {
     "x": 1262,
     "y": 189,
     "size": 118
    }
   ]
  }
 ],
 "portrait": [
  {
   "id": "portrait-sunny-slope",
   "mood": "Sunny slope",
   "main": {
    "x": 512,
    "y": 544,
    "size": 896,
    "flip": false
   },
   "companion": {
    "x": 816,
    "y": 1265,
    "size": 408,
    "flip": true
   },
   "props": [
    {
     "slot": "sun",
     "x": 1064,
     "y": 242,
     "size": 128
    },
    {
     "slot": "butterfly",
     "x": 1067,
     "y": 622,
     "size": 112
    },
    {
     "slot": "balloon",
     "x": 307,
     "y": 1177,
     "size": 148
    }
   ],
   "hills": [
    {
     "y": 1310,
     "amp": 26,
     "tilt": 18
    },
    {
     "y": 1424,
     "amp": 20,
     "tilt": -12
    }
   ],
   "clouds": [
    {
     "x": 1067,
     "y": 416,
     "size": 138
    }
   ]
  },
  {
   "id": "portrait-garden-stroll",
   "mood": "Garden stroll",
   "main": {
    "x": 685,
    "y": 518,
    "size": 880,
    "flip": true
   },
   "companion": {
    "x": 285,
    "y": 1298,
    "size": 448,
    "flip": false
   },
   "props": [
    {
     "slot": "butterfly",
     "x": 142,
     "y": 453,
     "size": 106
    },
    {
     "slot": "tree",
     "x": 840,
     "y": 1280,
     "size": 214
    },
    {
     "slot": "flower",
     "x": 1062,
     "y": 1334,
     "size": 112
    }
   ],
   "hills": [
    {
     "y": 1022,
     "amp": 23,
     "tilt": -18
    },
    {
     "y": 1125,
     "amp": 17,
     "tilt": 12
    },
    {
     "y": 1454,
     "amp": 19,
     "tilt": -16
    }
   ],
   "clouds": [
    {
     "x": 141,
     "y": 228,
     "size": 128
    },
    {
     "x": 146,
     "y": 694,
     "size": 112
    }
   ]
  },
  {
   "id": "portrait-balloon-parade",
   "mood": "Balloon parade",
   "main": {
    "x": 525,
    "y": 1059,
    "size": 920,
    "flip": false
   },
   "companion": {
    "x": 851,
    "y": 278,
    "size": 424,
    "flip": true
   },
   "props": [
    {
     "slot": "sun",
     "x": 251,
     "y": 179,
     "size": 156
    },
    {
     "slot": "balloon",
     "x": 432,
     "y": 448,
     "size": 148
    },
    {
     "slot": "star",
     "x": 264,
     "y": 382,
     "size": 96
    }
   ],
   "hills": [
    {
     "y": 1220,
     "amp": 26,
     "tilt": 18
    },
    {
     "y": 1354,
     "amp": 23,
     "tilt": -16
    },
    {
     "y": 1470,
     "amp": 17,
     "tilt": 12
    }
   ],
   "clouds": [
    {
     "x": 466,
     "y": 196,
     "size": 146
    },
    {
     "x": 1080,
     "y": 750,
     "size": 108
    }
   ]
  },
  {
   "id": "portrait-starlit-garden",
   "mood": "Starlit garden",
   "main": {
    "x": 674,
    "y": 1066,
    "size": 928,
    "flip": true
   },
   "companion": {
    "x": 308,
    "y": 303,
    "size": 450,
    "flip": false
   },
   "props": [
    {
     "slot": "star",
     "x": 756,
     "y": 182,
     "size": 132
    },
    {
     "slot": "butterfly",
     "x": 960,
     "y": 415,
     "size": 116
    },
    {
     "slot": "flower",
     "x": 124,
     "y": 1327,
     "size": 100
    }
   ],
   "hills": [
    {
     "y": 1038,
     "amp": 29,
     "tilt": -20
    },
    {
     "y": 1156,
     "amp": 24,
     "tilt": 14
    },
    {
     "y": 1430,
     "amp": 17,
     "tilt": -10
    }
   ],
   "clouds": [
    {
     "x": 1012,
     "y": 200,
     "size": 188
    },
    {
     "x": 712,
     "y": 421,
     "size": 118
    }
   ]
  },
  {
   "id": "portrait-evening-balloon",
   "mood": "Evening balloon",
   "main": {
    "x": 573,
    "y": 517,
    "size": 888,
    "flip": true
   },
   "companion": {
    "x": 293,
    "y": 1264,
    "size": 432,
    "flip": false
   },
   "props": [
    {
     "slot": "star",
     "x": 1094,
     "y": 532,
     "size": 88
    },
    {
     "slot": "balloon",
     "x": 701,
     "y": 1209,
     "size": 140
    },
    {
     "slot": "butterfly",
     "x": 947,
     "y": 1252,
     "size": 108
    }
   ],
   "hills": [
    {
     "y": 1360,
     "amp": 26,
     "tilt": 16
    },
    {
     "y": 1464,
     "amp": 20,
     "tilt": -16
    }
   ],
   "clouds": [
    {
     "x": 1095,
     "y": 277,
     "size": 88
    },
    {
     "x": 920,
     "y": 1063,
     "size": 128
    }
   ]
  },
  {
   "id": "portrait-sunshine-butterfly",
   "mood": "Sunshine and a butterfly",
   "main": {
    "x": 617,
    "y": 1061,
    "size": 936,
    "flip": false
   },
   "companion": {
    "x": 913,
    "y": 278,
    "size": 424,
    "flip": true
   },
   "props": [
    {
     "slot": "sun",
     "x": 205,
     "y": 183,
     "size": 148
    },
    {
     "slot": "butterfly",
     "x": 368,
     "y": 397,
     "size": 128
    }
   ],
   "hills": [
    {
     "y": 1112,
     "amp": 38,
     "tilt": 26
    },
    {
     "y": 1284,
     "amp": 27,
     "tilt": -18
    },
    {
     "y": 1440,
     "amp": 17,
     "tilt": 14
    }
   ],
   "clouds": [
    {
     "x": 469,
     "y": 162,
     "size": 146
    }
   ]
  },
  {
   "id": "portrait-under-the-tree",
   "mood": "Under the tree",
   "main": {
    "x": 523,
    "y": 531,
    "size": 912,
    "flip": false
   },
   "companion": {
    "x": 911,
    "y": 1313,
    "size": 440,
    "flip": true
   },
   "props": [
    {
     "slot": "flower",
     "x": 519,
     "y": 1262,
     "size": 122
    },
    {
     "slot": "tree",
     "x": 234,
     "y": 1270,
     "size": 196
    },
    {
     "slot": "butterfly",
     "x": 1068,
     "y": 517,
     "size": 112
    }
   ],
   "hills": [
    {
     "y": 1029,
     "amp": 22,
     "tilt": 14
    },
    {
     "y": 1124,
     "amp": 18,
     "tilt": -10
    },
    {
     "y": 1430,
     "amp": 26,
     "tilt": 18
    }
   ],
   "clouds": [
    {
     "x": 1075,
     "y": 247,
     "size": 126
    }
   ]
  },
  {
   "id": "portrait-cloud-drift",
   "mood": "Cloud drift",
   "main": {
    "x": 697,
    "y": 1081,
    "size": 880,
    "flip": true
   },
   "companion": {
    "x": 316,
    "y": 319,
    "size": 496,
    "flip": false
   },
   "props": [
    {
     "slot": "balloon",
     "x": 769,
     "y": 449,
     "size": 152
    },
    {
     "slot": "sun",
     "x": 983,
     "y": 171,
     "size": 144
    },
    {
     "slot": "butterfly",
     "x": 1032,
     "y": 478,
     "size": 110
    }
   ],
   "hills": [
    {
     "y": 1264,
     "amp": 25,
     "tilt": -16
    },
    {
     "y": 1385,
     "amp": 21,
     "tilt": 12
    },
    {
     "y": 1487,
     "amp": 15,
     "tilt": -10
    }
   ],
   "clouds": [
    {
     "x": 716,
     "y": 165,
     "size": 168
    },
    {
     "x": 1035,
     "y": 328,
     "size": 106
    }
   ]
  }
 ]
};
