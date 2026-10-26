const SETS = [
  {
    match: ["burger"],
    restaurants: ["Burger Barn", "Patty Lane", "Smash Shack", "Grill House"],
    dishes: ["Classic Smash", "Peri Peri Crunch", "Mushroom Swiss", "Double Cheese"],
  },
  {
    match: ["biryani", "biriyani", "briyani"],
    restaurants: ["Malabar Kitchen", "Dum House", "Royal Biriyani", "Spice Garden"],
    dishes: ["Special Dum", "Family Pack", "Hyderabadi Style", "Chef's Special"],
  },
  {
    match: ["shawarma", "shawai", "kebab"],
    restaurants: ["Arabian Nights", "Shawarma Street", "Kebab Corner", "Al Taza"],
    dishes: ["Chicken Roll", "Plate Shawarma", "Mixed Grill", "Garlic Special"],
  },
  {
    match: ["pizza"],
    restaurants: ["Oven & Co", "Crust Brothers", "Little Italy", "Slice House"],
    dishes: ["Margherita", "Farmhouse", "Pepperoni", "Wood-fired Special"],
  },
  {
    match: ["momo", "dumpling"],
    restaurants: ["Momo Hut", "Himalayan Kitchen", "Steam Street", "Dumpling Den"],
    dishes: ["Steamed Chicken", "Fried Peri Peri", "Cheese Momo", "Tandoori Momo"],
  },
  {
    match: ["ice cream", "icecream", "dessert", "cake", "brownie"],
    restaurants: ["Scoop Station", "Sweet Tooth", "Cold Stone Corner", "Sugar Rush"],
    dishes: ["Death by Chocolate", "Choco Walnut", "Biscoff Special", "Classic Vanilla"],
  },
  {
    match: ["coffee", "chai", "tea"],
    restaurants: ["Bean & Brew", "Corner Cafe", "Chai Point", "Roast House"],
    dishes: ["Cold Coffee", "Masala Chai", "Filter Coffee", "Cappuccino"],
  },
  {
    match: ["noodle", "ramen", "fried rice"],
    restaurants: ["Wok Express", "Noodle Bar", "Dragon House", "Ramen Hub"],
    dishes: ["Hakka Noodles", "Schezwan Fried Rice", "Spicy Ramen", "Chilli Garlic"],
  },
];

const GENERIC = {
  restaurants: ["Your favourite spot", "The corner place", "Local favourite", "Street stall"],
  dishes: ["House special", "Chef's pick", "Spicy version", "The classic"],
};

const NOTES = [
  "What stood out?",
  "How was the flavour?",
  "Would you order it again?",
  "Anything you'd change?",
  "How was the portion and price?",
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function pickHints(categoryName) {
  const key = categoryName.toLowerCase();
  const set = SETS.find((s) => s.match.some((m) => key.includes(m))) || GENERIC;
  return {
    restaurant: pick(set.restaurants),
    dish: pick(set.dishes),
    note: pick(NOTES),
  };
}