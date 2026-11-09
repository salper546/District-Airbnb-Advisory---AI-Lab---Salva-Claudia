export const AMENITY_DESCRIPTIONS: Record<string, string> = {
  Wifi: 'High-speed wireless internet connection. A standard foundational expectation for virtually all DC corporate travelers, government consultants, and tourists.',
  Kitchen: 'Full cooking facilities including stove, oven, refrigerator, and cookware. Essential for extended stays and families seeking to prepare meals rather than dine out.',
  Washer: 'In-unit or building clothes washing machine (explicitly distinguished from dishwashers). Highly sought after by families and long-term business guests.',
  Dryer: 'Dedicated clothes drying appliance. Complements washing machines to accommodate corporate rotations and multi-night residential stays.',
  'Air conditioning': 'Central cooling system or designated AC units. A vital amenity for guest comfort during Washington DC’s notoriously humid spring and summer months.',
  'Free parking': 'Dedicated off-street parking, garage stall, or driveway access. A rare and valuable commodity in high-density DC historic corridors where permit street parking is heavily restricted.',
  'Dedicated workspace': 'Desk or dedicated working table with ergonomic seating and electrical access. High-priority feature for DC’s massive influx of remote workers, diplomats, and conference attendees.',
  Pool: 'On-site swimming pool access. A high-end luxury amenity found primarily in upscale modern apartment buildings and select luxury condominiums.',
  Gym: 'Fitness center or private workout equipment on premises. Heavily favored by health-conscious corporate travelers and extended-stay consultants.',
  'Self check-in': 'Keyless keypad, smart lock, or lockbox entry. Enables frictionless, autonomous guest arrivals without coordinating late-night key handoffs.',
  'Pets allowed': 'Listing policy permitting domesticated animals. A restricted supply segment in DC that commands pricing premiums from pet-owning travelers.',
  Dishwasher: 'Built-in automatic kitchen dishwasher. Represents modern, fully updated kitchen fixtures common in upscale urban renovations.',
  Superhost: 'Airbnb designation awarded to top-tier hosts maintaining at least a 4.8 overall rating, 90%+ response rate, and strict reliability without host cancellations.',
  'Instant bookable': 'Enables guests to reserve dates immediately without manual host pre-approval. (In this dataset snapshot, listings require standard booking requests).',
  'Review score ≥ 4.8': 'Elite customer satisfaction tier reflecting exemplary cleanliness, communication accuracy, and verified guest satisfaction.',
  'Min. stay ≤ 2 nights': 'Flexible short-stay threshold (1 to 2 nights maximum minimum). Captures premium-rate weekend getaways and quick weekday government trips.',
};

export function getAmenityDescription(name: string): string {
  return (
    AMENITY_DESCRIPTIONS[name] ||
    'Property feature observed in Washington, DC residential Airbnb listing specifications.'
  );
}
