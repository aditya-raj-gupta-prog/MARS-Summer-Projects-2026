"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
// ── Mess Menu Data ────────────────────────────────────────────────────────────
const MENU_DATA = {
    // ── Rajendra ──────────────────────────────────────────────────────────────
    Rajendra: {
        Monday: {
            Breakfast: ["Aloo Paratha", "Pickle", "Dahi (Curd)", "Tea / Coffee"],
            Lunch: ["Rajma", "Jeera Rice", "Chapati", "Green Salad", "Boondi Raita"],
            Snacks: ["Samosa (2 pcs)", "Tomato Ketchup", "Tea"],
            Dinner: ["Paneer Butter Masala", "Dal Tadka", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Poha", "Sev", "Green Chutney", "Banana", "Tea / Coffee"],
            Lunch: ["Chole", "Bhature", "Onion Salad", "Lassi"],
            Snacks: ["Bread Pakora", "Green Chutney", "Tea"],
            Dinner: ["Aloo Matar", "Moong Dal", "Steamed Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Upma", "Peanuts", "Banana", "Tea / Coffee"],
            Lunch: ["Kadai Vegetable", "Dal Fry", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Veg Cutlet", "Ketchup", "Tea"],
            Dinner: ["Matar Paneer", "Dal Makhani", "Jeera Rice", "Chapati", "Papad"],
        },
        Thursday: {
            Breakfast: ["Aloo Puri", "Chana Masala", "Tea / Coffee"],
            Lunch: ["Mixed Veg", "Yellow Dal", "Steamed Rice", "Chapati", "Green Salad"],
            Snacks: ["Pav Bhaji", "Butter", "Tea"],
            Dinner: ["Shahi Paneer", "Dal Makhani", "Tandoori Roti", "Steamed Rice", "Sweet (Gulab Jamun)"],
        },
        Friday: {
            Breakfast: ["Besan Chilla", "Green Chutney", "Banana", "Tea / Coffee"],
            Lunch: ["Veg Pulao", "Raita", "Chapati", "Papad", "Pickle"],
            Snacks: ["Aloo Tikki (2 pcs)", "Chaat Masala", "Tea"],
            Dinner: ["Veg Biryani", "Boondi Raita", "Chapati", "Sweet (Kheer)"],
        },
        Saturday: {
            Breakfast: ["Chole Bhature", "Onion", "Tea / Coffee"],
            Lunch: ["Paneer Tikka Masala", "Dal Tadka", "Jeera Rice", "Chapati", "Salad"],
            Snacks: ["Bread Omelette / Maggi", "Tea"],
            Dinner: ["Veg Kofta", "Palak Dal", "Steamed Rice", "Naan", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Aloo Paratha", "Chole", "Dahi", "Mango Pickle", "Tea / Coffee"],
            Lunch: ["Paneer Lababdar", "Dal Makhani", "Dum Aloo", "Steamed Rice", "Puri", "Raita", "Sweet (Halwa)"],
            Snacks: ["Fruit Chaat", "Cold Coffee"],
            Dinner: ["Veg Dum Biryani", "Paneer Gravy", "Boondi Raita", "Chapati", "Kheer"],
        },
    },
    // ── Cautley ───────────────────────────────────────────────────────────────
    Cautley: {
        Monday: {
            Breakfast: ["Upma", "Peanuts", "Boiled Egg (opt.)", "Tea / Coffee"],
            Lunch: ["Dal Fry", "Aloo Gobhi", "Steamed Rice", "Chapati", "Onion Salad"],
            Snacks: ["Veg Momos (6 pcs)", "Schezwan Sauce", "Tea"],
            Dinner: ["Egg Curry / Paneer Masala", "Dal Tadka", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Paratha (Mixed)", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Kadai Paneer", "Jeera Rice", "Chapati", "Salad", "Raita"],
            Snacks: ["Samosa Chaat", "Tea"],
            Dinner: ["Aloo Palak", "Masoor Dal", "Steamed Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Poori Sabzi", "Aloo Ki Sabzi", "Tea / Coffee"],
            Lunch: ["Veg Kofta", "Dal Makhani", "Steamed Rice", "Chapati", "Boondi Raita"],
            Snacks: ["Bhel Puri", "Sev", "Tea"],
            Dinner: ["Chole Masala", "Puri", "Boondi Raita", "Jalebi"],
        },
        Thursday: {
            Breakfast: ["Oats Porridge", "Toast", "Butter & Jam", "Banana", "Tea / Coffee"],
            Lunch: ["Aloo Matar", "Arhar Dal", "Steamed Rice", "Chapati", "Pickle"],
            Snacks: ["French Fries", "Ketchup", "Tea"],
            Dinner: ["Paneer Tikka Masala", "Dal Makhani", "Naan", "Jeera Rice", "Gulab Jamun"],
        },
        Friday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Mix Veg", "Yellow Dal", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Poha", "Sev", "Tea"],
            Dinner: ["Veg Biryani", "Boondi Raita", "Chapati", "Papad", "Sweet (Kheer)"],
        },
        Saturday: {
            Breakfast: ["Aloo Paratha", "White Butter", "Dahi", "Tea / Coffee"],
            Lunch: ["Paneer Bhurji", "Aloo Jeera", "Steamed Rice", "Chapati", "Dal"],
            Snacks: ["Dahi Puri", "Tea"],
            Dinner: ["Shahi Paneer", "Veg Pulao", "Raita", "Naan", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Chole Bhature", "Onion & Pickle", "Lassi", "Tea / Coffee"],
            Lunch: ["Veg Dum Biryani", "Paneer Gravy", "Dal Makhani", "Raita", "Chapati", "Sweet (Gajar Halwa)"],
            Snacks: ["Cold Coffee", "Biscuits"],
            Dinner: ["Malai Kofta", "Palak Paneer", "Naan", "Steamed Rice", "Phirni"],
        },
    },
    // ── Radhakrishnan ─────────────────────────────────────────────────────────
    Radhakrishnan: {
        Monday: {
            Breakfast: ["Poori Sabzi", "Aloo Ki Sabzi", "Banana", "Tea / Coffee"],
            Lunch: ["Rajma Masala", "Steamed Rice", "Chapati", "Pickle", "Salad"],
            Snacks: ["Kachori (2 pcs)", "Tamarind Chutney", "Tea"],
            Dinner: ["Aloo Matar", "Dal Tadka", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Upma", "Peanuts", "Coriander Chutney", "Tea / Coffee"],
            Lunch: ["Chole Bhature", "Lassi", "Onion Pickle"],
            Snacks: ["Samosa (2 pcs)", "Green Chutney", "Tea"],
            Dinner: ["Paneer Masala", "Moong Dal", "Jeera Rice", "Chapati", "Raita"],
        },
        Wednesday: {
            Breakfast: ["Gobi Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Dal Tadka", "Aloo Jeera", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Samosa (2 pcs)", "Green Chutney", "Tea"],
            Dinner: ["Veg Korma", "Chapati", "Steamed Rice", "Dal Fry", "Papad"],
        },
        Thursday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Mixed Veg Curry", "Dal Fry", "Steamed Rice", "Chapati", "Boondi Raita"],
            Snacks: ["Aloo Tikki (2 pcs)", "Mint Chutney", "Tea"],
            Dinner: ["Shahi Paneer", "Dal Makhani", "Steamed Rice", "Naan", "Jalebi"],
        },
        Friday: {
            Breakfast: ["Methi Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Veg Pulao", "Raita", "Chapati", "Papad", "Aloo Sabzi"],
            Snacks: ["Bread Pakora", "Ketchup", "Tea"],
            Dinner: ["Paneer Tikka Masala", "Jeera Rice", "Chapati", "Raita", "Sweet (Kheer)"],
        },
        Saturday: {
            Breakfast: ["Poori Sabzi", "Aloo Ki Sabzi", "Tea / Coffee"],
            Lunch: ["Veg Pulao", "Raita", "Chapati", "Dal", "Salad"],
            Snacks: ["Namkeen", "Tea / Coffee"],
            Dinner: ["Methi Malai Matar", "Dal Makhani", "Naan", "Steamed Rice", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Chole Bhature", "Lassi", "Pickle", "Tea / Coffee"],
            Lunch: ["Veg Dum Biryani", "Boondi Raita", "Dal Makhani", "Chapati", "Sweet (Gajar Halwa)"],
            Snacks: ["Aloo Tikki Chaat", "Tea"],
            Dinner: ["Paneer Lababdar", "Dal Makhani", "Veg Pulao", "Naan", "Kheer"],
        },
    },
    // ── Govind ────────────────────────────────────────────────────────────────
    Govind: {
        Monday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Green Chutney", "Tea / Coffee"],
            Lunch: ["Dal Makhani", "Jeera Rice", "Chapati", "Aloo Sabzi", "Salad"],
            Snacks: ["Bread Pakora (2 pcs)", "Ketchup", "Tea"],
            Dinner: ["Palak Paneer", "Toor Dal", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Poha", "Peanuts", "Sev", "Lemon", "Tea / Coffee"],
            Lunch: ["Chole Masala", "Puri", "Onion Salad", "Raita"],
            Snacks: ["Veg Cutlet", "Mustard Sauce", "Tea"],
            Dinner: ["Aloo Gobhi", "Masoor Dal", "Steamed Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Upma", "Peanuts", "Toast", "Tea / Coffee"],
            Lunch: ["Matar Paneer", "Dal Fry", "Jeera Rice", "Chapati", "Raita"],
            Snacks: ["Pani Puri", "Tamarind Water", "Tea"],
            Dinner: ["Kadai Veg", "Dal Tadka", "Steamed Rice", "Chapati", "Gulab Jamun"],
        },
        Thursday: {
            Breakfast: ["Sprouts Bhel", "Toast", "Peanut Butter", "Milk / Tea"],
            Lunch: ["Veg Biryani", "Raita", "Chapati", "Salad"],
            Snacks: ["Samosa Chaat", "Tea"],
            Dinner: ["Paneer Tikka Masala", "Dal Makhani", "Naan", "Steamed Rice", "Phirni"],
        },
        Friday: {
            Breakfast: ["Besan Chilla", "Pudina Chutney", "Tea / Coffee"],
            Lunch: ["Mix Veg Curry", "Yellow Dal", "Steamed Rice", "Chapati", "Boondi Raita"],
            Snacks: ["Aloo Tikki Chaat", "Tea"],
            Dinner: ["Matar Mushroom", "Arhar Dal", "Veg Pulao", "Chapati", "Sweet (Kheer)"],
        },
        Saturday: {
            Breakfast: ["Gobi Paratha", "White Butter", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Shahi Paneer", "Dal Fry", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Pav Bhaji", "Butter", "Tea"],
            Dinner: ["Paneer Pasanda", "Dal Makhani", "Naan", "Steamed Rice", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Chole Bhature", "Lassi", "Onion Pickle", "Tea / Coffee"],
            Lunch: ["Dum Aloo", "Paneer Tikka Masala", "Dal Makhani", "Puri", "Jeera Rice", "Raita", "Sweet (Halwa)"],
            Snacks: ["Fruit Salad", "Cold Coffee"],
            Dinner: ["Veg Dum Biryani", "Boondi Raita", "Chapati", "Mirchi Bajji", "Kheer"],
        },
    },
    // ── Jawahar ───────────────────────────────────────────────────────────────
    Jawahar: {
        Monday: {
            Breakfast: ["Vegetable Sandwich", "Butter", "Green Chutney", "Boiled Egg (opt.)", "Tea / Coffee"],
            Lunch: ["Dal Fry", "Aloo Jeera", "Steamed Rice", "Chapati", "Onion Salad"],
            Snacks: ["Maggi Noodles", "Tea"],
            Dinner: ["Paneer Masala", "Dal Tadka", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Oats Upma", "Banana", "Tea / Coffee"],
            Lunch: ["Rajma Masala", "Jeera Rice", "Chapati", "Raita", "Salad"],
            Snacks: ["Veg Momos (6 pcs)", "Schezwan Sauce", "Tea"],
            Dinner: ["Aloo Matar", "Moong Dal", "Steamed Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Paneer Bhurji", "Dal Makhani", "Steamed Rice", "Chapati", "Boondi Raita"],
            Snacks: ["Bhel Puri", "Sev", "Tamarind Chutney", "Tea"],
            Dinner: ["Chole Masala", "Puri", "Jalebi", "Raita"],
        },
        Thursday: {
            Breakfast: ["Methi Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Mix Veg Curry", "Arhar Dal", "Steamed Rice", "Chapati", "Salad"],
            Snacks: ["French Fries", "Ketchup", "Tea"],
            Dinner: ["Kadai Paneer", "Dal Makhani", "Naan", "Steamed Rice", "Gulab Jamun"],
        },
        Friday: {
            Breakfast: ["Poori Bhaji", "Aloo Sabzi", "Tea / Coffee"],
            Lunch: ["Veg Pulao", "Raita", "Chapati", "Dal Fry", "Papad"],
            Snacks: ["Bread Omelette / Veg Sandwich", "Tea"],
            Dinner: ["Shahi Paneer", "Veg Biryani", "Boondi Raita", "Chapati", "Sweet (Kheer)"],
        },
        Saturday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Paneer Tikka Masala", "Dal Fry", "Jeera Rice", "Chapati", "Salad"],
            Snacks: ["Dahi Bhalle", "Imli Chutney", "Tea"],
            Dinner: ["Malai Kofta", "Palak Dal", "Naan", "Steamed Rice", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Chole Bhature", "Lassi", "Pickle", "Tea / Coffee"],
            Lunch: ["Veg Dum Biryani", "Matar Paneer", "Dal Makhani", "Puri", "Raita", "Sweet (Gajar Halwa)"],
            Snacks: ["Samosa Chaat", "Cold Coffee"],
            Dinner: ["Paneer Lababdar", "Dal Makhani", "Veg Pulao", "Naan", "Phirni"],
        },
    },
    // ── Rajiv ─────────────────────────────────────────────────────────────────
    Rajiv: {
        Monday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Rajma", "Jeera Rice", "Chapati", "Green Salad", "Raita"],
            Snacks: ["Samosa (2 pcs)", "Green Chutney", "Tea"],
            Dinner: ["Dal Tadka", "Aloo Jeera", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Poha", "Sev", "Peanuts", "Tea / Coffee"],
            Lunch: ["Paneer Masala", "Steamed Rice", "Chapati", "Dal Fry", "Raita"],
            Snacks: ["Bread Pakora", "Ketchup", "Tea"],
            Dinner: ["Aloo Gobhi", "Moong Dal", "Steamed Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Gobi Paratha", "White Butter", "Dahi", "Tea / Coffee"],
            Lunch: ["Chole", "Puri", "Onion Salad", "Lassi"],
            Snacks: ["Veg Momos (6 pcs)", "Schezwan Sauce", "Tea"],
            Dinner: ["Kadai Paneer", "Dal Makhani", "Steamed Rice", "Chapati", "Papad"],
        },
        Thursday: {
            Breakfast: ["Methi Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Mix Veg", "Yellow Dal", "Steamed Rice", "Chapati", "Salad"],
            Snacks: ["Pav Bhaji", "Butter", "Tea"],
            Dinner: ["Shahi Paneer", "Arhar Dal", "Jeera Rice", "Chapati", "Gulab Jamun"],
        },
        Friday: {
            Breakfast: ["Besan Chilla", "Pudina Chutney", "Tea / Coffee"],
            Lunch: ["Veg Pulao", "Raita", "Chapati", "Papad"],
            Snacks: ["Maggi Noodles", "Tea"],
            Dinner: ["Matar Paneer", "Dal Tadka", "Steamed Rice", "Chapati", "Sweet (Kheer)"],
        },
        Saturday: {
            Breakfast: ["Poori Sabzi", "Aloo Ki Sabzi", "Tea / Coffee"],
            Lunch: ["Paneer Bhurji", "Aloo Jeera", "Dal Fry", "Steamed Rice", "Chapati"],
            Snacks: ["Aloo Tikki Chaat (2 pcs)", "Tea"],
            Dinner: ["Paneer Tikka Masala", "Dal Makhani", "Naan", "Steamed Rice", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Chole Bhature", "Lassi", "Pickle", "Tea / Coffee"],
            Lunch: ["Dum Aloo", "Paneer Lababdar", "Dal Makhani", "Steamed Rice", "Puri", "Raita", "Sweet (Halwa)"],
            Snacks: ["Fruit Chaat", "Cold Coffee"],
            Dinner: ["Veg Dum Biryani", "Paneer Gravy", "Raita", "Chapati", "Kheer"],
        },
    },
    // ── Azad ──────────────────────────────────────────────────────────────────
    Azad: {
        Monday: {
            Breakfast: ["Poori Sabzi", "Chana Masala", "Tea / Coffee"],
            Lunch: ["Dal Makhani", "Aloo Gobhi", "Steamed Rice", "Chapati", "Salad"],
            Snacks: ["Kachori (2 pcs)", "Tamarind Chutney", "Tea"],
            Dinner: ["Palak Paneer", "Dal Tadka", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Matar Paneer", "Jeera Rice", "Chapati", "Raita"],
            Snacks: ["Veg Cutlet", "Mustard Sauce", "Tea"],
            Dinner: ["Aloo Matar", "Masoor Dal", "Steamed Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Moong Dal Chilla", "Pudina Chutney", "Tea / Coffee"],
            Lunch: ["Rajma", "Steamed Rice", "Chapati", "Onion Salad", "Raita"],
            Snacks: ["Bhel Puri", "Sev", "Tea"],
            Dinner: ["Chole Masala", "Puri", "Boondi Raita", "Jalebi"],
        },
        Thursday: {
            Breakfast: ["Upma", "Peanuts", "Banana", "Tea / Coffee"],
            Lunch: ["Kadai Veg", "Dal Fry", "Steamed Rice", "Chapati", "Pickle"],
            Snacks: ["Samosa Chaat", "Tea"],
            Dinner: ["Paneer Tikka Masala", "Dal Makhani", "Naan", "Jeera Rice", "Gulab Jamun"],
        },
        Friday: {
            Breakfast: ["Aloo Paratha", "White Butter", "Lassi"],
            Lunch: ["Mix Veg", "Yellow Dal", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["French Fries", "Ketchup", "Tea"],
            Dinner: ["Matar Mushroom", "Arhar Dal", "Jeera Rice", "Chapati", "Sweet (Kheer)"],
        },
        Saturday: {
            Breakfast: ["Gobi Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Shahi Paneer", "Dal Fry", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Pav Bhaji", "Butter", "Tea"],
            Dinner: ["Paneer Pasanda", "Dal Makhani", "Naan", "Steamed Rice", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Chole Bhature", "Lassi", "Onion", "Tea / Coffee"],
            Lunch: ["Veg Dum Biryani", "Matar Paneer", "Dal Makhani", "Puri", "Raita", "Sweet (Gajar Halwa)"],
            Snacks: ["Samosa Chaat", "Cold Coffee"],
            Dinner: ["Paneer Lababdar", "Veg Pulao", "Naan", "Chapati", "Phirni"],
        },
    },
    // ── Ravindra ──────────────────────────────────────────────────────────────
    Ravindra: {
        Monday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Rajma", "Steamed Rice", "Chapati", "Boondi Raita", "Salad"],
            Snacks: ["Bread Pakora (2 pcs)", "Ketchup", "Tea"],
            Dinner: ["Paneer Masala", "Dal Tadka", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Poha", "Peanuts", "Sev", "Tea / Coffee"],
            Lunch: ["Chole Bhature", "Onion Salad", "Lassi"],
            Snacks: ["Veg Momos (6 pcs)", "Schezwan Sauce", "Tea"],
            Dinner: ["Aloo Palak", "Moong Dal", "Steamed Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Methi Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Matar Paneer", "Dal Fry", "Jeera Rice", "Chapati", "Raita"],
            Snacks: ["Aloo Tikki (2 pcs)", "Mint Chutney", "Tea"],
            Dinner: ["Kadai Veg", "Dal Makhani", "Steamed Rice", "Chapati", "Gulab Jamun"],
        },
        Thursday: {
            Breakfast: ["Upma", "Peanuts", "Banana", "Tea / Coffee"],
            Lunch: ["Mix Veg", "Arhar Dal", "Steamed Rice", "Chapati", "Salad"],
            Snacks: ["Pav Bhaji", "Butter", "Tea"],
            Dinner: ["Shahi Paneer", "Dal Makhani", "Jeera Rice", "Naan", "Jalebi"],
        },
        Friday: {
            Breakfast: ["Aloo Puri", "Chana Masala", "Tea / Coffee"],
            Lunch: ["Veg Pulao", "Raita", "Chapati", "Dal Fry", "Papad"],
            Snacks: ["Maggi Noodles", "Tea"],
            Dinner: ["Palak Paneer", "Toor Dal", "Steamed Rice", "Chapati", "Sweet (Kheer)"],
        },
        Saturday: {
            Breakfast: ["Paneer Paratha", "Dahi", "Ketchup", "Tea / Coffee"],
            Lunch: ["Paneer Tikka Masala", "Dal Tadka", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Dahi Bhalle", "Imli Chutney", "Tea"],
            Dinner: ["Veg Kofta", "Dal Makhani", "Naan", "Steamed Rice", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Chole Bhature", "Lassi", "Pickle", "Tea / Coffee"],
            Lunch: ["Dum Aloo", "Dal Makhani", "Paneer Lababdar", "Steamed Rice", "Puri", "Raita", "Sweet (Halwa)"],
            Snacks: ["Fruit Chaat", "Cold Coffee"],
            Dinner: ["Veg Dum Biryani", "Boondi Raita", "Chapati", "Shahi Tukda"],
        },
    },
    // ── Ganga ─────────────────────────────────────────────────────────────────
    Ganga: {
        Monday: {
            Breakfast: ["Besan Chilla", "Green Chutney", "Tea / Coffee"],
            Lunch: ["Dal Makhani", "Aloo Sabzi", "Jeera Rice", "Chapati", "Salad"],
            Snacks: ["Samosa (2 pcs)", "Ketchup", "Tea"],
            Dinner: ["Paneer Butter Masala", "Dal Tadka", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Chole Masala", "Steamed Rice", "Chapati", "Onion Salad", "Raita"],
            Snacks: ["Bread Pakora", "Green Chutney", "Tea"],
            Dinner: ["Aloo Matar", "Masoor Dal", "Steamed Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Gobi Paratha", "White Butter", "Dahi", "Tea / Coffee"],
            Lunch: ["Rajma", "Steamed Rice", "Chapati", "Boondi Raita"],
            Snacks: ["Bhel Puri", "Sev", "Tea"],
            Dinner: ["Matar Paneer", "Dal Makhani", "Jeera Rice", "Chapati", "Papad"],
        },
        Thursday: {
            Breakfast: ["Poha", "Sev", "Lemon", "Tea / Coffee"],
            Lunch: ["Mix Veg", "Yellow Dal", "Steamed Rice", "Chapati", "Salad"],
            Snacks: ["Pav Bhaji", "Butter", "Tea"],
            Dinner: ["Kadai Paneer", "Arhar Dal", "Steamed Rice", "Naan", "Gulab Jamun"],
        },
        Friday: {
            Breakfast: ["Moong Dal Chilla", "Pudina Chutney", "Tea / Coffee"],
            Lunch: ["Veg Pulao", "Raita", "Chapati", "Papad"],
            Snacks: ["Veg Momos (6 pcs)", "Schezwan Sauce", "Tea"],
            Dinner: ["Aloo Palak", "Toor Dal", "Steamed Rice", "Chapati", "Sweet (Kheer)"],
        },
        Saturday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Mango Pickle", "Tea / Coffee"],
            Lunch: ["Shahi Paneer", "Dal Fry", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Aloo Tikki Chaat", "Tea"],
            Dinner: ["Paneer Tikka Masala", "Dal Makhani", "Naan", "Steamed Rice", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Chole Bhature", "Lassi", "Onion", "Tea / Coffee"],
            Lunch: ["Paneer Lababdar", "Dal Makhani", "Dum Aloo", "Puri", "Steamed Rice", "Raita", "Sweet (Halwa)"],
            Snacks: ["Fruit Chaat", "Cold Coffee"],
            Dinner: ["Veg Dum Biryani", "Boondi Raita", "Naan", "Kheer"],
        },
    },
    // ── Himalaya ──────────────────────────────────────────────────────────────
    Himalaya: {
        Monday: {
            Breakfast: ["Aloo Paratha", "Pickle", "Dahi", "Tea / Coffee"],
            Lunch: ["Rajma", "Jeera Rice", "Chapati", "Salad", "Raita"],
            Snacks: ["Kachori (2 pcs)", "Green Chutney", "Tea"],
            Dinner: ["Palak Paneer", "Moong Dal", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Poha", "Peanuts", "Sev", "Tea / Coffee"],
            Lunch: ["Dal Fry", "Aloo Gobhi", "Steamed Rice", "Chapati", "Salad"],
            Snacks: ["Bread Pakora", "Ketchup", "Tea"],
            Dinner: ["Matar Mushroom", "Arhar Dal", "Jeera Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Upma", "Peanuts", "Toast", "Tea / Coffee"],
            Lunch: ["Kadai Veg", "Dal Makhani", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Samosa Chaat", "Tea"],
            Dinner: ["Aloo Palak", "Masoor Dal", "Steamed Rice", "Chapati", "Gulab Jamun"],
        },
        Thursday: {
            Breakfast: ["Methi Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Chole Bhature", "Onion", "Lassi"],
            Snacks: ["Pav Bhaji", "Butter", "Tea"],
            Dinner: ["Shahi Paneer", "Dal Makhani", "Tandoori Roti", "Steamed Rice", "Sweet (Kheer)"],
        },
        Friday: {
            Breakfast: ["Besan Chilla", "Pudina Chutney", "Tea / Coffee"],
            Lunch: ["Mix Veg", "Yellow Dal", "Steamed Rice", "Chapati", "Pickle"],
            Snacks: ["Maggi Noodles", "Tea"],
            Dinner: ["Paneer Tikka Masala", "Dal Tadka", "Naan", "Steamed Rice", "Sweet (Kheer)"],
        },
        Saturday: {
            Breakfast: ["Gobi Paratha", "White Butter", "Dahi", "Tea / Coffee"],
            Lunch: ["Paneer Bhurji", "Aloo Jeera", "Dal", "Steamed Rice", "Chapati"],
            Snacks: ["Dahi Bhalle", "Imli Chutney", "Tea"],
            Dinner: ["Malai Kofta", "Dal Makhani", "Naan", "Steamed Rice", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Chole Bhature", "Lassi", "Pickle", "Tea / Coffee"],
            Lunch: ["Paneer Lababdar", "Dum Aloo", "Dal Makhani", "Steamed Rice", "Puri", "Raita", "Sweet (Gajar Halwa)"],
            Snacks: ["Samosa Chaat", "Cold Coffee"],
            Dinner: ["Veg Dum Biryani", "Boondi Raita", "Chapati", "Phirni"],
        },
    },
    // ── Arawali ───────────────────────────────────────────────────────────────
    Arawali: {
        Monday: {
            Breakfast: ["Paneer Paratha", "Dahi", "Green Chutney", "Tea / Coffee"],
            Lunch: ["Dal Makhani", "Aloo Jeera", "Steamed Rice", "Chapati", "Salad"],
            Snacks: ["Veg Momos (6 pcs)", "Schezwan Sauce", "Tea"],
            Dinner: ["Matar Paneer", "Dal Tadka", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Poha", "Sev", "Peanuts", "Tea / Coffee"],
            Lunch: ["Chole Masala", "Steamed Rice", "Chapati", "Onion Salad", "Raita"],
            Snacks: ["Samosa (2 pcs)", "Tamarind Chutney", "Tea"],
            Dinner: ["Aloo Gobhi", "Moong Dal", "Steamed Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Upma", "Peanuts", "Banana", "Tea / Coffee"],
            Lunch: ["Kadai Paneer", "Dal Fry", "Jeera Rice", "Chapati", "Raita"],
            Snacks: ["Aloo Tikki (2 pcs)", "Ketchup", "Tea"],
            Dinner: ["Rajma", "Dal Makhani", "Steamed Rice", "Naan", "Papad"],
        },
        Thursday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Mix Veg", "Arhar Dal", "Steamed Rice", "Chapati", "Salad"],
            Snacks: ["French Fries", "Ketchup", "Tea"],
            Dinner: ["Shahi Paneer", "Dal Makhani", "Naan", "Steamed Rice", "Gulab Jamun"],
        },
        Friday: {
            Breakfast: ["Moong Dal Chilla", "Pudina Chutney", "Tea / Coffee"],
            Lunch: ["Veg Pulao", "Raita", "Chapati", "Dal", "Papad"],
            Snacks: ["Bhel Puri", "Sev", "Tea"],
            Dinner: ["Kadai Veg", "Masoor Dal", "Steamed Rice", "Chapati", "Sweet (Kheer)"],
        },
        Saturday: {
            Breakfast: ["Chole Bhature", "Lassi", "Tea / Coffee"],
            Lunch: ["Paneer Tikka Masala", "Dal Fry", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Pav Bhaji", "Butter", "Tea"],
            Dinner: ["Malai Kofta", "Dal Makhani", "Naan", "Steamed Rice", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Gobi Paratha", "White Butter", "Dahi", "Mango Pickle", "Tea / Coffee"],
            Lunch: ["Dum Aloo", "Paneer Lababdar", "Dal Makhani", "Puri", "Steamed Rice", "Raita", "Sweet (Halwa)"],
            Snacks: ["Fruit Chaat", "Cold Coffee"],
            Dinner: ["Veg Dum Biryani", "Paneer Gravy", "Boondi Raita", "Chapati", "Kheer"],
        },
    },
    // ── Sarojini (Girls' Hostel) ───────────────────────────────────────────────
    Sarojini: {
        Monday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Dal Tadka", "Aloo Matar", "Steamed Rice", "Chapati", "Salad"],
            Snacks: ["Samosa (2 pcs)", "Green Chutney", "Tea"],
            Dinner: ["Palak Paneer", "Dal Fry", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Poha", "Sev", "Banana", "Tea / Coffee"],
            Lunch: ["Chole Masala", "Puri", "Onion Salad", "Raita"],
            Snacks: ["Bread Pakora", "Ketchup", "Tea"],
            Dinner: ["Aloo Gobhi", "Moong Dal", "Jeera Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Upma", "Peanuts", "Toast", "Tea / Coffee"],
            Lunch: ["Rajma", "Steamed Rice", "Chapati", "Boondi Raita"],
            Snacks: ["Aloo Tikki (2 pcs)", "Pudina Chutney", "Tea"],
            Dinner: ["Matar Paneer", "Dal Makhani", "Steamed Rice", "Chapati", "Jalebi"],
        },
        Thursday: {
            Breakfast: ["Gobi Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Kadai Veg", "Yellow Dal", "Steamed Rice", "Chapati", "Salad"],
            Snacks: ["Pav Bhaji", "Butter", "Tea"],
            Dinner: ["Shahi Paneer", "Arhar Dal", "Naan", "Steamed Rice", "Gulab Jamun"],
        },
        Friday: {
            Breakfast: ["Besan Chilla", "Green Chutney", "Tea / Coffee"],
            Lunch: ["Mix Veg", "Dal Fry", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Maggi Noodles", "Tea"],
            Dinner: ["Paneer Tikka Masala", "Dal Tadka", "Jeera Rice", "Chapati", "Sweet (Kheer)"],
        },
        Saturday: {
            Breakfast: ["Paneer Paratha", "Dahi", "Ketchup", "Tea / Coffee"],
            Lunch: ["Matar Paneer", "Dal Makhani", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Dahi Bhalle", "Imli Chutney", "Tea"],
            Dinner: ["Veg Kofta", "Palak Dal", "Naan", "Steamed Rice", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Chole Bhature", "Lassi", "Pickle", "Tea / Coffee"],
            Lunch: ["Dum Aloo", "Paneer Lababdar", "Dal Makhani", "Puri", "Steamed Rice", "Raita", "Sweet (Halwa)"],
            Snacks: ["Fruit Chaat", "Cold Coffee"],
            Dinner: ["Veg Dum Biryani", "Boondi Raita", "Naan", "Kheer"],
        },
    },
    // ── Kasturba (Girls' Hostel) ───────────────────────────────────────────────
    Kasturba: {
        Monday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Rajma", "Jeera Rice", "Chapati", "Salad", "Raita"],
            Snacks: ["Bread Pakora", "Ketchup", "Tea"],
            Dinner: ["Aloo Matar", "Dal Tadka", "Steamed Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Upma", "Peanuts", "Banana", "Tea / Coffee"],
            Lunch: ["Kadai Paneer", "Steamed Rice", "Chapati", "Dal", "Raita"],
            Snacks: ["Samosa (2 pcs)", "Green Chutney", "Tea"],
            Dinner: ["Palak Paneer", "Masoor Dal", "Jeera Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Poori Sabzi", "Aloo Ki Sabzi", "Tea / Coffee"],
            Lunch: ["Chole Bhature", "Lassi", "Onion Salad"],
            Snacks: ["Aloo Tikki (2 pcs)", "Mint Chutney", "Tea"],
            Dinner: ["Kadai Veg", "Dal Makhani", "Steamed Rice", "Chapati", "Gulab Jamun"],
        },
        Thursday: {
            Breakfast: ["Moong Dal Chilla", "Pudina Chutney", "Tea / Coffee"],
            Lunch: ["Mix Veg", "Yellow Dal", "Steamed Rice", "Chapati", "Salad"],
            Snacks: ["Veg Momos (6 pcs)", "Schezwan Sauce", "Tea"],
            Dinner: ["Shahi Paneer", "Arhar Dal", "Naan", "Steamed Rice", "Sweet (Kheer)"],
        },
        Friday: {
            Breakfast: ["Aloo Paratha", "White Butter", "Dahi", "Tea / Coffee"],
            Lunch: ["Veg Pulao", "Raita", "Chapati", "Dal", "Papad"],
            Snacks: ["Bhel Puri", "Sev", "Tea"],
            Dinner: ["Paneer Tikka Masala", "Dal Tadka", "Jeera Rice", "Chapati", "Jalebi"],
        },
        Saturday: {
            Breakfast: ["Gobi Paratha", "Dahi", "Mango Pickle", "Tea / Coffee"],
            Lunch: ["Paneer Bhurji", "Aloo Jeera", "Dal Fry", "Steamed Rice", "Chapati"],
            Snacks: ["Pav Bhaji", "Butter", "Tea"],
            Dinner: ["Malai Kofta", "Dal Makhani", "Naan", "Steamed Rice", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Chole Bhature", "Lassi", "Onion", "Tea / Coffee"],
            Lunch: ["Paneer Lababdar", "Dal Makhani", "Dum Aloo", "Puri", "Steamed Rice", "Raita", "Sweet (Gajar Halwa)"],
            Snacks: ["Fruit Chaat", "Cold Coffee"],
            Dinner: ["Veg Dum Biryani", "Boondi Raita", "Naan", "Phirni"],
        },
    },
    // ── EWS (Employee Welfare Scheme) ─────────────────────────────────────────
    EWS: {
        Monday: {
            Breakfast: ["Aloo Paratha", "Dahi", "Mixed Pickle", "Tea / Coffee"],
            Lunch: ["Dal Makhani", "Kadai Paneer", "Steamed Rice", "Chapati", "Salad", "Raita"],
            Snacks: ["Veg Sandwich", "Tea / Coffee"],
            Dinner: ["Shahi Paneer", "Dal Tadka", "Jeera Rice", "Chapati", "Papad"],
        },
        Tuesday: {
            Breakfast: ["Poha", "Sev", "Peanuts", "Tea / Coffee"],
            Lunch: ["Rajma", "Aloo Jeera", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Samosa (2 pcs)", "Green Chutney", "Tea"],
            Dinner: ["Matar Paneer", "Masoor Dal", "Steamed Rice", "Chapati", "Pickle"],
        },
        Wednesday: {
            Breakfast: ["Gobi Paratha", "White Butter", "Dahi", "Tea / Coffee"],
            Lunch: ["Chole Bhature", "Onion Salad", "Lassi"],
            Snacks: ["Bread Pakora", "Ketchup", "Tea"],
            Dinner: ["Palak Paneer", "Dal Makhani", "Jeera Rice", "Naan", "Gulab Jamun"],
        },
        Thursday: {
            Breakfast: ["Aloo Puri", "Chana Masala", "Tea / Coffee"],
            Lunch: ["Mix Veg", "Yellow Dal", "Steamed Rice", "Chapati", "Boondi Raita"],
            Snacks: ["Pav Bhaji", "Butter", "Tea"],
            Dinner: ["Paneer Tikka Masala", "Dal Makhani", "Tandoori Roti", "Steamed Rice", "Sweet (Kheer)"],
        },
        Friday: {
            Breakfast: ["Methi Paratha", "Dahi", "Pickle", "Tea / Coffee"],
            Lunch: ["Veg Pulao", "Raita", "Chapati", "Dal Fry", "Papad"],
            Snacks: ["Veg Cutlet", "Mustard Sauce", "Tea"],
            Dinner: ["Aloo Matar", "Arhar Dal", "Steamed Rice", "Chapati", "Jalebi"],
        },
        Saturday: {
            Breakfast: ["Paneer Paratha", "Dahi", "Ketchup", "Tea / Coffee"],
            Lunch: ["Paneer Bhurji", "Dal Makhani", "Steamed Rice", "Chapati", "Raita"],
            Snacks: ["Aloo Tikki Chaat", "Tea"],
            Dinner: ["Malai Kofta", "Dal Makhani", "Naan", "Steamed Rice", "Ice Cream"],
        },
        Sunday: {
            Breakfast: ["Chole Bhature", "Lassi", "Pickle", "Tea / Coffee"],
            Lunch: ["Dum Aloo", "Paneer Lababdar", "Dal Makhani", "Puri", "Jeera Rice", "Raita", "Sweet (Halwa)"],
            Snacks: ["Samosa Chaat", "Cold Coffee"],
            Dinner: ["Veg Dum Biryani", "Boondi Raita", "Naan", "Phirni"],
        },
    },
};
// ── CBRI Canteen — Unified Commercial Menu ────────────────────────────────────
const CBRI_CANTEEN_MENU = [
    { item: "Tea", price: 10 },
    { item: "Coffee", price: 15 },
    { item: "Cold Coffee", price: 35 },
    { item: "Lassi", price: 35 },
    { item: "Nimbu Pani", price: 20 },
    { item: "Mineral Water (500 ml)", price: 20 },
    { item: "Veg Thali", price: 90 },
    { item: "Dal Rice", price: 60 },
    { item: "Roti Sabzi (2 pcs)", price: 40 },
    { item: "Chole Bhature", price: 65 },
    { item: "Rajma Rice", price: 65 },
    { item: "Samosa", price: 15 },
    { item: "Kachori", price: 20 },
    { item: "Bread Pakora", price: 20 },
    { item: "Aloo Tikki", price: 25 },
    { item: "Veg Burger", price: 60 },
    { item: "French Fries", price: 55 },
    { item: "Maggi Noodles", price: 35 },
    { item: "Veg Sandwich", price: 40 },
    { item: "Paneer Sandwich", price: 60 },
    { item: "Chowmein", price: 50 },
    { item: "Veg Roll", price: 50 },
    { item: "Spring Roll (2 pcs)", price: 45 },
];
// ── Green Gala Cafe (GGC) — Commercial Menu ───────────────────────────────────
const GREEN_GALA_MENU = [
    { item: "Peri Peri Fries", price: 90 },
    { item: "Classic Salted Fries", price: 70 },
    { item: "White Sauce Pasta", price: 130 },
    { item: "Red Sauce Pasta", price: 120 },
    { item: "Veg Cheese Maggi", price: 60 },
    { item: "Paneer Tikka Sandwich", price: 110 },
    { item: "Veg Loaded Nachos", price: 120 },
    { item: "Margherita Pizza (7\")", price: 160 },
    { item: "Oreo Shake", price: 90 },
    { item: "KitKat Shake", price: 95 },
    { item: "Cold Coffee with Cream", price: 80 },
    { item: "Virgin Mojito", price: 70 },
];
// ── Cafe Coffee Day (CCD) — Commercial Menu ───────────────────────────────────
const CCD_MENU = [
    { item: "Cappuccino", price: 120 },
    { item: "Cafe Latte", price: 130 },
    { item: "Cafe Frappe", price: 180 },
    { item: "Cold Coffee Classic", price: 160 },
    { item: "Hot Chocolate", price: 150 },
    { item: "Espresso (Single)", price: 90 },
    { item: "Veg Sandwich", price: 110 },
    { item: "Paneer Tikka Sandwich", price: 140 },
    { item: "Chocolate Brownie", price: 120 },
    { item: "Choco Chip Muffin", price: 100 },
];
// ── Amul Parlour (MAC) — Commercial Menu ──────────────────────────────────────
const AMUL_PARLOUR_MENU = [
    { item: "Amul Cool Cafe", price: 40 },
    { item: "Amul Kool Rose", price: 35 },
    { item: "Buttermilk (Chaas)", price: 20 },
    { item: "Lassi", price: 35 },
    { item: "Chocolate Scoop", price: 40 },
    { item: "Butterscotch Scoop", price: 40 },
    { item: "Vanilla Scoop", price: 35 },
    { item: "Cheese Sandwich", price: 50 },
    { item: "Veg Sandwich", price: 40 },
    { item: "Amul Lassi Pouch", price: 25 },
    { item: "Flavoured Milk", price: 30 },
];
// ── Commercial venue registries ───────────────────────────────────────────────
const COMMERCIAL_MENUS = {
    CBRI_Canteen: CBRI_CANTEEN_MENU,
    Green_Gala_Cafe: GREEN_GALA_MENU,
    CCD: CCD_MENU,
    Amul_Parlour_MAC: AMUL_PARLOUR_MENU,
};
const COMMERCIAL_TITLES = {
    CBRI_Canteen: "CBRI Canteen — Menu",
    Green_Gala_Cafe: "Green Gala Cafe — Menu",
    CCD: "Cafe Coffee Day (CCD) — Menu",
    Amul_Parlour_MAC: "Amul Parlour, MAC — Menu",
};
const COMMERCIAL_VENUES = new Set([
    "CBRI_Canteen", "Green_Gala_Cafe", "CCD", "Amul_Parlour_MAC",
]);
function isCommercial(name) {
    return COMMERCIAL_VENUES.has(name);
}
// ── Bhawan Canteen Data ───────────────────────────────────────────────────────
const CANTEEN_DATA = {
    Rajendra: {
        Day: [
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 30 },
            { item: "Lassi", price: 30 },
            { item: "Samosa", price: 15 },
            { item: "Bread Pakora", price: 20 },
            { item: "Veg Puff", price: 20 },
            { item: "Aloo Tikki", price: 25 },
            { item: "Pav Bhaji", price: 60 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Veg Burger", price: 55 },
            { item: "French Fries", price: 55 },
            { item: "Chowmein", price: 45 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 30 },
            { item: "Chocolate Shake", price: 55 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Egg Maggi", price: 50 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Bread Omelette", price: 45 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Upma", price: 25 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
    Cautley: {
        Day: [
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 30 },
            { item: "Samosa", price: 15 },
            { item: "Bread Pakora", price: 20 },
            { item: "Veg Momos (6 pcs)", price: 50 },
            { item: "Paneer Momos (6 pcs)", price: 65 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Veg Burger", price: 55 },
            { item: "Chowmein", price: 45 },
            { item: "Veg Roll", price: 45 },
            { item: "French Fries", price: 55 },
            { item: "Lassi", price: 30 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 30 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Egg Maggi", price: 50 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Veg Momos (6 pcs)", price: 50 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
    // Radhakrishnan — Day canteen is famous for its variety of Patties
    Radhakrishnan: {
        Day: [
            { item: "Aloo Patty", price: 20 },
            { item: "Cheese Patty", price: 35 },
            { item: "Paneer Patty", price: 40 },
            { item: "Veg Puff", price: 20 },
            { item: "Bread Pakora", price: 20 },
            { item: "Samosa", price: 15 },
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 35 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Chowmein", price: 45 },
            { item: "Lassi", price: 30 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 35 },
            { item: "Aloo Patty", price: 20 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Egg Maggi", price: 50 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Bread Omelette", price: 45 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
    Govind: {
        Day: [
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 30 },
            { item: "Lassi", price: 30 },
            { item: "Samosa", price: 15 },
            { item: "Kachori", price: 20 },
            { item: "Aloo Tikki", price: 25 },
            { item: "Bread Pakora", price: 20 },
            { item: "Veg Puff", price: 20 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Veg Burger", price: 55 },
            { item: "Chowmein", price: 45 },
            { item: "Chole Kulche", price: 50 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 30 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Egg Maggi", price: 50 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Bread Omelette", price: 45 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Upma", price: 25 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
    Jawahar: {
        Day: [
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 30 },
            { item: "Lassi", price: 30 },
            { item: "Samosa", price: 15 },
            { item: "Bread Pakora", price: 20 },
            { item: "Veg Momos (6 pcs)", price: 50 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Veg Burger", price: 55 },
            { item: "French Fries", price: 55 },
            { item: "Chowmein", price: 45 },
            { item: "Veg Roll", price: 45 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 30 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Egg Maggi", price: 50 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Bread Omelette", price: 45 },
            { item: "Veg Momos (6 pcs)", price: 50 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
    Rajiv: {
        Day: [
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 30 },
            { item: "Nimbu Pani", price: 20 },
            { item: "Samosa", price: 15 },
            { item: "Bread Pakora", price: 20 },
            { item: "Aloo Tikki", price: 25 },
            { item: "Veg Puff", price: 20 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Veg Burger", price: 55 },
            { item: "Chowmein", price: 45 },
            { item: "Lassi", price: 30 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 30 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Egg Maggi", price: 50 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Upma", price: 25 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
    Azad: {
        Day: [
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 30 },
            { item: "Nimbu Pani", price: 20 },
            { item: "Lassi", price: 30 },
            { item: "Kachori", price: 20 },
            { item: "Samosa", price: 15 },
            { item: "Aloo Tikki", price: 25 },
            { item: "Bread Pakora", price: 20 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Chowmein", price: 45 },
            { item: "Pav Bhaji", price: 60 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 30 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Egg Maggi", price: 50 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Bread Omelette", price: 45 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Upma", price: 25 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
    Ravindra: {
        Day: [
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 30 },
            { item: "Lassi", price: 30 },
            { item: "Samosa", price: 15 },
            { item: "Bread Pakora", price: 20 },
            { item: "Veg Puff", price: 20 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Veg Burger", price: 55 },
            { item: "Paneer Burger", price: 70 },
            { item: "French Fries", price: 55 },
            { item: "Chowmein", price: 45 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 30 },
            { item: "Chocolate Shake", price: 55 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Egg Maggi", price: 50 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Bread Omelette", price: 45 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
    Ganga: {
        Day: [
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 30 },
            { item: "Lassi", price: 30 },
            { item: "Samosa", price: 15 },
            { item: "Aloo Tikki", price: 25 },
            { item: "Bread Pakora", price: 20 },
            { item: "Veg Puff", price: 20 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Veg Burger", price: 55 },
            { item: "Chowmein", price: 45 },
            { item: "Veg Roll", price: 45 },
            { item: "Chole Kulche", price: 50 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 30 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Egg Maggi", price: 50 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Bread Omelette", price: 45 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Upma", price: 25 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
    Himalaya: {
        Day: [
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 30 },
            { item: "Lassi", price: 30 },
            { item: "Samosa", price: 15 },
            { item: "Kachori", price: 20 },
            { item: "Bread Pakora", price: 20 },
            { item: "Aloo Tikki", price: 25 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Veg Burger", price: 55 },
            { item: "French Fries", price: 55 },
            { item: "Chowmein", price: 45 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 30 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Egg Maggi", price: 50 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Bread Omelette", price: 45 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Upma", price: 25 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
    Arawali: {
        Day: [
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 30 },
            { item: "Lassi", price: 30 },
            { item: "Samosa", price: 15 },
            { item: "Bread Pakora", price: 20 },
            { item: "Veg Momos (6 pcs)", price: 50 },
            { item: "Aloo Tikki", price: 25 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Veg Burger", price: 55 },
            { item: "Chowmein", price: 45 },
            { item: "Veg Roll", price: 45 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 30 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Egg Maggi", price: 50 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Veg Momos (6 pcs)", price: 50 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
    Sarojini: {
        Day: [
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 30 },
            { item: "Fruit Juice", price: 30 },
            { item: "Lassi", price: 30 },
            { item: "Samosa", price: 15 },
            { item: "Bread Pakora", price: 20 },
            { item: "Veg Puff", price: 20 },
            { item: "Aloo Tikki", price: 25 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Veg Burger", price: 55 },
            { item: "French Fries", price: 55 },
            { item: "Chowmein", price: 45 },
            { item: "Chole Kulche", price: 50 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 30 },
            { item: "Warm Milk", price: 20 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Bread Omelette", price: 45 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Upma", price: 25 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
    Kasturba: {
        Day: [
            { item: "Tea", price: 10 },
            { item: "Coffee", price: 15 },
            { item: "Cold Coffee", price: 30 },
            { item: "Fruit Juice", price: 30 },
            { item: "Lassi", price: 30 },
            { item: "Samosa", price: 15 },
            { item: "Bread Pakora", price: 20 },
            { item: "Veg Puff", price: 20 },
            { item: "Aloo Tikki", price: 25 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Veg Sandwich", price: 40 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Veg Burger", price: 55 },
            { item: "Chowmein", price: 45 },
            { item: "Veg Roll", price: 45 },
        ],
        Night: [
            { item: "Tea", price: 10 },
            { item: "Cold Coffee", price: 30 },
            { item: "Warm Milk", price: 20 },
            { item: "Maggi Noodles", price: 35 },
            { item: "Aloo Paratha", price: 40 },
            { item: "Veg Sandwich", price: 35 },
            { item: "Paneer Sandwich", price: 55 },
            { item: "Upma", price: 25 },
            { item: "Biscuits (Packet)", price: 15 },
        ],
    },
};
// ── Helpers ───────────────────────────────────────────────────────────────────
const BHAWAN_NAMES = [
    "Rajendra", "Cautley", "Radhakrishnan", "Govind", "Jawahar",
    "Rajiv", "Azad", "Ravindra", "Ganga", "Himalaya",
    "Arawali", "Sarojini", "Kasturba", "EWS",
    "CBRI_Canteen", "Green_Gala_Cafe", "CCD", "Amul_Parlour_MAC",
];
const DAYS = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];
function formatMessMenu(bhawanName, day) {
    const menu = MENU_DATA[bhawanName][day];
    const section = (title, items) => `### ${title}\n${items.map((i) => `  - ${i}`).join("\n")}`;
    return [
        `## ${bhawanName} Bhawan — ${day} Mess Menu`,
        "",
        section("Breakfast", menu.Breakfast),
        "",
        section("Lunch", menu.Lunch),
        "",
        section("Snacks", menu.Snacks),
        "",
        section("Dinner", menu.Dinner),
    ].join("\n");
}
function formatCanteenTable(title, items) {
    const rows = items
        .map(({ item, price }) => `| ${item} | ${price} |`)
        .join("\n");
    return [
        `## ${title}`,
        "",
        "| Item Name | Price (₹) |",
        "|-----------|-----------|",
        rows,
    ].join("\n");
}
// ── Server ────────────────────────────────────────────────────────────────────
const server = new mcp_js_1.McpServer({
    name: "iitr-cafeteria",
    version: "2.0.0",
});
// ── Tool: get_bhawan_menu ─────────────────────────────────────────────────────
server.registerTool("get_bhawan_menu", {
    description: "Fetches the official hostel mess menu (Breakfast, Lunch, Snacks, Dinner) for a specified IIT Roorkee campus location.",
    inputSchema: {
        bhawanName: zod_1.z.enum(BHAWAN_NAMES),
        day: zod_1.z.enum(DAYS),
    },
}, async ({ bhawanName, day }) => {
    if (isCommercial(bhawanName)) {
        const label = bhawanName.replace(/_/g, " ");
        return {
            content: [
                {
                    type: "text",
                    text: `${label} is an independent commercial outlet and does not operate a standard hostel mess menu. Use \`get_bhawan_canteen_menu\` to view its on-demand food menu.`,
                },
            ],
        };
    }
    return {
        content: [{ type: "text", text: formatMessMenu(bhawanName, day) }],
    };
});
// ── Tool: get_bhawan_canteen_menu ─────────────────────────────────────────────
server.registerTool("get_bhawan_canteen_menu", {
    description: "Fetches the on-demand Day or Night canteen menu for a specified IIT Roorkee campus location.",
    inputSchema: {
        bhawanName: zod_1.z.enum(BHAWAN_NAMES),
        canteenType: zod_1.z.enum(["Day", "Night"]),
    },
}, async ({ bhawanName, canteenType }) => {
    if (bhawanName === "EWS") {
        return {
            content: [
                {
                    type: "text",
                    text: "EWS does not operate an internal bhawan canteen.",
                },
            ],
        };
    }
    // Commercial outlets expose a single unified menu (canteenType is ignored).
    if (isCommercial(bhawanName)) {
        return {
            content: [
                {
                    type: "text",
                    text: formatCanteenTable(COMMERCIAL_TITLES[bhawanName], COMMERCIAL_MENUS[bhawanName]),
                },
            ],
        };
    }
    const items = CANTEEN_DATA[bhawanName][canteenType];
    const title = `${bhawanName} Bhawan — ${canteenType} Canteen Menu`;
    return {
        content: [{ type: "text", text: formatCanteenTable(title, items) }],
    };
});
// ── Startup ───────────────────────────────────────────────────────────────────
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Cafeteria MCP Server running on stdio");
}
main().catch((err) => {
    console.error("Fatal error starting Cafeteria MCP Server:", err);
    process.exit(1);
});
