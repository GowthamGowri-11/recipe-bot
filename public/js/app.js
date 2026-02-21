// Recipe Chatbot AI - Frontend Application

// API Base URL (works for both local dev and Netlify)
const API_BASE = '/api';

// DOM Elements
const elements = {
    ingredientInput: document.getElementById('ingredientInput'),
    searchBtn: document.getElementById('searchBtn'),
    browseBtn: document.getElementById('browseBtn'),
    aboutBtn: document.getElementById('aboutBtn'),
    aboutSection: document.getElementById('aboutSection'),
    closeAbout: document.getElementById('closeAbout'),
    resultsSection: document.getElementById('resultsSection'),
    resultsInfo: document.getElementById('resultsInfo'),
    recipeResults: document.getElementById('recipeResults'),
    categoriesSection: document.getElementById('categoriesSection'),
    categoryGrid: document.getElementById('categoryGrid'),
    dishesSection: document.getElementById('dishesSection'),
    categoryTitle: document.getElementById('categoryTitle'),
    dishesGrid: document.getElementById('dishesGrid'),
    recipeDetail: document.getElementById('recipeDetail'),
    recipeTitle: document.getElementById('recipeTitle'),
    ingredientsList: document.getElementById('ingredientsList'),
    instructionsList: document.getElementById('instructionsList'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    backFromResults: document.getElementById('backFromResults'),
    backFromCategories: document.getElementById('backFromCategories'),
    backFromDishes: document.getElementById('backFromDishes'),
    backFromRecipe: document.getElementById('backFromRecipe')
};

// State
let currentView = 'search';
let previousView = 'search';
let allCategories = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Search
    elements.searchBtn.addEventListener('click', searchRecipes);
    elements.ingredientInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchRecipes();
    });

    // Browse categories
    elements.browseBtn.addEventListener('click', showCategories);

    // About section
    elements.aboutBtn.addEventListener('click', showAbout);
    elements.closeAbout.addEventListener('click', hideAbout);

    // Quick tags
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            elements.ingredientInput.value = tag.dataset.ingredients;
            searchRecipes();
        });
    });

    // Back buttons
    elements.backFromResults.addEventListener('click', showSearch);
    elements.backFromCategories.addEventListener('click', showSearch);
    elements.backFromDishes.addEventListener('click', showCategories);
    elements.backFromRecipe.addEventListener('click', goBack);
}

// Show/Hide Sections
function hideAllSections() {
    elements.resultsSection.classList.add('hidden');
    elements.categoriesSection.classList.add('hidden');
    elements.dishesSection.classList.add('hidden');
    elements.recipeDetail.classList.add('hidden');
    elements.aboutSection.classList.add('hidden');
}

function showSearch() {
    hideAllSections();
    document.querySelector('.search-section').classList.remove('hidden');
    currentView = 'search';
}

function showAbout() {
    hideAllSections();
    document.querySelector('.search-section').classList.add('hidden');
    elements.aboutSection.classList.remove('hidden');
}

function hideAbout() {
    elements.aboutSection.classList.add('hidden');
    document.querySelector('.search-section').classList.remove('hidden');
}

function showLoading() {
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

// Search Recipes
async function searchRecipes() {
    const ingredients = elements.ingredientInput.value.trim();
    
    if (!ingredients) {
        alert('Please enter ingredients or a dish name!');
        return;
    }

    showLoading();
    previousView = 'search';

    try {
        const response = await fetch(`${API_BASE}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredients })
        });

        const data = await response.json();
        
        // Check if it's a direct dish name match
        if (data.directMatch && data.recipe) {
            displayRecipe(data.recipe);
            currentView = 'recipe';
        } else {
            displayResults(data);
        }
    } catch (error) {
        console.error('Search error:', error);
        elements.recipeResults.innerHTML = `
            <div class="no-results">
                <h3>Oops! Something went wrong</h3>
                <p>Please try again later</p>
            </div>
        `;
        hideAllSections();
        elements.resultsSection.classList.remove('hidden');
    } finally {
        hideLoading();
    }
}

// Display Search Results
function displayResults(data) {
    hideAllSections();
    elements.resultsSection.classList.remove('hidden');
    currentView = 'results';

    if (!data.recipes || data.recipes.length === 0) {
        elements.resultsInfo.innerHTML = '';
        elements.recipeResults.innerHTML = `
            <div class="no-results">
                <h3>No recipes found</h3>
                <p>Try different ingredients or browse categories</p>
                <button class="btn btn-secondary" onclick="showCategories()">
                    <span class="btn-icon">📋</span>
                    Browse Categories
                </button>
            </div>
        `;
        return;
    }

    elements.resultsInfo.innerHTML = `
        Found <strong>${data.totalFound}</strong> recipes! Showing top ${data.recipes.length} matches.
    `;

    elements.recipeResults.innerHTML = data.recipes.map(recipe => {
        const missingHtml = recipe.missing.length > 0
            ? `<div class="recipe-missing">Need: ${recipe.missing.slice(0, 4).join(', ')}${recipe.missing.length > 4 ? '...' : ''}</div>`
            : `<div class="recipe-missing complete">✅ You have all ingredients!</div>`;

        return `
            <div class="recipe-card" onclick="showRecipe('${escapeHtml(recipe.name)}')">
                <h3>${escapeHtml(recipe.name)}</h3>
                <div class="recipe-match">
                    ${recipe.matchCount} ingredients match (${Math.round(recipe.matchPercentage)}%)
                </div>
                ${missingHtml}
            </div>
        `;
    }).join('');
}

// Show Categories
async function showCategories() {
    showLoading();
    previousView = currentView === 'dishes' ? 'categories' : 'search';

    try {
        const response = await fetch(`${API_BASE}/categories`);
        allCategories = await response.json();
        displayCategories();
    } catch (error) {
        console.error('Categories error:', error);
    } finally {
        hideLoading();
    }
}

// Display Categories
function displayCategories() {
    hideAllSections();
    elements.categoriesSection.classList.remove('hidden');
    currentView = 'categories';

    // Separate veg and non-veg categories
    const vegCategories = {};
    const nonVegCategories = {};
    
    for (const [name, data] of Object.entries(allCategories)) {
        if (name.toLowerCase().includes('veg') && !name.toLowerCase().includes('non')) {
            vegCategories[name] = data;
        } else if (name.toLowerCase().includes('chicken') || 
                   name.toLowerCase().includes('mutton') || 
                   name.toLowerCase().includes('fish') || 
                   name.toLowerCase().includes('prawn') || 
                   name.toLowerCase().includes('egg') ||
                   name.toLowerCase().includes('crab') ||
                   name.toLowerCase().includes('duck') ||
                   name.toLowerCase().includes('non-veg') ||
                   name.toLowerCase().includes('seafood') ||
                   name.toLowerCase().includes('soup')) {
            nonVegCategories[name] = data;
        } else {
            vegCategories[name] = data;
        }
    }

    let html = '<div class="category-type"><h3 class="category-type-title">🥬 Vegetarian</h3><div class="category-type-grid">';
    
    for (const [name, data] of Object.entries(vegCategories)) {
        html += `
            <div class="category-card veg" onclick="showCategoryDishes('${escapeHtml(name)}')">
                <h3>${escapeHtml(name)}</h3>
                <div class="category-count">${data.count} dishes</div>
            </div>
        `;
    }
    
    html += '</div></div>';
    html += '<div class="category-type"><h3 class="category-type-title">🍗 Non-Vegetarian</h3><div class="category-type-grid">';
    
    for (const [name, data] of Object.entries(nonVegCategories)) {
        html += `
            <div class="category-card non-veg" onclick="showCategoryDishes('${escapeHtml(name)}')">
                <h3>${escapeHtml(name)}</h3>
                <div class="category-count">${data.count} dishes</div>
            </div>
        `;
    }
    
    html += '</div></div>';
    
    elements.categoryGrid.innerHTML = html;
}

// Show Dishes in Category
function showCategoryDishes(categoryName) {
    hideAllSections();
    elements.dishesSection.classList.remove('hidden');
    currentView = 'dishes';
    previousView = 'categories';

    elements.categoryTitle.textContent = categoryName;
    
    const dishes = allCategories[categoryName]?.dishes || [];
    elements.dishesGrid.innerHTML = dishes.map(dish => `
        <div class="dish-card" onclick="showRecipe('${escapeHtml(dish)}')">
            ${escapeHtml(dish)}
        </div>
    `).join('');
}

// Show Recipe Detail
async function showRecipe(recipeName) {
    showLoading();
    previousView = currentView;

    try {
        const response = await fetch(`${API_BASE}/recipe?name=${encodeURIComponent(recipeName)}`);
        const recipe = await response.json();
        
        if (recipe.error) {
            alert('Recipe not found');
            hideLoading();
            return;
        }

        displayRecipe(recipe);
    } catch (error) {
        console.error('Recipe error:', error);
    } finally {
        hideLoading();
    }
}

// Display Recipe Detail
function displayRecipe(recipe) {
    hideAllSections();
    elements.recipeDetail.classList.remove('hidden');
    currentView = 'recipe';

    elements.recipeTitle.textContent = recipe.name;

    elements.ingredientsList.innerHTML = recipe.ingredients
        .map(ing => `<li>${capitalizeFirst(ing)}</li>`)
        .join('');

    elements.instructionsList.innerHTML = recipe.instructions
        .map(inst => `<li>${escapeHtml(inst)}</li>`)
        .join('');
}

// Go Back
function goBack() {
    if (previousView === 'results') {
        hideAllSections();
        elements.resultsSection.classList.remove('hidden');
        currentView = 'results';
    } else if (previousView === 'dishes') {
        hideAllSections();
        elements.dishesSection.classList.remove('hidden');
        currentView = 'dishes';
    } else if (previousView === 'categories') {
        showCategories();
    } else {
        showSearch();
    }
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Make functions globally accessible
window.showCategories = showCategories;
window.showRecipe = showRecipe;
window.showCategoryDishes = showCategoryDishes;