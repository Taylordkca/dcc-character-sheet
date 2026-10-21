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

let skillSortColumn = "";
let skillSortDirection = 1;


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
        if (skill.pinned) return true;
        if (skill.hidden && !document.getElementById("showHiddenSkills")?.checked) return false;

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

    filteredSkills.sort((a,b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        if (a.pinned && b.pinned) return (a.pinOrder ?? 0) - (b.pinOrder ?? 0);
        if (!skillSortColumn) return 0;
        const getValue = s => skillSortColumn === "mod" ? getSkillStatMod(s.stat) : (s[skillSortColumn] ?? "");
        const x = String(getValue(a)).trim(), y = String(getValue(b)).trim();
        const xn = Number(x), yn = Number(y);
        const cmp = x !== "" && y !== "" && Number.isFinite(xn) && Number.isFinite(yn)
            ? xn - yn : x.localeCompare(y, undefined, {numeric:true, sensitivity:"base"});
        return cmp * skillSortDirection;
    });
    filteredSkills.forEach(skill => {

        const row = document.createElement("tr");
        row.tabIndex = 0;
        row.classList.toggle("skill-hidden", !!skill.hidden);

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
    (skill.pinned ? "📌 " : "") + getSkillDisplayName(skill) + (skill.hidden ? " (hidden)" : ""),
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
    aiFavor: "editSkillAiFavor",
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

    document.getElementById("pinSkillButton").textContent = skill.pinned ? "UNPIN" : "PIN";
    document.getElementById("hideSkillButton").textContent = skill.hidden ? "UNHIDE" : "HIDE";
    addSkillDetail("Rank", skill.rank);
    addSkillDetail("Enhanced Rank", skill.enhancedRank);
    addSkillDetail("Enhanced Rank Note", skill.enhancedRankNote);
    addSkillDetail("Stat", skill.stat);
    addSkillDetail("Current Stat Mod", getSkillStatMod(skill.stat));

    addSkillDetail("Mana Cost", skill.manaCost);
    addSkillDetail("Cooldown", skill.cooldown);
    addSkillDetail("Duration", skill.duration);
    addSkillDetail("Range", skill.range);
    addSkillDetail("AI Favor", skill.aiFavor);

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

    const inventoryQuery = (document.getElementById("inventorySearch")?.value || "").trim().toLowerCase();
    const items = character.inventory
        
.filter(item =>
    (item.location || "Inventory") === "Inventory" &&
    (!inventoryQuery || [item.name, item.description, ...(item.tags || [])].join(" ").toLowerCase().includes(inventoryQuery)) &&
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
    ).sort((a,b) => (a.hotlistOrder ?? 0) - (b.hotlistOrder ?? 0));

    // Informational only: 10 is a soft guideline, never a restriction.
    const hotlistHeader = document.querySelector(
        '[data-section="hotlist"] .movable-section-heading'
    );
    if (hotlistHeader) {
        let counter = hotlistHeader.querySelector('.hotlist-cap-count');
        if (!counter) {
            counter = document.createElement('span');
            counter.className = 'hotlist-cap-count';
            hotlistHeader.appendChild(counter);
        }
        counter.textContent = `· ${hotlistItems.length} / 10`;
        counter.title = 'Suggested hotlist size; no enforced limit';
    }

    hotlistItems.forEach((item, index) => {
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

        const controls = document.createElement("span");
        controls.className = "hotlist-order-controls";
        [["↑", -1], ["↓", 1]].forEach(([label, delta]) => {
            const arrow = document.createElement("button");
            arrow.type = "button";
            arrow.textContent = label;
            arrow.disabled = index + delta < 0 || index + delta >= hotlistItems.length;
            arrow.title = label === "↑" ? "Move item up" : "Move item down";
            arrow.addEventListener("click", () => {
                const other = hotlistItems[index + delta];
                hotlistItems.forEach((entry, i) => { entry.hotlistOrder = i; });
                const temp = item.hotlistOrder;
                item.hotlistOrder = other.hotlistOrder;
                other.hotlistOrder = temp;
                saveCharacter(); renderHotlist();
            });
            controls.appendChild(arrow);
        });
        const line = document.createElement("div");
        line.className = "hotlist-order-row";
        line.append(button, controls);
        container.appendChild(line);
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

const exportButton = document.createElement("button");
exportButton.type = "button";
exportButton.textContent = "EXPORT";

exportButton.addEventListener("click", () => {
    exportCrawler(entry.id);
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
    exportButton,
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

// ------------------------------------
// CHARACTER EXPORT / IMPORT - V0.8C
// ------------------------------------

const CHARACTER_EXPORT_FORMAT = "dcc-character";
const LIBRARY_EXPORT_FORMAT = "dcc-library";
const EXPORT_VERSION = 1;

function safeFileName(name) {
    return String(name || "crawler")
        .replace(/[^a-z0-9_-]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "crawler";
}

function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCrawler(characterId) {
    const crawler = characterLibrary.characters.find(
        entry => entry.id === characterId
    );

    if (!crawler) return;

    downloadJSON(
        {
            format: CHARACTER_EXPORT_FORMAT,
            version: EXPORT_VERSION,
            character: crawler
        },
        "DCC-" +
        safeFileName(crawler.identity.name) +
        ".json"
    );
}

function exportEntireLibrary() {
    downloadJSON(
        {
            format: LIBRARY_EXPORT_FORMAT,
            version: EXPORT_VERSION,
            characters: characterLibrary.characters
        },
        "DCC-Character-Library.json"
    );
}

function isValidCharacterData(data) {
    return (
        data !== null &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        data.identity !== null &&
        typeof data.identity === "object" &&
        !Array.isArray(data.identity) &&
        data.stats !== null &&
        typeof data.stats === "object" &&
        !Array.isArray(data.stats) &&
        Array.isArray(data.skills) &&
        Array.isArray(data.inventory)
    );
}

function extractImportedCharacters(data) {
    if (!data || typeof data !== "object") {
        throw new Error("This file is not valid JSON character data.");
    }

    let characters;

    if (data.format === CHARACTER_EXPORT_FORMAT) {
        if (data.version !== EXPORT_VERSION) {
            throw new Error("Unsupported character export version.");
        }
        characters = [data.character];

    } else if (data.format === LIBRARY_EXPORT_FORMAT) {
        if (data.version !== EXPORT_VERSION) {
            throw new Error("Unsupported library export version.");
        }
        characters = data.characters;

    } else if (Array.isArray(data.characters)) {
        // Also support raw dccCharacterLibraryV1 backups.
        characters = data.characters;

    } else if (isValidCharacterData(data)) {
        // Also support raw legacy character backups.
        characters = [data];

    } else {
        throw new Error(
            "This is not a recognized DCC character or library file."
        );
    }

    if (!Array.isArray(characters) || characters.length === 0) {
        throw new Error("The file contains no characters.");
    }

    if (!characters.every(isValidCharacterData)) {
        throw new Error(
            "One or more characters have invalid or missing data."
        );
    }

    return characters;
}

async function importCharacterFile(file) {
    if (!file) return;

    // Keep accidentally selected enormous files out of the app.
    const MAX_FILE_BYTES = 10 * 1024 * 1024;

    if (file.size > MAX_FILE_BYTES) {
        alert("Import file is too large (10 MB maximum).");
        return;
    }

    try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        const imported = extractImportedCharacters(parsed);

        const confirmed = confirm(
            "Import " + imported.length +
            " crawler(s)?\n\n" +
            "Each crawler will be added as an independent copy.\n" +
            "Your existing characters will not be replaced."
        );

        if (!confirmed) return;

        // Prepare every copy before changing the saved library.
        const copies = imported.map(source => {
            const copy = structuredClone(source);

            // Prevent collisions with existing character IDs.
            copy.id = crypto.randomUUID();

            return prepareCharacter(copy);
        });

        const updatedLibrary = {
            ...characterLibrary,
            characters: [
                ...characterLibrary.characters,
                ...copies
            ]
        };

        // Save first, then update the in-memory library.
        // If storage is full, the existing library stays intact.
        localStorage.setItem(
            CHARACTER_LIBRARY_KEY,
            JSON.stringify(updatedLibrary)
        );

        characterLibrary = updatedLibrary;

        renderCharacterLibrary();

        alert(
            "Successfully imported " +
            copies.length +
            " crawler(s)!"
        );

    } catch (error) {
        console.error("DCC import failed:", error);

        alert(
            "Import failed.\n\n" +
            error.message +
            "\n\nYour existing characters were not changed."
        );
    }
}

document.getElementById("exportLibraryButton")
    .addEventListener("click", exportEntireLibrary);

const characterImportFile =
    document.getElementById("characterImportFile");

document.getElementById("importCharacterButton")
    .addEventListener("click", () => {
        characterImportFile.click();
    });

characterImportFile.addEventListener("change", async () => {
    const file = characterImportFile.files[0];

    await importCharacterFile(file);

    // Allow selecting the same file again.
    characterImportFile.value = "";
});

// ------------------------------------
// ATTACKS - VERSION 0.9A
// ------------------------------------

let selectedAttackId = null;

const attackSidebar = document.getElementById("attackSidebar");
const attackOverlay = document.getElementById("attackOverlay");
const attackForm = document.getElementById("attackForm");

const attackFields = {
    name: "attackName",
    skillId: "attackSkill",
    rankOverride: "attackRankOverride",
    hitStat: "attackHitStat",
    damageDice: "attackDamageDice",
    damageStat: "attackDamageStat",
    damageBonus: "attackDamageBonus",
    manaCost: "attackManaCost",
    effects: "attackEffects"
};

function getAttackSkill(attack) {
    return character.skills.find(
        skill => skill.id === attack.skillId
    );
}

function getAttackStatMod(stat) {
    const names = {
        STR: "strength",
        INT: "intelligence",
        CON: "constitution",
        DEX: "dexterity",
        CHA: "charisma"
    };

    if (!names[stat]) return null;

    return getStatMod(
        character.stats[names[stat]].enhanced
    );
}

function getAttackNumbers(attack) {
    const skill = getAttackSkill(attack);

    const rank = attack.rankOverride !== ""
        && attack.rankOverride !== undefined
        ? attack.rankOverride
        : (skill?.rank ?? "");

    const hitStat = attack.hitStat ||
        skill?.stat || "";

    const hitMod = getAttackStatMod(hitStat);

    const damageStat = attack.damageStat === "none"
        ? ""
        : attack.damageStat === "linked" ||
          !attack.damageStat
            ? hitStat
            : attack.damageStat;

    const damageMod = damageStat
        ? getAttackStatMod(damageStat)
        : null;

    const extra = attack.damageBonus === ""
        ? 0
        : Number(attack.damageBonus || 0);

    const totalDamageMod =
        (damageMod ?? 0) + extra;

    return {
        skill,
        rank,
        hitStat,
        hitMod,
        totalDamageMod
    };
}

function formatAttackHit(numbers) {
    if (numbers.rank === "" &&
        numbers.hitMod === null) return "—";

    return (numbers.rank === "" ? "—" : numbers.rank) +
        " + " +
        (numbers.hitMod === null ? "—" : numbers.hitMod);
}

function formatAttackDamage(attack, numbers) {
    const dice = attack.damageDice || "—";
    const mod = numbers.totalDamageMod;

    return dice + (mod >= 0 ? " + " : " − ") +
        Math.abs(mod);
}

function renderAttacks() {
    const container = document.getElementById("attackList");
    container.replaceChildren();

    if (!Array.isArray(character.attacks)) {
        character.attacks = [];
    }

    character.attacks.forEach(attack => {
        const numbers = getAttackNumbers(attack);

        const row = document.createElement("button");
        row.type = "button";
        row.className = "attack-row";

        const values = [
            attack.name || "Unnamed Attack",
            formatAttackHit(numbers),
            formatAttackDamage(attack, numbers),
            attack.effects || ""
        ];

        values.forEach(value => {
            const span = document.createElement("span");
            span.textContent = value;
            row.appendChild(span);
        });

        row.addEventListener("click", () => {
            openAttackEditor(attack.id);
        });

        container.appendChild(row);
    });
}

function refreshAttackSkillOptions(selectedId = "") {
    const select = document.getElementById("attackSkill");
    select.replaceChildren();

    select.add(new Option("None — Manual Attack", ""));

    character.skills.forEach(skill => {
        select.add(new Option(
            skill.name || "Unnamed Skill",
            skill.id
        ));
    });

    // Preserve missing links so users can repair them.
    if (selectedId &&
        !character.skills.some(s => s.id === selectedId)) {
        select.add(new Option(
            "Missing Skill — Reconnect",
            selectedId
        ));
    }

    select.value = selectedId;
}

function updateAttackPreview() {
    const temp = {};

    Object.entries(attackFields).forEach(([key, id]) => {
        temp[key] = document.getElementById(id).value;
    });

    const numbers = getAttackNumbers(temp);
    const preview = document.getElementById("attackLinkedPreview");

    if (temp.skillId && !numbers.skill) {
        preview.textContent =
            "Linked skill is missing. Choose another skill.";
        return;
    }

    preview.textContent =
        "Rank: " + (numbers.rank || "—") +
        " | Stat: " + (numbers.hitStat || "—") +
        " | To Hit: " + formatAttackHit(numbers) +
        " | Damage: " + formatAttackDamage(temp, numbers);
}

function openAttackEditor(attackId = null) {
    selectedAttackId = attackId;

    const attack = character.attacks.find(
        entry => entry.id === attackId
    );

    refreshAttackSkillOptions(attack?.skillId || "");

    Object.entries(attackFields).forEach(([key, id]) => {
        const input = document.getElementById(id);

        input.value = attack
            ? (attack[key] ?? "")
            : (key === "damageStat" ? "linked" : "");
    });

    document.getElementById("attackSidebarTitle").textContent =
        attack ? "EDIT ATTACK" : "NEW ATTACK";

    document.getElementById("duplicateAttackButton").hidden =
        !attack;

    document.getElementById("deleteAttackButton").hidden =
        !attack;

    updateAttackPreview();

    attackOverlay.hidden = false;
    attackSidebar.hidden = false;
}

function closeAttackEditor() {
    attackSidebar.hidden = true;
    attackOverlay.hidden = true;
    selectedAttackId = null;
}

document.getElementById("addAttackButton")
    .addEventListener("click", () => openAttackEditor());

document.getElementById("closeAttackSidebar")
    .addEventListener("click", closeAttackEditor);

attackOverlay.addEventListener("click", closeAttackEditor);

attackForm.addEventListener("input", updateAttackPreview);
attackForm.addEventListener("change", updateAttackPreview);

attackForm.addEventListener("submit", event => {
    event.preventDefault();

    const values = {};

    Object.entries(attackFields).forEach(([key, id]) => {
        values[key] = document.getElementById(id).value.trim();
    });

    if (!values.name) {
        alert("Attack name is required.");
        return;
    }

    if (selectedAttackId) {
        const existing = character.attacks.find(
            attack => attack.id === selectedAttackId
        );

        if (!existing) return;

        Object.assign(existing, values);

    } else {
        character.attacks.push({
            id: crypto.randomUUID(),
            ...values
        });
    }

    saveCharacter();
    renderAttacks();
    closeAttackEditor();
});

document.getElementById("duplicateAttackButton")
    .addEventListener("click", () => {
        const original = character.attacks.find(
            attack => attack.id === selectedAttackId
        );

        if (!original) return;

        const duplicate = structuredClone(original);
        duplicate.id = crypto.randomUUID();
        duplicate.name = original.name + " (Copy)";

        character.attacks.push(duplicate);

        saveCharacter();
        renderAttacks();
        openAttackEditor(duplicate.id);
    });

document.getElementById("deleteAttackButton")
    .addEventListener("click", () => {
        const attack = character.attacks.find(
            entry => entry.id === selectedAttackId
        );

        if (!attack) return;

        if (!confirm("Delete " + attack.name + "?")) return;

        character.attacks = character.attacks.filter(
            entry => entry.id !== selectedAttackId
        );

        saveCharacter();
        renderAttacks();
        closeAttackEditor();
    });

// Keep attacks updated when skill ranks or stats change.
const originalRenderSkillsForAttacks = renderSkills;

renderSkills = function () {
    originalRenderSkillsForAttacks();
    renderAttacks();
};

// Close attack editor when switching crawlers.
const originalSelectCharacterForAttacks = selectCharacter;

selectCharacter = function (id) {
    closeAttackEditor();
    originalSelectCharacterForAttacks(id);
    renderAttacks();
};

renderAttacks();

// ------------------------------------
// VERSION 1.0 — DEFENSES & MOVEMENT
// ------------------------------------
const defenseInputMap = {
  evadeAdjustment: "evadeAdjustment",
  evadeDescription: "evadeDescription",
  damageResistance: "damageResistance",
  drDescription: "drDescription",
  defenseMove: "move",
  defenseStep: "step",
  defenseFavor: "aiFavor",
  buffOne: "buffOne",
  buffTwo: "buffTwo",
  buffThree: "buffThree",
  defenseDebuffs: "debuffs"
};

function ensureDefenseData() {
  if (!character.defenses || typeof character.defenses !== "object") {
    character.defenses = {};
  }
  return character.defenses;
}

function renderDefenses() {
  const data = ensureDefenseData();
  Object.entries(defenseInputMap).forEach(([id, key]) => {
    document.getElementById(id).value = data[key] ?? "";
  });
  updateEvadeDisplay();
}

function updateEvadeDisplay() {
  const dex = getStatMod(character.stats.dexterity.enhanced);
  const adjustment = Number(ensureDefenseData().evadeAdjustment || 0);
  const total = dex === null ? null : dex + adjustment;
  document.getElementById("evadeTotal").textContent =
    total === null ? "—" : (total >= 0 ? "+" : "") + total;
  document.getElementById("evadeBreakdown").textContent =
    "DEX modifier: " + (dex === null ? "—" : dex) +
    " | Adjustment: " + adjustment +
    " | Total: " + (total === null ? "—" : total);
}

Object.entries(defenseInputMap).forEach(([id, key]) => {
  document.getElementById(id).addEventListener("input", event => {
    ensureDefenseData()[key] = event.target.value;
    updateEvadeDisplay();
    saveCharacter();
  });
});

// Reuse the existing stat update pipeline without changing it.
const renderSkillsBeforeDefense = renderSkills;
renderSkills = function () {
  renderSkillsBeforeDefense();
  updateEvadeDisplay();
};

// ------------------------------------
// VERSION 1.0 — MOVE / COLLAPSE SECTIONS
// ------------------------------------
const sectionDefinitions = [
  ["stats", ".stats", "STATS"],
  ["resources", ".resources", "HEALTH & MANA"],
  ["defenses", "#defenseSection", "DEFENSES & MOVEMENT"],
  ["skills", ".skills-section", "SKILLS & SPELLS"],
  ["attacks", ".attacks-section", "ATTACKS"],
  ["inventory", ".inventory-section", "INVENTORY"],
  ["equipped", "#equippedSection", "EQUIPPED"],
  ["hotlist", "#hotlistSection", "HOTLIST"]
];
const sectionHost = document.createElement("div");
sectionHost.id = "sheetSectionHost";
document.querySelector("main").appendChild(sectionHost);
const sectionWrappers = new Map();

sectionDefinitions.forEach(([key, selector, title]) => {
  const section = document.querySelector(selector);
  if (!section) return;
  const wrap = document.createElement("div");
  wrap.className = "section-control-wrap";
  wrap.dataset.section = key;
  const bar = document.createElement("div");
  bar.className = "section-control-bar";
  const up = document.createElement("button");
  up.type = "button"; up.textContent = "↑";
  up.title = "Move " + title + " up";
  up.setAttribute("aria-label", up.title);
  const down = document.createElement("button");
  down.type = "button"; down.textContent = "↓";
  down.title = "Move " + title + " down";
  down.setAttribute("aria-label", down.title);
  const toggle = document.createElement("button");
  toggle.type = "button"; toggle.textContent = "− Collapse";
  toggle.setAttribute("aria-label", "Collapse " + title);
  // Move the real heading into the permanent control bar.
  // Buttons like ADD SKILL remain available even when the section is collapsed.
  const heading = section.querySelector(":scope > .section-heading, :scope > .attacks-header, :scope > h2");
  if (heading) {
    heading.classList.add("movable-section-heading");
    bar.appendChild(heading);
  } else {
    const fallback = document.createElement("h2");
    fallback.textContent = title;
    bar.appendChild(fallback);
  }
  const buttons = document.createElement("div");
  buttons.className = "section-move-buttons";
  buttons.append(up, down, toggle);
  bar.appendChild(buttons);
  wrap.append(bar, section);
  sectionHost.appendChild(wrap);
  sectionWrappers.set(key, { wrap, section, up, down, toggle });
  up.addEventListener("click", () => moveSheetSection(key, -1));
  down.addEventListener("click", () => moveSheetSection(key, 1));
  toggle.addEventListener("click", () => {
    section.hidden = !section.hidden;
    toggle.textContent = section.hidden ? "+ Expand" : "− Collapse";
    toggle.setAttribute("aria-label", (section.hidden ? "Expand " : "Collapse ") + title);
    saveSectionLayout();
  });
});

function getSheetSectionLayout() {
  if (!character.sheetLayout || typeof character.sheetLayout !== "object") {
    character.sheetLayout = { order: [], collapsed: [] };
  }
  return character.sheetLayout;
}

function saveSectionLayout() {
  const layout = getSheetSectionLayout();
  layout.order = [...sectionHost.children].map(node => node.dataset.section);
  layout.collapsed = [...sectionWrappers.entries()]
    .filter(([, entry]) => entry.section.hidden)
    .map(([key]) => key);
  saveCharacter();
}

function refreshSectionControls() {
  const children = [...sectionHost.children];
  children.forEach((node, index) => {
    const controls = sectionWrappers.get(node.dataset.section);
    controls.up.disabled = index === 0;
    controls.down.disabled = index === children.length - 1;
  });
}

function moveSheetSection(key, direction) {
  const nodes = [...sectionHost.children];
  const index = nodes.findIndex(node => node.dataset.section === key);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= nodes.length) return;
  const node = nodes[index];
  if (direction < 0) sectionHost.insertBefore(node, nodes[next]);
  else sectionHost.insertBefore(nodes[next], node);
  refreshSectionControls();
  saveSectionLayout();
}

function renderSectionLayout() {
  const layout = getSheetSectionLayout();
  const order = [...new Set([
    ...(Array.isArray(layout.order) ? layout.order : []),
    ...sectionDefinitions.map(([key]) => key)
  ])];
  order.forEach(key => {
    const entry = sectionWrappers.get(key);
    if (entry) sectionHost.appendChild(entry.wrap);
  });
  const collapsed = Array.isArray(layout.collapsed) ? layout.collapsed : [];
  sectionWrappers.forEach(({ section, toggle }, key) => {
    section.hidden = collapsed.includes(key);
    toggle.textContent = section.hidden ? "+ Expand" : "− Collapse";
  });
  refreshSectionControls();
}

const selectCharacterBeforeDefense = selectCharacter;
selectCharacter = function (id) {
  selectCharacterBeforeDefense(id);
  renderDefenses();
  renderSectionLayout();
};

renderDefenses();
renderSectionLayout();


// ------------------------------------
// VERSION 1.1 — PORTRAIT & TROPHIES
// ------------------------------------
const TROPHY_TYPES = [
  ["neighborhood", "★", "Bronze", "Neighborhood Boss", "#bc7937"],
  ["borough", "★", "Silver", "Borough Boss", "#aab0bb"],
  ["city", "★", "Gold", "City Boss", "#d5a51d"],
  ["province", "★", "Platinum", "Province Boss", "#96b8c6"],
  ["country", "★", "Yellow", "Country Boss", "#e9cb20"],
  ["floorBoss", "★", "Purple", "Floor Boss", "#9c68cf"],
  ["crawlerKills", "☠", "White", "Crawler Kills", "#e8e8e8"],
  ["leaderboardKills", "☠", "Gold", "Leaderboard Crawler Kills", "#d5a51d"],
  ["hunterKills", "⚔", "White", "Hunter Kills", "#e8e8e8"],
  ["eliteHunterKills", "⚔", "Gold", "Elite Hunter Kills", "#d5a51d"]
];
let editingTrophies = false;
function getTrophies() {
  if (!character.trophies || typeof character.trophies !== "object" || Array.isArray(character.trophies)) character.trophies = {};
  return character.trophies;
}
function renderTrophies() {
  const target = document.getElementById("trophyCounters");
  target.replaceChildren();
  const data = getTrophies();
  TROPHY_TYPES.forEach(([key, symbol, colorName, label, color]) => {
    const box = document.createElement("div");
    box.className = "trophy-item";
    box.title = label + " (" + colorName + ")";
    const count = Math.max(0, Math.floor(Number(data[key]) || 0));
    const number = document.createElement("span");
    number.className = "trophy-number";
    number.textContent = count;
    const icon = document.createElement("span");
    icon.className = "trophy-icon";
    icon.style.color = color;
    icon.textContent = symbol;
    icon.setAttribute("aria-label", label);
    box.append(number, icon);
    if (editingTrophies) {
      const controls = document.createElement("div");
      controls.className = "trophy-adjust";
      const minus = document.createElement("button");
      minus.type = "button"; minus.textContent = "−";
      minus.setAttribute("aria-label", "Decrease " + label);
      const plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+";
      plus.setAttribute("aria-label", "Increase " + label);
      const input = document.createElement("input");
      input.type = "number"; input.min = "0"; input.step = "1";
      input.value = count; input.setAttribute("aria-label", label + " count");
      const update = value => {
        const next = Math.max(0, Math.floor(Number(value) || 0));
        data[key] = next;
        number.textContent = next;
        input.value = next;
        saveCharacter();
      };
      minus.addEventListener("click", () => update(Number(input.value) - 1));
      plus.addEventListener("click", () => update(Number(input.value) + 1));
      input.addEventListener("change", () => update(input.value));
      controls.append(minus, input, plus);
      box.appendChild(controls);
    }
    target.appendChild(box);
  });
  document.getElementById("editTrophiesButton").textContent = editingTrophies ? "DONE" : "EDIT TROPHIES";
}
document.getElementById("editTrophiesButton").addEventListener("click", () => {
  editingTrophies = !editingTrophies;
  renderTrophies();
});

// Reposition existing inputs without recreating them: existing listeners stay attached.
const crawlerFields = document.querySelector(".character-info");
const crawlerFieldIds = ["characterName", "crawlerNumber", "race", "crawlerSize", "pronouns", "characterClass"];
const fieldLabels = new Map([...crawlerFields.querySelectorAll(":scope > label")].map(label => [label.querySelector("input")?.id, label]));
const sizeLabel = document.createElement("label");
sizeLabel.textContent = "Size";
const sizeInput = document.createElement("input");
sizeInput.id = "crawlerSize"; sizeInput.type = "text"; sizeInput.placeholder = "e.g. Medium";
sizeLabel.appendChild(sizeInput);
fieldLabels.set("crawlerSize", sizeLabel);
crawlerFieldIds.forEach(id => crawlerFields.appendChild(fieldLabels.get(id)));
const levelFloor = document.getElementById("crawlerLevelFloor");
["level", "floor"].forEach(id => levelFloor.appendChild(fieldLabels.get(id)));
sizeInput.addEventListener("input", () => {
  character.identity.size = sizeInput.value;
  saveCharacter();
});
function renderCrawlerVisuals() {
  sizeInput.value = character.identity.size || "";
  const img = document.getElementById("crawlerPortrait");
  const src = character.portraitJpg || "";
  img.hidden = !src;
  document.getElementById("portraitPlaceholder").hidden = !!src;
  if (src) img.src = src;
  else img.removeAttribute("src");
  document.getElementById("portraitUpload").value = "";
  editingTrophies = false;
  renderTrophies();
}
function storePortraitData(dataUrl) {
  const old = character.portraitJpg || "";
  character.portraitJpg = dataUrl;
  try { saveCharacter(); }
  catch (error) {
    character.portraitJpg = old;
    alert("Unable to save portrait. Browser storage may be full. Export a backup and try a smaller image.");
    return;
  }
  renderCrawlerVisuals();
}
document.getElementById("portraitUpload").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!/image\/jpeg/.test(file.type) || file.size > 8 * 1024 * 1024) {
    alert("Please choose a JPG/JPEG image smaller than 8 MB.");
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => alert("Unable to read portrait.");
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => alert("This JPG could not be opened.");
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 320;
      const ctx = canvas.getContext("2d");
      const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
      const w = image.width * scale, h = image.height * scale;
      ctx.drawImage(image, (320 - w) / 2, (320 - h) / 2, w, h);
      storePortraitData(canvas.toDataURL("image/jpeg", 0.78));
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});
document.getElementById("removePortrait").addEventListener("click", () => {
  if (!character.portraitJpg) return;
  if (!confirm("Remove this crawler's portrait?")) return;
  storePortraitData("");
});
const selectCharacterBeforeVisuals = selectCharacter;
selectCharacter = function (id) {
  selectCharacterBeforeVisuals(id);
  renderCrawlerVisuals();
};
renderCrawlerVisuals();

// Ensure the soft Hotlist count appears after movable headers are initialized.
renderHotlist();

// ------------------------------------
// VERSION 1.2 — QUALITY OF LIFE
// ------------------------------------
const sortHeaders = document.querySelectorAll("[data-skill-sort]");
sortHeaders.forEach(th => {
  th.tabIndex = 0;
  th.title = "Sort ascending / descending";
  const sort = () => {
    const key = th.dataset.skillSort;
    skillSortDirection = skillSortColumn === key ? -skillSortDirection : 1;
    skillSortColumn = key;
    sortHeaders.forEach(header => header.removeAttribute("aria-sort"));
    th.setAttribute("aria-sort", skillSortDirection === 1 ? "ascending" : "descending");
    renderSkills();
  };
  th.addEventListener("click", sort);
  th.addEventListener("keydown", e => {if(e.key === "Enter" || e.key === " "){e.preventDefault();sort();}});
});
document.getElementById("showHiddenSkills").addEventListener("change", renderSkills);
document.getElementById("clearSkillFilters").addEventListener("click", () => {
  ["skillSearch","skillTypeFilter","skillStatFilter","skillSourceFilter","skillTagFilter"].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = "";
  });
  document.getElementById("showHiddenSkills").checked = false;
  skillSortColumn = ""; skillSortDirection = 1;
  sortHeaders.forEach(th => th.removeAttribute("aria-sort"));
  renderSkills();
});
document.getElementById("pinSkillButton").addEventListener("click", () => {
  const skill = getSelectedSkill(); if(!skill) return;
  skill.pinned = !skill.pinned;
  if(skill.pinned) skill.pinOrder = Math.max(0, ...character.skills.map(s => Number(s.pinOrder) || 0)) + 1;
  saveCharacter(); renderSkills(); showSkillDetails();
});
document.getElementById("hideSkillButton").addEventListener("click", () => {
  const skill = getSelectedSkill(); if(!skill) return;
  skill.hidden = !skill.hidden;
  saveCharacter(); renderSkills(); showSkillDetails();
});
document.getElementById("inventorySearch").addEventListener("input", renderInventory);
// Keep list filters clean when switching crawlers.
const selectCharacterBeforeQol = selectCharacter;
selectCharacter = function(id) {
  document.getElementById("inventorySearch").value = "";
  document.getElementById("showHiddenSkills").checked = false;
  skillSortColumn = ""; skillSortDirection = 1;
  sortHeaders.forEach(th => th.removeAttribute("aria-sort"));
  selectCharacterBeforeQol(id);
};
// Enhanced-stat explanations: stored with each stat, never alter calculations.
const statNames12 = ["strength","intelligence","constitution","dexterity","charisma"];
statNames12.forEach(name => {
  const input = document.getElementById(name + "Enhanced");
  const label = input.closest("label");
  const note = document.createElement("button");
  note.type = "button"; note.className = "stat-note-button";
  note.textContent = "ⓘ"; note.title = "Edit enhanced stat explanation";
  note.addEventListener("click", () => {
    const existing = character.stats[name].enhancedNote || "";
    const next = prompt("Why is " + name.toUpperCase() + " enhanced?", existing);
    if(next === null) return;
    character.stats[name].enhancedNote = next;
    saveCharacter(); refreshStatNotes12();
  });
  const caption = document.createElement("span");
  caption.className = "enhanced-stat-caption";
  // Keep the existing label text beside the indicator, above the input.
  const textNode = [...label.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if(textNode) caption.appendChild(textNode);
  caption.appendChild(note);
  label.insertBefore(caption, input);
});
function refreshStatNotes12() {
  statNames12.forEach(name => {
    const btn = document.getElementById(name + "Enhanced").closest("label").querySelector(".stat-note-button");
    const note = character.stats[name].enhancedNote || "";
    btn.title = note || "Edit enhanced stat explanation";
    btn.classList.toggle("has-note", !!note);
  });
}
const displayCharacterBeforeQol = displayCharacter;
displayCharacter = function() { displayCharacterBeforeQol(); refreshStatNotes12(); };
refreshStatNotes12();
// Popularity: same direct-save pattern as Level and Floor.
const popularityLabel = document.createElement("label");
popularityLabel.textContent = "Popularity";
const popularityInput = document.createElement("input");
popularityInput.type = "number"; popularityInput.id = "crawlerPopularity";
popularityInput.step = "1"; popularityInput.min = "0"; popularityInput.max = "999";
popularityLabel.appendChild(popularityInput);
document.getElementById("crawlerLevelFloor").appendChild(popularityLabel);
popularityInput.addEventListener("input", () => { character.identity.popularity = popularityInput.value; saveCharacter(); });
const selectCharacterBeforePopularity = selectCharacter;
selectCharacter = function(id) { selectCharacterBeforePopularity(id); popularityInput.value = character.identity.popularity ?? ""; refreshStatNotes12(); };
popularityInput.value = character.identity.popularity ?? "";
[["level",999],["floor",18],["crawlerPopularity",999]].forEach(([id,max]) => {
  const el = document.getElementById(id);
  el.min = "0"; el.max = String(max);
  el.addEventListener("change", () => {
    if(el.value === "") return;
    const number = Number(el.value);
    if(!Number.isFinite(number)) return;
    const clamped = Math.max(0, Math.min(max, Math.trunc(number)));
    if(clamped !== number) {
      el.value = String(clamped);
      if(id === "crawlerPopularity") character.identity.popularity = el.value;
      else character.identity[id] = el.value;
      saveCharacter();
    }
  });
});
// Rest actions: 1 HB = 10 percentage points; all gains cap at maximum.
const restBar = document.createElement("div");
restBar.className = "rest-actions";
const resourcesBar = sectionWrappers.get("resources")?.wrap.querySelector(".section-control-bar");
if(resourcesBar) resourcesBar.insertBefore(restBar, resourcesBar.querySelector(".section-move-buttons"));
function expandSheetSection12(key) {
  const entry = sectionWrappers.get(key); if(!entry || !entry.section.hidden) return;
  entry.section.hidden = false;
  entry.toggle.textContent = "− Collapse";
  entry.toggle.setAttribute("aria-label", "Collapse " + key);
  saveSectionLayout();
}
[["1 HR", "hour"], ["SHORT", "short"], ["LONG", "long"]].forEach(([label, kind]) => {
  const button = document.createElement("button"); button.type = "button";
  button.textContent = label; button.className = "rest-button";
  button.title = kind === "hour" ? "Restore 1 HB and 5 Mana" : kind === "short" ? "Restore 5 HB and half max Mana (minimum 10)" : "Restore full Health and Mana";
  button.addEventListener("click", () => {
    expandSheetSection12("resources");
    const max = Number(character.stats.intelligence.enhanced);
    const validMax = character.stats.intelligence.enhanced !== "" && Number.isFinite(max) && max >= 0;
    const current = Math.max(0, Number(character.resources.currentMana) || 0);
    const heal = kind === "long" ? 100 : kind === "short" ? 50 : 10;
    character.resources.healthPercent = kind === "long" ? 100 : Math.min(100, Math.max(0, Number(character.resources.healthPercent) || 0) + heal);
    if(validMax) {
      const gain = kind === "long" ? max : kind === "short" ? Math.max(10, max / 2) : 5;
      character.resources.currentMana = kind === "long" ? max : Math.min(max, current + gain);
      document.getElementById("currentMana").value = character.resources.currentMana;
    }
    updateResources(); saveCharacter();
  });
  restBar.appendChild(button);
});
[["skills", "addSkillButton"], ["attacks", "addAttackButton"], ["inventory", "addInventoryButton"]].forEach(([section, id]) => {
  document.getElementById(id).addEventListener("click", () => expandSheetSection12(section), true);
});
renderSkills(); renderInventory(); renderHotlist();

// VERSION 1.2.1 — HEALTH COLOR BY REMAINING HB
const updateResourcesBeforeColors = updateResources;
updateResources = function() {
  updateResourcesBeforeColors();
  const percent = Number(character.resources.healthPercent) || 0;
  const tier = percent >= 80 ? "green" : percent >= 50 ? "yellow" : percent >= 30 ? "orange" : "red";
  document.getElementById("healthBlocks").dataset.healthTier = tier;
};
updateResources();
