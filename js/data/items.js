// Sample item database - in production, this would be a comprehensive JSON file
window.ITEM_DATABASE = [
    {
        id: "T4_2H_BOW",
        name: "Bow",
        tier: 4,
        category: "weapon",
        subcategory: "bow"
    },
    {
        id: "T4_PLANKS",
        name: "Fine Planks",
        tier: 4,
        category: "resource",
        subcategory: "wood"
    },
    {
        id: "T4_METALBAR",
        name: "Steel Bar",
        tier: 4,
        category: "resource",
        subcategory: "ore"
    },
    {
        id: "T4_LEATHER",
        name: "Worked Leather",
        tier: 4,
        category: "resource",
        subcategory: "hide"
    },
    {
        id: "T4_CLOTH",
        name: "Neat Cloth",
        tier: 4,
        category: "resource",
        subcategory: "fiber"
    }
    // ... more items
];

window.RECIPE_DATABASE = {
    "T4_2H_BOW": {
        result_item_id: "T4_2H_BOW",
        ingredients: [
            { id: "T4_PLANKS", name: "Fine Planks", quantity: 8 },
            { id: "T4_METALBAR", name: "Steel Bar", quantity: 4 },
            { id: "T4_LEATHER", name: "Worked Leather", quantity: 4 }
        ]
    }
    // ... more recipes
};