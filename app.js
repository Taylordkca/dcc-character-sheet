// ------------------------------------
// DCC CHARACTER SHEET
// Character Data System - Version 0.3
// ------------------------------------


// CREATE A BLANK CHARACTER

function createBlankCharacter() {

    return {

        id: crypto.randomUUID(),

        identity: {
            name: "",
            race: "",
            pronouns: "",
            level: 1,
            crawlerNumber: "",
            class: "",
            floor: 1
        },

        stats: {

            strength: {
                unenhanced: "",
                enhanced: ""
            },

            intelligence: {
                unenhanced: "",
                enhanced: ""
            },

            constitution: {
                unenhanced: "",
                enhanced: ""
            },

            dexterity: {
                unenhanced: "",
                enhanced: ""
            },

            charisma: {
                unenhanced: "",
                enhanced: ""
            }
        },
resources: {
    healthPercent: 100,
    currentMana: ""
},
        skills: [],
        attacks: [],
        inventory: [],
        gear: {},
        notes: {}
    };
}


// ------------------------------------
// STAT MODIFIER
// ------------------------------------

function getStatMod(statValue) {

    const value = Number(statValue);

    if (!statValue || value < 1) {
        return null;
    }

    if (value <= 2) return 1;
    if (value <= 5) return 2;
    if (value <= 9) return 3;
    if (value <= 19) return 4;
    if (value <= 49) return 5;
    if (value <= 99) return 6;
    if (value <= 149) return 7;
    if (value <= 199) return 8;
    if (value <= 299) return 9;

    return 10;
}


// ------------------------------------
// LOAD OR CREATE CHARACTER
// ------------------------------------


// ------------------------------------
// CHARACTER LIBRARY - VERSION 0.8A
// ------------------------------------

const CHARACTER_LIBRARY_KEY = "dccCharacterLibraryV1";
const LEGACY_CHARACTER_KEY = "dccCharacterV3";

function prepareCharacter(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Invalid character data.");
    }

    if (!data.id) {
        data.id = crypto.randomUUID();
    }

    if (!data.identity || typeof data.identity !== "object") {
        data.identity = {};
    }

    const blank = createBlankCharacter();

    for (const [key, value] of Object.entries(blank.identity)) {
        if (data.identity[key] === undefined) {
            data.identity[key] = value;
        }
    }

    if (!data.stats || typeof data.stats !== "object") {
        data.stats = {};
    }

    for (const [stat, defaults] of Object.entries(blank.stats)) {
        if (!data.stats[stat] ||
            typeof data.stats[stat] !== "object") {
            data.stats[stat] = { ...defaults };
        }

        for (const [key, value] of Object.entries(defaults)) {
            if (data.stats[stat][key] === undefined) {
                data.stats[stat][key] = value;
            }
        }
    }

    if (!data.resources || typeof data.resources !== "object") {
        data.resources = {};
    }

    if (data.resources.healthPercent === undefined) {
        data.resources.healthPercent = 100;
    }

    if (data.resources.currentMana === undefined) {
        data.resources.currentMana = "";
    }

    if (!Array.isArray(data.skills)) data.skills = [];
    if (!Array.isArray(data.inventory)) data.inventory = [];
    if (!Array.isArray(data.attacks)) data.attacks = [];

    if (!data.gear) data.gear = {};
    if (!data.notes) data.notes = {};

    return data;
}

function loadCharacterLibrary() {
    const existing = localStorage.getItem(CHARACTER_LIBRARY_KEY);

    if (existing !== null) {
        const library = JSON.parse(existing);

        if (!library ||
            !Array.isArray(library.characters) ||
            library.characters.length === 0) {
            throw new Error("Character library is invalid or empty.");
        }

        library.characters.forEach(prepareCharacter);

        if (!library.characters.some(
            entry => entry.id === library.activeId
        )) {
            library.activeId = library.characters[0].id;
        }

        return library;
    }

    // First migration: read the old save, but NEVER erase it.
    const legacy = localStorage.getItem(LEGACY_CHARACTER_KEY);

    const firstCharacter = legacy
        ? prepareCharacter(JSON.parse(legacy))
        : createBlankCharacter();

    const library = {
        version: 1,
        activeId: firstCharacter.id,
        characters: [firstCharacter]
    };

    // Write to a NEW key. The old key remains untouched.
    localStorage.setItem(
        CHARACTER_LIBRARY_KEY,
        JSON.stringify(library)
    );

    return library;
}

let characterLibrary = loadCharacterLibrary();

let character = characterLibrary.characters.find(
    entry => entry.id === characterLibrary.activeId
);

// Ensure our default inventory entries exist for the active crawler.
function ensureCharacterCurrency(data) {
    const defaults = [
        { systemId: "gold", name: "Gold" },
        { systemId: "misc-junk", name: "Misc Junk" }
    ];

    defaults.forEach(defaultItem => {
        const exists = data.inventory.some(
            item => item.systemId === defaultItem.systemId
        );

        if (!exists) {
            data.inventory.push({
                id: crypto.randomUUID(),
                systemId: defaultItem.systemId,
                name: defaultItem.name,
                quantity: 0,
                location: "Inventory",
                pinned: true,
                hidden: false,
                tags: [],
                description: ""
            });
        }
    });
}

// ------------------------------------
// FIELD MAP
// ------------------------------------

const fieldMap = {

    characterName: ["identity", "name"],
    race: ["identity", "race"],
    pronouns: ["identity", "pronouns"],
    level: ["identity", "level"],
    crawlerNumber: ["identity", "crawlerNumber"],
    characterClass: ["identity", "class"],
    floor: ["identity", "floor"],

    strengthUnenhanced: ["stats", "strength", "unenhanced"],
    strengthEnhanced: ["stats", "strength", "enhanced"],

    intelligenceUnenhanced: ["stats", "intelligence", "unenhanced"],
    intelligenceEnhanced: ["stats", "intelligence", "enhanced"],

    constitutionUnenhanced: ["stats", "constitution", "unenhanced"],
    constitutionEnhanced: ["stats", "constitution", "enhanced"],

    dexterityUnenhanced: ["stats", "dexterity", "unenhanced"],
    dexterityEnhanced: ["stats", "dexterity", "enhanced"],

    charismaUnenhanced: ["stats", "charisma", "unenhanced"],
    charismaEnhanced: ["stats", "charisma", "enhanced"],
currentMana: ["resources", "currentMana"]
};


// ------------------------------------
// DISPLAY CHARACTER
// ------------------------------------

function displayCharacter() {

    for (const fieldID in fieldMap) {

        const input = document.getElementById(fieldID);
        const path = fieldMap[fieldID];

        if (path.length === 2) {

            input.value =
                character[path[0]][path[1]];

        } else {

            input.value =
                character[path[0]][path[1]][path[2]];
        }
    }

    updateStatMods();
}


// ------------------------------------
// UPDATE STAT MODIFIERS
// ------------------------------------

function updateStatMods() {

    const stats = [
        "strength",
        "intelligence",
        "constitution",
        "dexterity",
        "charisma"
    ];

    stats.forEach(stat => {

        const enhanced =
            character.stats[stat].enhanced;

        const mod =
            getStatMod(enhanced);

        const display =
            document.getElementById(stat + "Mod");

        if (mod === null) {

            display.textContent = "—";

        } else {

            display.textContent = "+" + mod;
        }
    });
	    updateResources();

    if (typeof renderSkills === "function") {
        renderSkills();
    }
}
// ------------------------------------
// UPDATE HEALTH & MANA
// ------------------------------------

function updateResources() {

    // ----- HEALTH -----

    const conMod =
        getStatMod(character.stats.constitution.enhanced);

    const hbValueDisplay =
        document.getElementById("hbValue");

    if (conMod === null) {
        hbValueDisplay.textContent = "—";
    } else {
        hbValueDisplay.textContent = conMod;
    }


    const healthPercent =
        character.resources.healthPercent;

    document.getElementById("currentHealthDisplay")
        .textContent = healthPercent + "%";

    document.getElementById("hbRemaining")
        .textContent = healthPercent / 10;


    const healthButtons =
        document.querySelectorAll(".health-blocks button");

    healthButtons.forEach(button => {

        const blockValue =
            Number(button.dataset.health);

        if (blockValue <= healthPercent) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });


    // ----- MANA -----

    const enhancedInt =
        character.stats.intelligence.enhanced;

    const maxManaDisplay =
        document.getElementById("maxMana");

    if (enhancedInt === "") {
        maxManaDisplay.textContent = "—";
    } else {
        maxManaDisplay.textContent = enhancedInt;
    }
}
// ------------------------------------
// SAVE CHARACTER
// ------------------------------------


function saveCharacter() {

    // Keep the current character selected in the library.
    characterLibrary.activeId = character.id;

    // All characters are saved together.
    localStorage.setItem(
        CHARACTER_LIBRARY_KEY,
        JSON.stringify(characterLibrary)
    );
}



// ------------------------------------
// WATCH FOR CHANGES
// ------------------------------------

for (const fieldID in fieldMap) {

    const input =
        document.getElementById(fieldID);

    input.addEventListener("input", function () {

        const path = fieldMap[fieldID];

        if (path.length === 2) {

            character[path[0]][path[1]] =
                input.value;

        } else {

            character[path[0]][path[1]][path[2]] =
                input.value;
        }

        updateStatMods();
        saveCharacter();
    });
}


// ------------------------------------
// START SHEET
// ------------------------------------
// ------------------------------------
// HEALTH BLOCK CONTROLS
// ------------------------------------

const healthButtons =
    document.querySelectorAll(".health-blocks button");

healthButtons.forEach(button => {

    button.addEventListener("click", function () {

        character.resources.healthPercent =
            Number(button.dataset.health);

        updateResources();
        saveCharacter();
    });
});
// ------------------------------------
// SKILLS & SPELLS - VERSION 0.5
// ------------------------------------

// Make sure older saved characters have a skills list.
if (!Array.isArray(character.skills)) {
    character.skills = [];
}


// HTML ELEMENTS

const addSkillButton =
    document.getElementById("addSkillButton");

const skillForm =
    document.getElementById("skillForm");

const saveSkillButton =
    document.getElementById("saveSkillButton");

const cancelSkillButton =
    document.getElementById("cancelSkillButton");

const skillTableBody =
    document.getElementById("skillTableBody");


// OPEN FORM

addSkillButton.addEventListener("click", function () {

    skillForm.hidden = false;
    document.getElementById("skillName").focus();
});


// CANCEL FORM

cancelSkillButton.addEventListener("click", function () {

    skillForm.hidden = true;
    clearSkillForm();
});


// CLEAR FORM

function clearSkillForm() {

    document.getElementById("skillName").value = "";
    document.getElementById("skillType").value = "Skill";
    document.getElementById("skillRank").value = "";
    document.getElementById("skillEnhancedRank").value = "";
    document.getElementById("skillStat").value = "";
    document.getElementById("skillSource").value = "RAW";
}


// SAVE NEW SKILL

saveSkillButton.addEventListener("click", function () {

    const name =
        document.getElementById("skillName").value.trim();

    const type =
        document.getElementById("skillType").value;
    const source =
    document.getElementById("skillSource").value;

    const rank =
        document.getElementById("skillRank").value.trim();

    const enhancedRank =
        document.getElementById("skillEnhancedRank").value.trim();

    const stat =
        document.getElementById("skillStat").value;

    if (name === "") {
        alert("Please enter a skill or spell name.");
        return;
    }

    const newSkill = {

        id: crypto.randomUUID(),

        name: name,
        type: type,
        rank: rank,
        enhancedRank: enhancedRank,
        stat: stat,
        source: source,

        advancementMarked: false,

        tags: [],
        limitations: "",
        description: "",
        rank5: "",
        rank10: "",
        rank15: "",

        manaCost: "",
        cooldown: "",
        duration: "",
        range: "",

        enhancedRankNote: ""
    };

    character.skills.push(newSkill);

    saveCharacter();
    renderSkills();

    clearSkillForm();
    skillForm.hidden = true;
});


// GET STAT MOD FOR A SKILL

function getSkillStatMod(stat) {

    const statNames = {
        STR: "strength",
        INT: "intelligence",
        CON: "constitution",
        DEX: "dexterity",
        CHA: "charisma"
    };

    const statName = statNames[stat];

    if (!statName) {
        return "—";
    }

    const enhanced =
        character.stats[statName].enhanced;

    const mod = getStatMod(enhanced);

    return mod === null ? "—" : "+" + mod;
}


// DISPLAY SKILLS


function renderSkills() {

    skillTableBody.replaceChildren();

    const query = (
        document.getElementById("skillSearch")?.value || ""
    ).trim().toLowerCase();

    const typeFilter =
        document.getElementById("skillTypeFilter")?.value || "";

    const statFilter =
        document.getElementById("skillStatFilter")?.value || "";

    const sourceFilter =
        document.getElementById("skillSourceFilter")?.value || "";

    const tagFilter =
        document.getElementById("skillTagFilter")?.value || "";

    const filteredSkills = character.skills.filter(skill => {

        const searchableText = [
            skill.name,
            skill.type,
            skill.source,
            skill.stat,
            skill.description,
            skill.limitations,
            skill.damageEffect,
            skill.favored,
            ...(skill.tags || [])
        ].join(" ").toLowerCase();

        if (query && !searchableText.includes(query)) return false;
        if (typeFilter && skill.type !== typeFilter) return false;
        if (statFilter && skill.stat !== statFilter) return false;

        if (sourceFilter &&
            (skill.source || "RAW") !== sourceFilter) return false;

        if (tagFilter) {
            const tags = [
                ...(skill.tags || []),
                ...(skill.damageEffect ? ["Damage Effect"] : []),
                ...(skill.favored ? ["Favored"] : [])
            ];

            if (!tags.includes(tagFilter)) return false;
        }

        return true;
    });

    filteredSkills.forEach(skill => {

        const row = document.createElement("tr");
        row.tabIndex = 0;

        row.addEventListener("click", () => {
            openSkillSidebar(skill.id);
        });

        row.addEventListener("keydown", event => {
            if (event.target !== row) return;

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openSkillSidebar(skill.id);
            }
        });

        
const values = [
    getSkillDisplayName(skill),
    skill.rank || "",
    skill.enhancedRank || "",
    skill.stat || "—",
    getSkillStatMod(skill.stat)
];

values.forEach((value, index) => {
    const cell = document.createElement("td");
    cell.textContent = value;

    // Enhanced Rank is the third column.
    if (index === 2 && skill.enhancedRankNote) {
        const noteIcon = document.createElement("span");

        noteIcon.className = "enhanced-rank-note";
        noteIcon.textContent = "ⓘ";
        noteIcon.title = skill.enhancedRankNote;

        noteIcon.setAttribute(
            "aria-label",
            "Enhanced Rank note: " + skill.enhancedRankNote
        );

        cell.appendChild(noteIcon);
    }

    row.appendChild(cell);
});


        const markCell = document.createElement("td");
        const markButton = document.createElement("button");

        markButton.type = "button";
        markButton.textContent = skill.advancementMarked ? "✓" : "";
        markButton.setAttribute(
            "aria-label",
            "Toggle advancement mark for " + skill.name
        );

        markButton.addEventListener("click", event => {
            event.stopPropagation();
            skill.advancementMarked = !skill.advancementMarked;
            saveCharacter();
            renderSkills();
        });

        markCell.appendChild(markButton);
        row.appendChild(markCell);

        skillTableBody.appendChild(row);
    });

    refreshSkillTagFilter();
}



// INITIAL DISPLAY

renderSkills();

// ------------------------------------
// SKILL DETAILS SIDEBAR - VERSION 0.5.1
// ------------------------------------

let selectedSkillId = null;

const skillSidebar = document.getElementById("skillSidebar");
const skillOverlay = document.getElementById("skillOverlay");
const skillDetailView = document.getElementById("skillDetailView");
const skillEditForm = document.getElementById("skillEditForm");
const skillViewActions = document.getElementById("skillViewActions");

const skillEditFields = {
    name: "editSkillName",
    type: "editSkillType",
    source: "editSkillSource",
    rank: "editSkillRank",
    enhancedRank: "editSkillEnhancedRank",
    enhancedRankNote: "editSkillEnhancedNote",
    stat: "editSkillStat",
    damageEffect: "editSkillDamageEffect",
    favored: "editSkillFavored",
    manaCost: "editSkillManaCost",
    cooldown: "editSkillCooldown",
    duration: "editSkillDuration",
    range: "editSkillRange",
    limitations: "editSkillLimitations",
    description: "editSkillDescription",
    rank5: "editSkillRank5",
    rank10: "editSkillRank10",
    rank15: "editSkillRank15"
};

function getSelectedSkill() {
    return character.skills.find(
        skill => skill.id === selectedSkillId
    );
}

function getSkillDisplayName(skill) {
    const name = (skill.name || "").replace(/\*+$/, "").trim();

    const isCustom =
        skill.source === "Custom*" ||
        (skill.tags || []).includes("Custom*");

    return name + (isCustom ? "*" : "");
}

function openSkillSidebar(skillId) {
    selectedSkillId = skillId;

    if (!getSelectedSkill()) return;

    skillOverlay.hidden = false;
    skillSidebar.hidden = false;

    showSkillDetails();
}

function closeSkillSidebar() {
    selectedSkillId = null;
    skillSidebar.hidden = true;
    skillOverlay.hidden = true;
}

function addSkillDetail(label, value) {
    if (value === undefined || value === null ||
        String(value).trim() === "") {
        return;
    }

    const section = document.createElement("div");
    section.className = "skill-detail-section";

    const heading = document.createElement("h3");
    heading.textContent = label;

    const paragraph = document.createElement("p");
    paragraph.textContent = String(value);

    section.append(heading, paragraph);
    skillDetailView.appendChild(section);
}

function showSkillDetails() {
    const skill = getSelectedSkill();
    if (!skill) return;

    skillEditForm.hidden = true;
    skillDetailView.hidden = false;
    skillViewActions.hidden = false;

    document.getElementById("sidebarTitle").textContent =
        getSkillDisplayName(skill);

    skillDetailView.replaceChildren();

    const tagsContainer = document.createElement("div");
    tagsContainer.className = "skill-detail-tags";

    const tags = [
        skill.type || "Skill",
        skill.source || "RAW",
        ...(skill.tags || [])
    ];

    if (skill.damageEffect) {
        tags.push("Damage Effect: " + skill.damageEffect);
    }

    if (skill.favored) {
        tags.push("Favored: " + skill.favored);
    }

    [...new Set(tags)].forEach(tag => {
        const badge = document.createElement("span");
        badge.className = "skill-detail-tag";
        badge.textContent = tag;
        tagsContainer.appendChild(badge);
    });

    skillDetailView.appendChild(tagsContainer);

    addSkillDetail("Rank", skill.rank);
    addSkillDetail("Enhanced Rank", skill.enhancedRank);
    addSkillDetail("Enhanced Rank Note", skill.enhancedRankNote);
    addSkillDetail("Stat", skill.stat);
    addSkillDetail("Current Stat Mod", getSkillStatMod(skill.stat));

    addSkillDetail("Mana Cost", skill.manaCost);
    addSkillDetail("Cooldown", skill.cooldown);
    addSkillDetail("Duration", skill.duration);
    addSkillDetail("Range", skill.range);

    addSkillDetail("Limitations", skill.limitations);
    addSkillDetail("Description", skill.description);

    addSkillDetail("Rank 5", skill.rank5);
    addSkillDetail("Rank 10", skill.rank10);
    addSkillDetail("Rank 15", skill.rank15);
}

function beginSkillEdit() {
    const skill = getSelectedSkill();
    if (!skill) return;

    skillDetailView.hidden = true;
    skillViewActions.hidden = true;
    skillEditForm.hidden = false;

    document.getElementById("sidebarTitle").textContent =
        "EDIT: " + getSkillDisplayName(skill);

    for (const [property, elementId] of Object.entries(skillEditFields)) {
        const element = document.getElementById(elementId);

        element.value = property === "source"
            ? (skill.source || "RAW")
            : (skill[property] ?? "");
    }

    
editingSkillTags = (skill.tags || []).filter(
    tag => !["RAW", "Custom*", "Skill", "Spell"].includes(tag)
);

renderSelectedSkillTags();

document.getElementById("skillTagInput").value = "";
document.getElementById("skillTagSuggestions").hidden = true;

}

skillEditForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const skill = getSelectedSkill();
    if (!skill) return;

    const newName = document.getElementById("editSkillName")
        .value.trim().replace(/\*+$/, "").trim();

    if (!newName) {
        alert("Please enter a skill or spell name.");
        return;
    }

    for (const [property, elementId] of Object.entries(skillEditFields)) {
        skill[property] = document.getElementById(elementId).value.trim();
    }

    skill.name = newName;

    skill.tags = [...editingSkillTags];

    saveCharacter();
    renderSkills();
    showSkillDetails();
});

document.getElementById("editSkillButton")
    .addEventListener("click", beginSkillEdit);

document.getElementById("cancelSkillEdit")
    .addEventListener("click", showSkillDetails);

document.getElementById("closeSkillSidebar")
    .addEventListener("click", closeSkillSidebar);

skillOverlay.addEventListener("click", closeSkillSidebar);

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !skillSidebar.hidden) {
        closeSkillSidebar();
    }
});

document.getElementById("deleteSkillButton")
    .addEventListener("click", function () {
        const skill = getSelectedSkill();
        if (!skill) return;

        const confirmed = confirm(
            "Delete " + getSkillDisplayName(skill) + "?"
        );

        if (!confirmed) return;

        character.skills = character.skills.filter(
            entry => entry.id !== selectedSkillId
        );

        saveCharacter();
        closeSkillSidebar();
        renderSkills();
    });

displayCharacter();

// ------------------------------------
// TAGS & SEARCH - VERSION 0.5.2
// ------------------------------------

const RAW_SKILL_TAGS = [
    "Melee Attack",
    "STR",
    "DEX",
    "Damage Effect",
    "Passive",
    "Ranged Attack",
    "INT",
    "CHA",
    "CON",
    "Interrupt",
    "Spell",
    "Favored",
    "Magic Attack",
    "Necrotic",
    "Sonic",
    "Bludgeoning",
    "Slashing",
    "Piercing",
    "Mind Control",
    "Fire",
    "Ice",
    "AOE",
    "Heal",
    "Holy",
    "Psychic",
    "Electric",
    "Acid",
    "Poison",
    "Force"
];

let editingSkillTags = [];

function getAvailableSkillTags() {
    const savedCustomTags = JSON.parse(
        localStorage.getItem("dccCustomSkillTags") || "[]"
    );

    return [...new Set([
        ...RAW_SKILL_TAGS,
        ...savedCustomTags
    ])].sort((a, b) => a.localeCompare(b));
}

function rememberCustomTag(tag) {
    const tags = JSON.parse(
        localStorage.getItem("dccCustomSkillTags") || "[]"
    );

    if (!tags.some(existing =>
        existing.toLowerCase() === tag.toLowerCase()
    )) {
        tags.push(tag);
        localStorage.setItem(
            "dccCustomSkillTags",
            JSON.stringify(tags)
        );
    }
}

function renderSelectedSkillTags() {
    const container = document.getElementById("selectedSkillTags");
    container.replaceChildren();

    editingSkillTags.forEach(tag => {
        const badge = document.createElement("span");
        badge.className = "skill-detail-tag";

        badge.append(document.createTextNode(tag));

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Remove " + tag);

        remove.addEventListener("click", () => {
            editingSkillTags = editingSkillTags.filter(
                existing => existing !== tag
            );
            renderSelectedSkillTags();
        });

        badge.appendChild(remove);
        container.appendChild(badge);
    });
}

function addEditingSkillTag(tag) {
    tag = tag.trim();
    if (!tag) return;

    if (!editingSkillTags.some(existing =>
        existing.toLowerCase() === tag.toLowerCase()
    )) {
        editingSkillTags.push(tag);
    }

    document.getElementById("skillTagInput").value = "";
    document.getElementById("skillTagSuggestions").hidden = true;

    renderSelectedSkillTags();
}

function showTagSuggestions() {
    const input = document.getElementById("skillTagInput");
    const query = input.value.trim().toLowerCase();
    const suggestions = document.getElementById("skillTagSuggestions");

    suggestions.replaceChildren();

    if (!query) {
        suggestions.hidden = true;
        return;
    }

    const matches = getAvailableSkillTags().filter(tag =>
        tag.toLowerCase().includes(query) &&
        !editingSkillTags.some(existing =>
            existing.toLowerCase() === tag.toLowerCase()
        )
    );

    matches.slice(0, 12).forEach(tag => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = tag;

        button.addEventListener("click", () => {
            addEditingSkillTag(tag);
        });

        suggestions.appendChild(button);
    });

    suggestions.hidden = matches.length === 0;
}

document.getElementById("skillTagInput")
    .addEventListener("input", showTagSuggestions);

document.getElementById("skillTagInput")
    .addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();

            const typed = event.target.value.trim();
            if (!typed) return;

            const match = getAvailableSkillTags().find(
                tag => tag.toLowerCase() === typed.toLowerCase()
            );

            if (match) {
                addEditingSkillTag(match);
            } else {
                rememberCustomTag(typed);
                addEditingSkillTag(typed);
            }
        }
    });

document.getElementById("addCustomTagButton")
    .addEventListener("click", () => {
        const typed = document.getElementById("skillTagInput")
            .value.trim();

        if (!typed) return;

        const match = getAvailableSkillTags().find(
            tag => tag.toLowerCase() === typed.toLowerCase()
        );

        if (!match) rememberCustomTag(typed);

        addEditingSkillTag(match || typed);
    });


// SEARCH & FILTERS

const skillFilterIds = [
    "skillSearch",
    "skillTypeFilter",
    "skillStatFilter",
    "skillSourceFilter",
    "skillTagFilter"
];

skillFilterIds.forEach(id => {
    document.getElementById(id).addEventListener("input", renderSkills);
});

function refreshSkillTagFilter() {
    const select = document.getElementById("skillTagFilter");
    const previous = select.value;

    const usedTags = new Set();

    character.skills.forEach(skill => {
        (skill.tags || []).forEach(tag => usedTags.add(tag));

        if (skill.damageEffect) usedTags.add("Damage Effect");
        if (skill.favored) usedTags.add("Favored");
    });

    select.replaceChildren(new Option("All Tags", ""));

    [...usedTags].sort().forEach(tag => {
        select.add(new Option(tag, tag));
    });

    select.value = [...select.options].some(
        option => option.value === previous
    ) ? previous : "";
}

// ------------------------------------
// INVENTORY - VERSION 0.6
// ------------------------------------

// Keep existing inventory data. Never reset it.
if (!Array.isArray(character.inventory)) {
    character.inventory = [];
}

// Create Gold and Misc Junk only if they don't already exist.

ensureCharacterCurrency(character);
saveCharacter();


const inventoryList = document.getElementById("inventoryList");
const inventoryAddForm = document.getElementById("inventoryAddForm");
const inventorySidebar = document.getElementById("inventorySidebar");
const inventoryOverlay = document.getElementById("inventoryOverlay");

let selectedInventoryId = null;
let inventoryQuantityMode = "set";

function getSelectedInventoryItem() {
    return character.inventory.find(item =>
        item.id === selectedInventoryId
    );
}

function renderInventory() {

    inventoryList.replaceChildren();

    const items = character.inventory
        
.filter(item =>
    (item.location || "Inventory") === "Inventory" &&
    (
        !item.hidden ||
        document.getElementById("showHiddenInventory").checked
    )
)

        .sort((a, b) => {
            // Gold and Misc Junk always appear first.
            const priority = item => {
                if (item.systemId === "gold") return 0;
                if (item.systemId === "misc-junk") return 1;
                return item.pinned ? 2 : 3;
            };

            return priority(a) - priority(b);
        });

    items.forEach(item => {

        const button = document.createElement("button");
        button.type = "button";
        button.className = "inventory-item";
        button.classList.toggle("is-hidden", !!item.hidden);

        const name = document.createElement("span");
        name.className = "inventory-item-name";

        if (item.pinned) {
            const pin = document.createElement("span");
            pin.className = "inventory-item-pin";
            pin.textContent = "📌";
            name.appendChild(pin);
        }

        name.appendChild(
            document.createTextNode(item.name || "Unnamed Item")
        );

        const quantity = document.createElement("span");
        quantity.className = "inventory-item-quantity";
        quantity.textContent =
            "×" + Number(item.quantity || 0).toLocaleString();

        button.append(name, quantity);

        button.addEventListener("click", () => {
            openInventorySidebar(item.id);
        });

        inventoryList.appendChild(button);
    });
}

function openInventorySidebar(itemId) {

    selectedInventoryId = itemId;

    const item = getSelectedInventoryItem();
    if (!item) return;

    inventorySidebar.hidden = false;
    inventoryOverlay.hidden = false;

    inventoryQuantityMode = "set";

    document.querySelectorAll(".quantity-mode").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.mode === inventoryQuantityMode
        );
    });

    document.getElementById("inventorySidebarTitle").textContent =
        item.name;

    document.getElementById("inventoryQuantityAmount").value = "";
    document.getElementById("inventoryQuantityError").textContent = "";

    updateInventoryQuantityDisplay();
    showInventoryItemDetails();
}

function closeInventorySidebar() {
    selectedInventoryId = null;
    inventorySidebar.hidden = true;
    inventoryOverlay.hidden = true;
}

function updateInventoryQuantityDisplay() {

    const item = getSelectedInventoryItem();
    if (!item) return;

    // Enable Undo only when a previous quantity is available.
    const undoButton =
        document.getElementById("undoInventoryQuantity");

    undoButton.disabled =
        !Number.isSafeInteger(item.previousQuantity) ||
        item.previousQuantity < 0;

    const current = Number(item.quantity || 0);

    document.getElementById("inventoryCurrentQuantity").textContent =
        current.toLocaleString();

    const amountInput =
        document.getElementById("inventoryQuantityAmount");

    const preview =
        document.getElementById("inventoryQuantityPreview");

    const rawAmount = amountInput.value.trim();

    if (rawAmount === "") {
        preview.textContent = "";
        return;
    }

    const amount = Number(rawAmount);

    if (!Number.isSafeInteger(amount) || amount < 0) {
        preview.textContent = "Enter a valid whole number.";
        return;
    }

    let result;

    if (inventoryQuantityMode === "set") {
        result = amount;
    } else if (inventoryQuantityMode === "add") {
        result = current + amount;
    } else {
        result = current - amount;
    }

    if (!Number.isSafeInteger(result) || result < 0) {
        preview.textContent = "That would create an invalid quantity.";
        return;
    }

   
    if (inventoryQuantityMode === "set") {
        preview.textContent =
            current.toLocaleString() + " → " +
            result.toLocaleString();
    } else {
        const symbol = inventoryQuantityMode === "add" ? "+" : "−";

        preview.textContent =
            current.toLocaleString() + " " +
            symbol + " " +
            amount.toLocaleString() + " = " +
            result.toLocaleString();
    }
}

document.getElementById("addInventoryButton")
    .addEventListener("click", () => {
        inventoryAddForm.hidden = false;
        document.getElementById("newItemName").focus();
    });

document.getElementById("cancelInventoryAdd")
    .addEventListener("click", () => {
        inventoryAddForm.reset();
        inventoryAddForm.hidden = true;
    });

inventoryAddForm.addEventListener("submit", event => {
    event.preventDefault();

    const name =
        document.getElementById("newItemName").value.trim();

    const rawQuantity =
        document.getElementById("newItemQuantity").value.trim();

    const quantity = Number(rawQuantity);

    if (!name) return;

    if (
        rawQuantity === "" ||
        !Number.isSafeInteger(quantity) ||
        quantity < 0
    ) {
        alert("Quantity must be a whole number of zero or more.");
        return;
    }

    character.inventory.push({
        id: crypto.randomUUID(),
        name: name,
        quantity: quantity,
        location: "Inventory",
        pinned: false,
        hidden: false,
        tags: [],
        description: ""
    });

    saveCharacter();
    renderInventory();

    inventoryAddForm.reset();
    inventoryAddForm.hidden = true;
});

document.querySelectorAll(".quantity-mode").forEach(button => {
    button.addEventListener("click", () => {
        inventoryQuantityMode = button.dataset.mode;

        document.querySelectorAll(".quantity-mode").forEach(other => {
            other.classList.toggle(
                "active",
                other === button
            );
        });

        updateInventoryQuantityDisplay();
    });
});

document.getElementById("inventoryQuantityAmount")
    .addEventListener("input", updateInventoryQuantityDisplay);

document.getElementById("inventoryQuantityForm")
    .addEventListener("submit", event => {
        event.preventDefault();

        const item = getSelectedInventoryItem();
        if (!item) return;

        const input =
            document.getElementById("inventoryQuantityAmount");

        const rawAmount = input.value.trim();
        const amount = Number(rawAmount);

        const error =
            document.getElementById("inventoryQuantityError");

        error.textContent = "";

        if (
            rawAmount === "" ||
            !Number.isSafeInteger(amount) ||
            amount < 0
        ) {
            error.textContent = "Enter a valid whole number.";
            return;
        }

        const current = Number(item.quantity || 0);

        let nextQuantity;

        if (inventoryQuantityMode === "set") {
            nextQuantity = amount;
        } else if (inventoryQuantityMode === "add") {
            nextQuantity = current + amount;
        } else {
            nextQuantity = current - amount;
        }

        if (
            !Number.isSafeInteger(nextQuantity) ||
            nextQuantity < 0
        ) {
            error.textContent =
                "Quantity cannot be negative or exceed safe limits.";
            return;
        }

       
// Only record a change when the quantity actually changes.
if (nextQuantity !== current) {
    item.previousQuantity = current;
    item.quantity = nextQuantity;
}

saveCharacter();
renderInventory();


        input.value = "";
        updateInventoryQuantityDisplay();
    });

document.getElementById("closeInventorySidebar")
    .addEventListener("click", closeInventorySidebar);

inventoryOverlay.addEventListener("click", closeInventorySidebar);

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !inventorySidebar.hidden) {
        closeInventorySidebar();
    }
});

// First inventory display.
renderInventory();

// ------------------------------------
// INVENTORY QUANTITY UNDO
// ------------------------------------

document.getElementById("undoInventoryQuantity")
    .addEventListener("click", function () {

        const item = getSelectedInventoryItem();
        if (!item) return;

        if (
            !Number.isSafeInteger(item.previousQuantity) ||
            item.previousQuantity < 0
        ) {
            return;
        }

        // Restore the previous quantity.
        item.quantity = item.previousQuantity;

        // Clear the undo history so Undo cannot be clicked twice.
        delete item.previousQuantity;

        saveCharacter();
        renderInventory();
        updateInventoryQuantityDisplay();

        document.getElementById("inventoryQuantityAmount").value = "";
        document.getElementById("inventoryQuantityPreview").textContent = "";
        document.getElementById("inventoryQuantityError").textContent = "";
    });

// ------------------------------------
// INVENTORY DETAILS - VERSION 0.6.2
// ------------------------------------

const INVENTORY_STARTER_TAGS = [
    "Equipment",
    "Accessory",
    "Consumable"
];

let editingInventoryTags = [];

function getInventoryTagVocabulary() {
    const saved = JSON.parse(
        localStorage.getItem("dccInventoryTags") || "[]"
    );

    return [...new Set([
        ...INVENTORY_STARTER_TAGS,
        ...saved,
        ...character.inventory.flatMap(item => item.tags || [])
    ])].sort((a, b) => a.localeCompare(b));
}

function refreshInventoryTagSuggestions() {
    const list = document.getElementById(
        "inventoryTagSuggestions"
    );

    list.replaceChildren();

    getInventoryTagVocabulary().forEach(tag => {
        const option = document.createElement("option");
        option.value = tag;
        list.appendChild(option);
    });
}

function renderInventoryEditTags() {
    const container = document.getElementById(
        "inventoryEditTags"
    );

    container.replaceChildren();

    editingInventoryTags.forEach(tag => {
        const badge = document.createElement("span");
        badge.className = "inventory-tag";
        badge.append(document.createTextNode(tag));

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Remove " + tag);

        remove.addEventListener("click", () => {
            editingInventoryTags =
                editingInventoryTags.filter(t => t !== tag);

            renderInventoryEditTags();
        });

        badge.appendChild(remove);
        container.appendChild(badge);
    });
}

function addInventoryEditingTag() {
    const input = document.getElementById("inventoryTagInput");
    const typed = input.value.trim();

    if (!typed) return;

    const existing = getInventoryTagVocabulary().find(
        tag => tag.toLowerCase() === typed.toLowerCase()
    );

    const tag = existing || typed;

    if (!editingInventoryTags.some(
        t => t.toLowerCase() === tag.toLowerCase()
    )) {
        editingInventoryTags.push(tag);
    }

    if (!existing) {
        const saved = JSON.parse(
            localStorage.getItem("dccInventoryTags") || "[]"
        );

        saved.push(tag);

        localStorage.setItem(
            "dccInventoryTags",
            JSON.stringify([...new Set(saved)])
        );
    }

    input.value = "";
    refreshInventoryTagSuggestions();
    renderInventoryEditTags();
}

document.getElementById("addInventoryTag")
    .addEventListener("click", addInventoryEditingTag);

document.getElementById("inventoryTagInput")
    .addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            addInventoryEditingTag();
        }
    });

function showInventoryItemDetails() {
    const item = getSelectedInventoryItem();
    if (!item) return;

    document.getElementById("inventoryItemDetails").hidden = false;
    document.getElementById("inventoryEditForm").hidden = true;

    document.getElementById("inventorySidebarTitle").textContent =
        item.name;

    const tagsContainer =
        document.getElementById("inventoryItemTags");

    tagsContainer.replaceChildren();

    const displayTags = [
        ...(item.tags || []),
        ...(item.equipmentSlot ? [item.equipmentSlot] : [])
    ];

    displayTags.forEach(tag => {
        const badge = document.createElement("span");
        badge.className = "inventory-tag";
        badge.textContent = tag;
        tagsContainer.appendChild(badge);
    });

    document.getElementById("inventoryItemDescription").textContent =
        item.description || "";

    document.getElementById("pinInventoryItem").textContent =
        item.pinned ? "UNPIN" : "PIN";

    document.getElementById("hideInventoryItem").textContent =
        item.hidden ? "UNHIDE" : "HIDE";
}

document.getElementById("editInventoryItem")
    .addEventListener("click", () => {
        const item = getSelectedInventoryItem();
        if (!item) return;

        document.getElementById("inventoryItemDetails").hidden = true;
        document.getElementById("inventoryEditForm").hidden = false;

        document.getElementById("editInventoryName").value =
            item.name || "";

        document.getElementById("editInventoryLocation").value =
            item.location || "Inventory";

        document.getElementById("editInventorySlot").value =
            item.equipmentSlot || "";
        
document.getElementById("editInventoryHands").value =
    item.handsRequired || "";

updateWeaponHandsVisibility();

        document.getElementById("editInventoryDescription").value =
            item.description || "";

        editingInventoryTags = [...(item.tags || [])];

        document.getElementById("inventoryTagInput").value = "";

        refreshInventoryTagSuggestions();
        renderInventoryEditTags();
    });

document.getElementById("cancelInventoryEdit")
    .addEventListener("click", showInventoryItemDetails);

document.getElementById("inventoryEditForm")
    .addEventListener("submit", event => {
        event.preventDefault();

        const item = getSelectedInventoryItem();
        if (!item) return;

        const name = document.getElementById(
            "editInventoryName"
        ).value.trim();

        if (!name) return;

        item.name = name;

        item.location = document.getElementById(
            "editInventoryLocation"
        ).value;

        item.equipmentSlot = document.getElementById(
            "editInventorySlot"
        ).value;
        
item.handsRequired =
    item.equipmentSlot === "Weapon"
        ? document.getElementById("editInventoryHands").value
        : "";

        item.description = document.getElementById(
            "editInventoryDescription"
        ).value;

        item.tags = [...editingInventoryTags];

        saveCharacter();
        renderInventory();
        showInventoryItemDetails();
    });

document.getElementById("pinInventoryItem")
    .addEventListener("click", () => {
        const item = getSelectedInventoryItem();
        if (!item) return;

        // Gold and Misc Junk remain pinned automatically.
        if (item.systemId === "gold" ||
            item.systemId === "misc-junk") {
            item.pinned = true;
        } else {
            item.pinned = !item.pinned;
        }

        saveCharacter();
        renderInventory();
        showInventoryItemDetails();
    });

document.getElementById("hideInventoryItem")
    .addEventListener("click", () => {
        const item = getSelectedInventoryItem();
        if (!item) return;

        // Keep our two default currency entries visible.
        if (item.systemId === "gold" ||
            item.systemId === "misc-junk") {
            return;
        }

        item.hidden = !item.hidden;

        saveCharacter();
        renderInventory();
        showInventoryItemDetails();
    });

document.getElementById("duplicateInventoryItem")
    .addEventListener("click", () => {
        const item = getSelectedInventoryItem();
        if (!item) return;

        const duplicate = {
            ...item,
            id: crypto.randomUUID(),
            systemId: undefined,
            tags: [...(item.tags || [])],
            previousQuantity: undefined,
            pinned: false,
            hidden: false
        };

        character.inventory.push(duplicate);

        saveCharacter();
        renderInventory();

        // Open the newly created copy.
        openInventorySidebar(duplicate.id);
    });

document.getElementById("showHiddenInventory")
    .addEventListener("change", renderInventory);

// ------------------------------------
// EQUIPPED & HOTLIST - VERSION 0.7
// ------------------------------------

const EQUIPMENT_SLOTS = [
    "Weapon",
    "Shield",
    "Head",
    "Torso",
    "Arms",
    "Hands/Holding",
    "Legs",
    "Feet",
    "Accessories"
];

function renderEquipped() {
    const container = document.getElementById("equippedList");
    container.replaceChildren();

    const equippedItems = character.inventory.filter(
        item => item.location === "Equipped" && !item.hidden
    );

    const groups = [...EQUIPMENT_SLOTS];

    // Preserve items with older or custom equipment slots.
    equippedItems.forEach(item => {
        const slot = item.equipmentSlot || "Unassigned";
        if (!groups.includes(slot)) groups.push(slot);
    });

    groups.forEach(slot => {
        const group = document.createElement("div");
        group.className = "equipment-slot-group";

        const heading = document.createElement("h3");
        heading.textContent = slot;
        group.appendChild(heading);

        const itemsInSlot = equippedItems.filter(
            item => (item.equipmentSlot || "Unassigned") === slot
        );

        if (itemsInSlot.length === 0) {
            const empty = document.createElement("div");
            empty.className = "equipment-slot-empty";
            empty.textContent = "Empty";
            group.appendChild(empty);
        } else {
            const list = document.createElement("div");
            list.className = "equipment-slot-items";

            itemsInSlot.forEach(item => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "equipped-item";

                const name = document.createElement("span");
                name.className = "equipped-item-name";
                name.textContent = item.name;

                const detail = document.createElement("span");
                detail.className = "equipped-item-detail";

                const details = [];

                if (item.quantity !== 1) {
                    details.push("×" + item.quantity);
                }

                if (slot === "Weapon" && item.handsRequired) {
                    const labels = {
                        "1": "1H",
                        "2": "2H",
                        versatile: "Versatile"
                    };

                    details.push(
                        labels[item.handsRequired] ||
                        item.handsRequired
                    );
                }

                detail.textContent = details.join(" · ");

                button.append(name, detail);

                button.addEventListener("click", () => {
                    openInventorySidebar(item.id);
                });

                list.appendChild(button);
            });

            group.appendChild(list);
        }

        container.appendChild(group);
    });
}

function renderHotlist() {
    const container = document.getElementById("hotlistList");
    container.replaceChildren();

    const hotlistItems = character.inventory.filter(
        item => item.location === "Hotlist" && !item.hidden
    );

    hotlistItems.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "inventory-item";

        const name = document.createElement("span");
        name.className = "inventory-item-name";
        name.textContent = item.name;

        const quantity = document.createElement("span");
        quantity.className = "inventory-item-quantity";
        quantity.textContent =
            Number(item.quantity || 0).toLocaleString();

        button.append(name, quantity);

        button.addEventListener("click", () => {
            openInventorySidebar(item.id);
        });

        container.appendChild(button);
    });
}

function renderItemLocations() {
    renderEquipped();
    renderHotlist();
}

// Show the weapon-specific field only for weapons.
function updateWeaponHandsVisibility() {
    const isWeapon =
        document.getElementById("editInventorySlot").value === "Weapon";

    document.getElementById(
        "inventoryWeaponHandsField"
    ).hidden = !isWeapon;
}

document.getElementById("editInventorySlot")
    .addEventListener("change", updateWeaponHandsVisibility);

// Whenever an item is saved or moved, update all three views.
const originalRenderInventory = renderInventory;

renderInventory = function () {
    originalRenderInventory();
    renderItemLocations();
};

renderItemLocations();

// ------------------------------------
// CHARACTER SELECTION SCREEN - V0.8A
// ------------------------------------

const characterLibraryScreen =
    document.getElementById("characterLibraryScreen");

const characterLibraryCards =
    document.getElementById("characterLibraryCards");

const returnToCharactersButton =
    document.getElementById("returnToCharacters");

function renderCharacterLibrary() {
    characterLibraryCards.replaceChildren();

    characterLibrary.characters.forEach(entry => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "character-library-card";

        const label = document.createElement("div");
        label.className = "crawler-label";
        label.textContent = "CRAWLER PROFILE";

        const name = document.createElement("h2");
        name.textContent =
            entry.identity.name || "Unnamed Crawler";

        const details = document.createElement("p");
        details.textContent =
            "Level " + (entry.identity.level ?? 1) +
            " · " + (entry.identity.race || "Unknown Race");

        const floor = document.createElement("p");
        floor.textContent =
            "Floor " + (entry.identity.floor ?? 1);

        card.append(label, name, details, floor);

        card.addEventListener("click", () => {
            selectCharacter(entry.id);
        });

        characterLibraryCards.appendChild(card);
    });
}

function selectCharacter(characterId) {
    const selected = characterLibrary.characters.find(
        entry => entry.id === characterId
    );

    if (!selected) return;

    // Close any open editors from the previous crawler.
    closeSkillSidebar();
    closeInventorySidebar();

    skillForm.hidden = true;
    clearSkillForm();

    inventoryAddForm.reset();
    inventoryAddForm.hidden = true;

    // Switch the active character.
    character = prepareCharacter(selected);
    characterLibrary.activeId = character.id;

    ensureCharacterCurrency(character);

    // Clear filters so the new crawler's skills are visible.
    [
        "skillSearch",
        "skillTypeFilter",
        "skillStatFilter",
        "skillSourceFilter",
        "skillTagFilter"
    ].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = "";
    });

    const showHidden =
        document.getElementById("showHiddenInventory");

    if (showHidden) showHidden.checked = false;

    // Refresh every character-dependent section.
    displayCharacter();
    renderSkills();
    renderInventory();

    saveCharacter();

    characterLibraryScreen.hidden = true;
    returnToCharactersButton.hidden = false;

    window.scrollTo(0, 0);
}

function showCharacterLibrary() {
    saveCharacter();
    renderCharacterLibrary();

    characterLibraryScreen.hidden = false;
    returnToCharactersButton.hidden = true;
}

returnToCharactersButton.addEventListener(
    "click",
    showCharacterLibrary
);

// Always start at the character-selection screen.
renderCharacterLibrary();
characterLibraryScreen.hidden = false;
returnToCharactersButton.hidden = true;

// ------------------------------------
// CHARACTER MANAGEMENT - VERSION 0.8B
// ------------------------------------

function createNewCrawler() {
    const name = prompt("Name your new crawler:");

    if (name === null) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
        alert("Your crawler needs a name!");
        return;
    }

    const newCharacter = createBlankCharacter();
    newCharacter.identity.name = trimmedName;

    characterLibrary.characters.push(newCharacter);

    // Save the library before switching.
    localStorage.setItem(
        CHARACTER_LIBRARY_KEY,
        JSON.stringify(characterLibrary)
    );

    selectCharacter(newCharacter.id);
}

function renameCrawler(characterId) {
    const target = characterLibrary.characters.find(
        entry => entry.id === characterId
    );

    if (!target) return;

    const oldName = target.identity.name || "Unnamed Crawler";

    const newName = prompt("Rename crawler:", oldName);

    if (newName === null) return;

    const trimmedName = newName.trim();

    if (!trimmedName) {
        alert("Crawler name cannot be empty.");
        return;
    }

    target.identity.name = trimmedName;

    // Refresh the sheet if this is the active crawler.
    if (character.id === target.id) {
        displayCharacter();
    }

    saveCharacter();
    renderCharacterLibrary();
}

function duplicateCrawler(characterId) {
    const original = characterLibrary.characters.find(
        entry => entry.id === characterId
    );

    if (!original) return;

    const copy = structuredClone(original);

    copy.id = crypto.randomUUID();

    copy.identity.name =
        (original.identity.name || "Unnamed Crawler") + " (Copy)";

    characterLibrary.characters.push(copy);

    saveCharacter();
    renderCharacterLibrary();
}

function deleteCrawler(characterId) {
    if (characterLibrary.characters.length <= 1) {
        alert("You cannot delete your last crawler.");
        return;
    }

    const target = characterLibrary.characters.find(
        entry => entry.id === characterId
    );

    if (!target) return;

    const name = target.identity.name || "Unnamed Crawler";

    const confirmed = confirm(
        "Permanently delete " + name + "?\n\n" +
        "This will remove their stats, skills, equipment, " +
        "inventory, and all other character data.\n\n" +
        "This cannot be undone."
    );

    if (!confirmed) return;

    characterLibrary.characters =
        characterLibrary.characters.filter(
            entry => entry.id !== characterId
        );

    // If we deleted the active crawler, select a survivor.
    if (characterLibrary.activeId === characterId) {
        characterLibrary.activeId =
            characterLibrary.characters[0].id;

        character = characterLibrary.characters[0];
    }

    saveCharacter();
    renderCharacterLibrary();
}

// Replace the Version 0.8A card renderer with management cards.
renderCharacterLibrary = function () {
    characterLibraryCards.replaceChildren();

    characterLibrary.characters.forEach(entry => {
        const card = document.createElement("div");
        card.className = "character-library-card";

        const label = document.createElement("div");
        label.className = "crawler-label";
        label.textContent = "CRAWLER PROFILE";

        const name = document.createElement("h2");
        name.textContent =
            entry.identity.name || "Unnamed Crawler";

        const details = document.createElement("p");
        details.textContent =
            "Level " + (entry.identity.level ?? 1) +
            " · " + (entry.identity.race || "Unknown Race");

        const floor = document.createElement("p");
        floor.textContent =
            "Floor " + (entry.identity.floor ?? 1);

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "crawler-open-button";
        openButton.textContent = "OPEN CHARACTER";

        openButton.addEventListener("click", () => {
            selectCharacter(entry.id);
        });

        const actions = document.createElement("div");
        actions.className = "crawler-card-actions";

        const renameButton = document.createElement("button");
        renameButton.type = "button";
        renameButton.textContent = "RENAME";
        renameButton.addEventListener("click", () => {
            renameCrawler(entry.id);
        });

        const duplicateButton = document.createElement("button");
        duplicateButton.type = "button";
        duplicateButton.textContent = "DUPLICATE";
        duplicateButton.addEventListener("click", () => {
            duplicateCrawler(entry.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "DELETE";
        deleteButton.className = "crawler-delete-button";
        deleteButton.addEventListener("click", () => {
            deleteCrawler(entry.id);
        });

        actions.append(
            renameButton,
            duplicateButton,
            deleteButton
        );

        card.append(
            label,
            name,
            details,
            floor,
            openButton,
            actions
        );

        characterLibraryCards.appendChild(card);
    });

    // New character card.
    const newCard = document.createElement("button");
    newCard.type = "button";
    newCard.className =
        "character-library-card crawler-new-card";

    const plus = document.createElement("div");
    plus.className = "crawler-new-plus";
    plus.textContent = "+";

    const heading = document.createElement("h2");
    heading.textContent = "NEW CRAWLER";

    const description = document.createElement("p");
    description.textContent =
        "Create a fresh character sheet.";

    newCard.append(plus, heading, description);

    newCard.addEventListener("click", createNewCrawler);

    characterLibraryCards.appendChild(newCard);
};

// Refresh the library with the new management controls.
renderCharacterLibrary();
