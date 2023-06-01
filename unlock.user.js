"use strict";
// ==UserScript==
// @name         BrainlyUnlocked
// @namespace    URL
// @version      0.1
// @description  Unlock hidden brainly answers.
// @author       kiwibirb
// @match        *://brainly.com/question/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

/**
 * Retrieve JSON answer data from current page's html.
 * @returns {any}
 */
function findRawAnswerData () {
    const scripts = document.getElementsByTagName("script");
    let index = -1;
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].type == "application/ld+json") {
            if (i < 0 || (scripts[i].innerText !== "")) index = i;
        }
    }
    if (index < 0) throw new Error("Failed to find answer data.")
    let rawdata;
    try {
        rawdata = JSON.parse(scripts[index].innerText);
    } catch (e) {
        console.log(data)
        throw new Error("Failed to parse answer data.")
    }
    return rawdata
}

class BrainlyAnswerData {
    static generate () {
        return new BrainlyAnswerData(findRawAnswerData());
    }
    question;
    answers;
    /**
     * Convert raw Brainly data to a higher level structure.
     * @param {any} rawdata 
     */
    constructor (rawdata) {
        // Remove "breadcrumb" schema data.
        if (Array.isArray(rawdata)) rawdata = rawdata[0]
        if ("mainEntity" in rawdata) rawdata = rawdata.mainEntity
        // Fill in question data.
        this.question = {
            text: rawdata.name ?? null,
            date: rawdata.dateCreated ?? null,
            author: {
                type: rawdata.author["@type"].toLowerCase() ?? null,
                name: rawdata.author.name ?? null
            }
        }
        // Fill in answer data.
        this.answers = { accepted: [], suggested: [] };
        ;["accepted", "suggested"].forEach((key, i) => {
            let answers = rawdata[key === "accepted" ? "acceptedAnswer" : "suggestedAnswer"];
            answers.forEach((answer, i) => {
                this.answers[key][i] = {
                    upvotes: answer.upvoteCount ?? null,
                    text: answer.text ?? null,
                    author: {
                        type: answer.author["@type"].toLowerCase() ?? null,
                        name: answer.author.name ?? null
                    },
                    isFree: ("isAccessibleForFree" in answer) ? (answer.isAccessibleForFree === "True") : null,
                    date: answer.dateCreated ?? null
                }
            });
        });
    }
    bestAnswer () {
        return this.answers.accepted[0] ?? this.answers.suggested[0] ?? null;
    }
}

;(function main () {
    let data = BrainlyAnswerData.generate();
    console.log(data);
})()