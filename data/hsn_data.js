// Pre-loaded HSN/SAC Codes for common Indian goods & services
const HSN_DATA = [
  {
    "id": 1,
    "hsn": "0101",
    "desc": "Live horses, asses, mules and hinnies",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 2,
    "hsn": "0201",
    "desc": "Meat of bovine animals, fresh or chilled",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 3,
    "hsn": "0401",
    "desc": "Milk and cream",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 4,
    "hsn": "0701",
    "desc": "Potatoes, fresh or chilled",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 5,
    "hsn": "0702",
    "desc": "Tomatoes, fresh or chilled",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 6,
    "hsn": "0703",
    "desc": "Onions, shallots, garlic, leeks",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 7,
    "hsn": "0901",
    "desc": "Coffee, not roasted",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 8,
    "hsn": "1001",
    "desc": "Wheat and meslin",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 9,
    "hsn": "1006",
    "desc": "Rice",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 10,
    "hsn": "1101",
    "desc": "Wheat or meslin flour (Atta)",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 11,
    "hsn": "1901",
    "desc": "Malt extract; food preparations of flour (not packaged)",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 12,
    "hsn": "2201",
    "desc": "Water, natural mineral water",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 13,
    "hsn": "2404",
    "desc": "Fresh vegetables NEC",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 14,
    "hsn": "4901",
    "desc": "Printed books",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 15,
    "hsn": "4902",
    "desc": "Newspapers, journals and periodicals",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 16,
    "hsn": "0902",
    "desc": "Tea, whether or not flavoured",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 17,
    "hsn": "1502",
    "desc": "Fats of bovine/sheep/goat",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 18,
    "hsn": "1701",
    "desc": "Cane or beet sugar",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 19,
    "hsn": "2101",
    "desc": "Extracts, essences and concentrates of coffee/tea",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 20,
    "hsn": "2106",
    "desc": "Food preparations NEC (packed)",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 21,
    "hsn": "2501",
    "desc": "Salt; sulphur; earths and stone",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 22,
    "hsn": "2709",
    "desc": "Petroleum oils, crude",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 23,
    "hsn": "3004",
    "desc": "Medicaments (packed for retail sale)",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 24,
    "hsn": "3005",
    "desc": "Wadding, gauze, bandages",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 25,
    "hsn": "3401",
    "desc": "Soap; organic surface-active products",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 26,
    "hsn": "3406",
    "desc": "Candles, tapers and similar",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 27,
    "hsn": "3926",
    "desc": "Other articles of plastics",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 28,
    "hsn": "4015",
    "desc": "Articles of apparel & clothing accessories of rubber",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 29,
    "hsn": "4818",
    "desc": "Toilet paper, handkerchiefs, cleansing tissues",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 30,
    "hsn": "5007",
    "desc": "Woven fabrics of silk",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 31,
    "hsn": "5111",
    "desc": "Woven fabrics of carded wool",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 32,
    "hsn": "5208",
    "desc": "Woven fabrics of cotton (<=85%)",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 33,
    "hsn": "5407",
    "desc": "Woven fabrics of synthetic filament yarn",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 34,
    "hsn": "6101",
    "desc": "Men's overcoats, car-coats etc of knit fabric",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 35,
    "hsn": "6201",
    "desc": "Men's overcoats, car-coats of woven fabric",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 36,
    "hsn": "6401",
    "desc": "Waterproof footwear with outer soles of rubber",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 37,
    "hsn": "6402",
    "desc": "Other footwear with outer soles and uppers of rubber",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 38,
    "hsn": "7101",
    "desc": "Pearls, natural or cultured",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 39,
    "hsn": "8413",
    "desc": "Pumps for liquids; liquid elevators",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 40,
    "hsn": "8502",
    "desc": "Electric generating sets and rotary converters",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 41,
    "hsn": "8517",
    "desc": "Telephone sets including smartphones",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 42,
    "hsn": "9619",
    "desc": "Sanitary towels (pads) and tampons",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 43,
    "hsn": "0803",
    "desc": "Bananas, including plantains, fresh or dried",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 44,
    "hsn": "1302",
    "desc": "Vegetable saps and extracts",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 45,
    "hsn": "1601",
    "desc": "Sausages and similar products of meat",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 46,
    "hsn": "1602",
    "desc": "Other prepared or preserved meat",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 47,
    "hsn": "1704",
    "desc": "Sugar confectionery (excluding chewing gum)",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 48,
    "hsn": "1806",
    "desc": "Chocolate and other food preparations containing cocoa",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 49,
    "hsn": "1902",
    "desc": "Pasta, whether or not cooked (noodles, vermicelli)",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 50,
    "hsn": "1905",
    "desc": "Bread, pastry, cakes, biscuits",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 51,
    "hsn": "2202",
    "desc": "Waters including mineral waters, sweetened",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 52,
    "hsn": "2204",
    "desc": "Wine of fresh grapes",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 53,
    "hsn": "2208",
    "desc": "Spirits, liqueurs and other spirituous beverages",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 54,
    "hsn": "2402",
    "desc": "Cigars, cheroots, cigarillos and cigarettes",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 55,
    "hsn": "3002",
    "desc": "Human blood; vaccines, toxins, cultures",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 56,
    "hsn": "3301",
    "desc": "Essential oils (terpeneless or not)",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 57,
    "hsn": "3303",
    "desc": "Perfumes and toilet waters",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 58,
    "hsn": "3304",
    "desc": "Beauty or make-up preparations",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 59,
    "hsn": "3305",
    "desc": "Preparations for use on the hair",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 60,
    "hsn": "3306",
    "desc": "Preparations for oral or dental hygiene",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 61,
    "hsn": "3307",
    "desc": "Pre-shave, shaving or after-shave preparations",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 62,
    "hsn": "3808",
    "desc": "Insecticides, rodenticides, disinfectants",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 63,
    "hsn": "3916",
    "desc": "Monofilament of plastics",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 64,
    "hsn": "4007",
    "desc": "Vulcanised rubber thread and cord",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 65,
    "hsn": "4008",
    "desc": "Plates, sheets, strip, rods and profile shapes of rubber",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 66,
    "hsn": "4811",
    "desc": "Paper, paperboard, cellulose cotton coated",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 67,
    "hsn": "4819",
    "desc": "Cartons, boxes, cases, bags of paper or paperboard",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 68,
    "hsn": "4820",
    "desc": "Registers, account books, notebooks, diaries",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 69,
    "hsn": "6109",
    "desc": "T-shirts, singlets and other vests, knitted",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 70,
    "hsn": "6110",
    "desc": "Jerseys, pullovers, sweatshirts, waistcoats",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 71,
    "hsn": "6203",
    "desc": "Men's suits, ensembles, jackets, blazers",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 72,
    "hsn": "6204",
    "desc": "Women's suits, ensembles, jackets, blazers",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 73,
    "hsn": "6301",
    "desc": "Blankets and travelling rugs",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 74,
    "hsn": "6302",
    "desc": "Bed linen, table linen, toilet linen",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 75,
    "hsn": "7113",
    "desc": "Articles of jewellery and parts thereof",
    "gst": 3,
    "type": "goods"
  },
  {
    "id": 76,
    "hsn": "7114",
    "desc": "Articles of goldsmiths' or silversmiths' wares",
    "gst": 3,
    "type": "goods"
  },
  {
    "id": 77,
    "hsn": "7208",
    "desc": "Flat-rolled products of iron or non-alloy steel",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 78,
    "hsn": "7210",
    "desc": "Flat-rolled products of iron clad, plated or coated",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 79,
    "hsn": "7213",
    "desc": "Bars and rods of iron or non-alloy steel",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 80,
    "hsn": "7214",
    "desc": "Other bars and rods of iron or non-alloy steel",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 81,
    "hsn": "7215",
    "desc": "Other bars and rods of iron or non-alloy steel",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 82,
    "hsn": "7216",
    "desc": "Angles, shapes and sections of iron or non-alloy steel",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 83,
    "hsn": "7217",
    "desc": "Wire of iron or non-alloy steel",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 84,
    "hsn": "7304",
    "desc": "Tubes, pipes and hollow profiles of iron (seamless)",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 85,
    "hsn": "7306",
    "desc": "Tubes, pipes and hollow profiles of iron (welded)",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 86,
    "hsn": "7312",
    "desc": "Stranded wire, ropes, cables of iron or steel",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 87,
    "hsn": "7318",
    "desc": "Screws, bolts, nuts, coach screws",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 88,
    "hsn": "7323",
    "desc": "Table, kitchen or other household articles of iron or steel",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 89,
    "hsn": "7407",
    "desc": "Copper bars, rods and profiles",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 90,
    "hsn": "7408",
    "desc": "Copper wire",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 91,
    "hsn": "7606",
    "desc": "Aluminium plates, sheets and strip",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 92,
    "hsn": "7608",
    "desc": "Aluminium tubes and pipes",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 93,
    "hsn": "8301",
    "desc": "Padlocks and locks (key, combination or electrically operated)",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 94,
    "hsn": "8302",
    "desc": "Base metal mountings, fittings and similar articles",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 95,
    "hsn": "8414",
    "desc": "Air or vacuum pumps, air or other gas compressors",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 96,
    "hsn": "8415",
    "desc": "Air conditioning machines",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 97,
    "hsn": "8418",
    "desc": "Refrigerators, freezers and other refrigerating equipment",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 98,
    "hsn": "8422",
    "desc": "Dish washing machines; machinery for cleaning bottles",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 99,
    "hsn": "8450",
    "desc": "Household-type washing machines",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 100,
    "hsn": "8471",
    "desc": "Automatic data processing machines (computers)",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 101,
    "hsn": "8472",
    "desc": "Other office machines (printers, copiers)",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 102,
    "hsn": "8504",
    "desc": "Electrical transformers, static converters and inductors",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 103,
    "hsn": "8507",
    "desc": "Electric accumulators, including separators",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 104,
    "hsn": "8516",
    "desc": "Electric instantaneous water heaters, hair dryers",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 105,
    "hsn": "8523",
    "desc": "Discs, tapes, solid-state non-volatile storage devices",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 106,
    "hsn": "8525",
    "desc": "Transmission apparatus for radio-broadcasting or TV",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 107,
    "hsn": "8528",
    "desc": "Monitors and projectors; television receivers",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 108,
    "hsn": "8537",
    "desc": "Boards, panels, consoles, desks, cabinets for electric control",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 109,
    "hsn": "8544",
    "desc": "Insulated wire, cable and other insulated electric conductors",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 110,
    "hsn": "8703",
    "desc": "Motor cars and other motor vehicles (passenger)",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 111,
    "hsn": "8704",
    "desc": "Motor vehicles for transport of goods (trucks)",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 112,
    "hsn": "8711",
    "desc": "Motorcycles (including mopeds)",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 113,
    "hsn": "9006",
    "desc": "Photographic cameras; flash apparatus",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 114,
    "hsn": "9021",
    "desc": "Orthopaedic appliances; artificial body parts",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 115,
    "hsn": "9403",
    "desc": "Other furniture and parts thereof",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 116,
    "hsn": "9404",
    "desc": "Mattress supports; mattresses, quilts, eiderdowns",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 117,
    "hsn": "9503",
    "desc": "Tricycles, scooters, pedal cars and similar wheeled toys",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 118,
    "hsn": "9504",
    "desc": "Video game consoles and machines",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 119,
    "hsn": "9506",
    "desc": "Articles and equipment for general physical exercise",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 120,
    "hsn": "2710",
    "desc": "Petroleum oils (not crude)",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 121,
    "hsn": "2711",
    "desc": "Petroleum gases and other gaseous hydrocarbons",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 122,
    "hsn": "3201",
    "desc": "Tanning extracts of vegetable origin",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 123,
    "hsn": "3403",
    "desc": "Lubricating preparations",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 124,
    "hsn": "3809",
    "desc": "Finishing agents, dye carriers",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 125,
    "hsn": "3814",
    "desc": "Organic composite solvents and thinners",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 126,
    "hsn": "3824",
    "desc": "Prepared binders for foundry moulds; chemical products NEC",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 127,
    "hsn": "3901",
    "desc": "Polymers of ethylene, in primary forms",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 128,
    "hsn": "3902",
    "desc": "Polymers of propylene, in primary forms",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 129,
    "hsn": "3907",
    "desc": "Polyacetals, other polyethers in primary forms",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 130,
    "hsn": "3917",
    "desc": "Tubes, pipes and hoses, and fittings thereof, of plastics",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 131,
    "hsn": "3920",
    "desc": "Other plates, sheets, film of plastics (non-cellular)",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 132,
    "hsn": "3921",
    "desc": "Other plates, sheets, film of plastics (cellular)",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 133,
    "hsn": "4002",
    "desc": "Synthetic rubber and factice derived from oils",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 134,
    "hsn": "4009",
    "desc": "Tubes, pipes and hoses of vulcanised rubber",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 135,
    "hsn": "4011",
    "desc": "New pneumatic tyres of rubber",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 136,
    "hsn": "4016",
    "desc": "Other articles of vulcanised rubber",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 137,
    "hsn": "4107",
    "desc": "Leather further prepared after tanning",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 138,
    "hsn": "4202",
    "desc": "Trunks, suit-cases, vanity-cases, handbags",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 139,
    "hsn": "4407",
    "desc": "Wood sawn or chipped lengthwise, sliced or peeled",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 140,
    "hsn": "4415",
    "desc": "Packing cases, boxes, crates, drums, pallets of wood",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 141,
    "hsn": "4801",
    "desc": "Newsprint in rolls or sheets",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 142,
    "hsn": "4802",
    "desc": "Uncoated paper and paperboard for writing/printing",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 143,
    "hsn": "4803",
    "desc": "Toilet or facial tissue stock, towel/napkin stock of paper",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 144,
    "hsn": "4805",
    "desc": "Other uncoated paper and paperboard",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 145,
    "hsn": "5201",
    "desc": "Cotton, not carded or combed",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 146,
    "hsn": "5501",
    "desc": "Synthetic filament tow",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 147,
    "hsn": "5601",
    "desc": "Wadding of textile materials and articles thereof",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 148,
    "hsn": "6309",
    "desc": "Worn clothing and other worn articles",
    "gst": 0,
    "type": "goods"
  },
  {
    "id": 149,
    "hsn": "6802",
    "desc": "Worked monumental or building stone",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 150,
    "hsn": "6901",
    "desc": "Bricks, blocks, tiles of siliceous fossil meals",
    "gst": 5,
    "type": "goods"
  },
  {
    "id": 151,
    "hsn": "6902",
    "desc": "Refractory bricks, blocks, tiles and similar refractory ceramic constructional goods",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 152,
    "hsn": "6907",
    "desc": "Unglazed ceramic flags and paving, hearth or wall tiles",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 153,
    "hsn": "6908",
    "desc": "Glazed ceramic flags and paving, hearth or wall tiles",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 154,
    "hsn": "6910",
    "desc": "Ceramic sinks, wash basins, baths, bidets, WC pans",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 155,
    "hsn": "7001",
    "desc": "Cullet and other waste and scrap of glass",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 156,
    "hsn": "7005",
    "desc": "Float glass and surface ground or polished glass",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 157,
    "hsn": "7010",
    "desc": "Carboys, bottles, flasks, jars of glass",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 158,
    "hsn": "2402",
    "desc": "Cigars and cigarettes of tobacco",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 159,
    "hsn": "2403",
    "desc": "Other manufactured tobacco and tobacco substitutes",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 160,
    "hsn": "2707",
    "desc": "Oils and other products of distillation of coal tar",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 161,
    "hsn": "9954",
    "desc": "Construction services",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 162,
    "hsn": "9961",
    "desc": "Services in wholesale trade",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 163,
    "hsn": "9962",
    "desc": "Services in retail trade",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 164,
    "hsn": "9971",
    "desc": "Financial and related services",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 165,
    "hsn": "9972",
    "desc": "Real estate services",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 166,
    "hsn": "9973",
    "desc": "Leasing or rental services",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 167,
    "hsn": "9981",
    "desc": "Research and development services",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 168,
    "hsn": "9982",
    "desc": "Legal and accounting services",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 169,
    "hsn": "9983",
    "desc": "Other professional, technical and business services",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 170,
    "hsn": "9984",
    "desc": "Telecommunications, broadcasting and IT services",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 171,
    "hsn": "9985",
    "desc": "Support services (cleaning, security, packaging)",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 172,
    "hsn": "9986",
    "desc": "Support services to agriculture",
    "gst": 0,
    "type": "service"
  },
  {
    "id": 173,
    "hsn": "9987",
    "desc": "Maintenance, repair and installation services",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 174,
    "hsn": "9988",
    "desc": "Manufacturing services on physical inputs owned by others",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 175,
    "hsn": "9989",
    "desc": "Other manufacturing services",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 176,
    "hsn": "9991",
    "desc": "Public administration and other government services",
    "gst": 0,
    "type": "service"
  },
  {
    "id": 177,
    "hsn": "9992",
    "desc": "Education services",
    "gst": 0,
    "type": "service"
  },
  {
    "id": 178,
    "hsn": "9993",
    "desc": "Human health and social care services",
    "gst": 0,
    "type": "service"
  },
  {
    "id": 179,
    "hsn": "9994",
    "desc": "Sewage and waste collection, treatment and disposal",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 180,
    "hsn": "9995",
    "desc": "Services of membership organisations",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 181,
    "hsn": "9996",
    "desc": "Recreational, cultural and sporting services",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 182,
    "hsn": "9997",
    "desc": "Other services",
    "gst": 18,
    "type": "service"
  },
  {
    "id": 183,
    "hsn": "9998",
    "desc": "Domestic services",
    "gst": 0,
    "type": "service"
  },
  {
    "id": 184,
    "hsn": "9999",
    "desc": "Services provided by extraterritorial organisations",
    "gst": 0,
    "type": "service"
  },
  {
    "id": 185,
    "hsn": "8471",
    "desc": "Computers, Laptops, Tablets",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 186,
    "hsn": "8443",
    "desc": "Printers, Photocopiers, Fax machines",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 187,
    "hsn": "8519",
    "desc": "Sound recording or reproducing apparatus",
    "gst": 28,
    "type": "goods"
  },
  {
    "id": 188,
    "hsn": "8531",
    "desc": "Electric sound or visual signalling apparatus",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 189,
    "hsn": "8536",
    "desc": "Electrical apparatus for switching/protecting electrical circuits",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 190,
    "hsn": "9021",
    "desc": "Medical appliances, prosthetics",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 191,
    "hsn": "9022",
    "desc": "X-ray apparatus; medical imaging equipment",
    "gst": 12,
    "type": "goods"
  },
  {
    "id": 192,
    "hsn": "9025",
    "desc": "Thermometers; barometers; hygrometers",
    "gst": 18,
    "type": "goods"
  },
  {
    "id": 193,
    "hsn": "9026",
    "desc": "Instruments for measuring flow, level, pressure",
    "gst": 18,
    "type": "goods"
  }
];

// Indian States with GST State Codes
const INDIA_STATES = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman & Diu" },
  { code: "26", name: "Dadra & Nagar Haveli" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman & Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh (new)" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
  { code: "99", name: "Centre Jurisdiction" },
];

// UOM (Units of Measurement) as per GST
const UOM_LIST = [
  { code: "BAG", name: "Bags" },
  { code: "BAL", name: "Bale" },
  { code: "BDL", name: "Bundles" },
  { code: "BKL", name: "Buckles" },
  { code: "BOU", name: "Billion of Units" },
  { code: "BOX", name: "Box" },
  { code: "BTL", name: "Bottles" },
  { code: "BUN", name: "Bunches" },
  { code: "CAN", name: "Cans" },
  { code: "CBM", name: "Cubic Meter" },
  { code: "CCM", name: "Cubic Centimeter" },
  { code: "CMS", name: "Centimeter" },
  { code: "CTN", name: "Cartons" },
  { code: "DOZ", name: "Dozen" },
  { code: "DRM", name: "Drum" },
  { code: "GGK", name: "Great Gross" },
  { code: "GMS", name: "Grams" },
  { code: "GRS", name: "Gross" },
  { code: "GYD", name: "Gross Yards" },
  { code: "KGS", name: "Kilograms" },
  { code: "KLR", name: "Kiloliter" },
  { code: "KME", name: "Kilometre" },
  { code: "LTR", name: "Litres" },
  { code: "MLT", name: "Millilitre" },
  { code: "MTR", name: "Meters" },
  { code: "MTS", name: "Metric Ton" },
  { code: "NOS", name: "Numbers" },
  { code: "OTH", name: "Others" },
  { code: "PAC", name: "Packs" },
  { code: "PCS", name: "Pieces" },
  { code: "PRS", name: "Pairs" },
  { code: "QTL", name: "Quintal" },
  { code: "ROL", name: "Rolls" },
  { code: "SET", name: "Sets" },
  { code: "SQF", name: "Square Feet" },
  { code: "SQM", name: "Square Meters" },
  { code: "SQY", name: "Square Yards" },
  { code: "TBS", name: "Tablets" },
  { code: "TGM", name: "Ten Gross" },
  { code: "THD", name: "Thousands" },
  { code: "TON", name: "Tonnes" },
  { code: "TUB", name: "Tubes" },
  { code: "UGS", name: "US Gallons" },
  { code: "UNT", name: "Units" },
  { code: "YDS", name: "Yards" },
];

// GST Rate options
const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];
