# Open CGA prototype

A prototype interface that demonstrates how data retrieved from the Open CGA API could be navigated and explored.

* List projects in a table, showing how many studies each sample has
* For each project, list studies, showing how many files, samples, individuals and jobs they have
* For each study provide a summary and link to views of files, samples and individuals
* Focus on samples, provide examples of how to filter large sample sets based on study variable sets

## Install

A Node.js app using ExpressJS. It uses a git submodule to include [jsorolla](https://github.com/opencb/jsorolla). `jsorolla` provides an [Open CGA JS api client](https://github.com/opencb/jsorolla/blob/next-v2.0.0/src/lib/clients/opencga-client.js), written in ES6

* Clone and run `npm install`
* Run `git submodule update --init` from `lib` to pull in jsorolla
* Requires Node v6 or greater for ES6

## Screenshots

![Open CGA prototype](https://raw.githubusercontent.com/fofr/opencga-prototype/master/screenshots/opencga-prototype.gif)
![Advanced filters in action](https://raw.githubusercontent.com/fofr/opencga-prototype/master/screenshots/filters-in-action.gif)
![Open CGA prototype, screenshot of study](https://raw.githubusercontent.com/fofr/opencga-prototype/master/screenshots/study.png)
