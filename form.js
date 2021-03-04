/**
* @file Defines several helper functions for generating form inputs such as
* Likert-type scales, multiple choice questions, etc.
* @author Michael Pascale
*/

/**
* Brief description of the function here.
* @param {Number} n - Number of levels.
* @param {String} low - Label for the low end of the scale.
* @param {String} high - Label for the high end of the scale.
* @param {String} node - ID of an html element to add to.
*/

function likert (n, low, high, node) {
    for (let i = 1; i <= n; ++i)
        $(
            (i == 1 ? `<span class="mt-auto mr-2">${low}</span>` : '') +
            `
             <label class="radio likert-item has-text-centered">
             ${i}
             <input type="radio" class="my-1 mx-1" name="${node}" value=${i} required>
             </label>
            `
            + (i == n ? `<span class="mt-auto ml-2">${high}</span>` : '')
        ).appendTo(`#${node}`);
}