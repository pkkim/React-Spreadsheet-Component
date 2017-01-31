'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var Spreadsheet = require('./lib/spreadsheet');

// Example One
var exampleOne = {};

var rows = 5;
var cols = 6;
var dataRows = new Array(rows);
for (var i = 0; i < rows; i++) {
    dataRows[i] = new Array(cols);
    for (var j = 0; j < cols; j++) {
        dataRows[i][j] = i + j;
    }
}
exampleOne.data = {
    rows: dataRows
};

exampleOne.config = {
    rows: rows,
    columns: cols,
    isHeadColumnString: false,
    hasHeadRow: true,
    isHeadRowString: true,
    canAddRow: true,
    canAddColumn: true,
    emptyValueSymbol: '-',
    hasLetterNumberHeads: true,
    update: {
        endpoint: 'https://www.google.com',
        complete: function (jqXHR, textStatus) {
            console.log(jqXHR);
            console.log(textStatus);
        },
        success: function () { console.log('success'); },
        error: function () { console.error ('xhr failed') }
    }
};

exampleOne.mapping = {};
for (var i = 0; i < rows - 1; i++) {
    for (var j = 0; j < cols; j++) {
        exampleOne.mapping[i + ' ' + j] = {
            cells: [[Math.floor(i / 2) * 2, j], [Math.floor(i / 2) * 2 + 1, j]],
            column: j,
            id: Math.floor(i / 2) * 2,
            table: "FooBar"
        };
    }
}

exampleOne.idMappings = new Array(rows - 1);
for (var i = 0; i < rows - 1; i++) {
    exampleOne.idMappings[i] = {FooBar: [Math.floor(i / 2) * 2 ]};
}


// Example Two
var exampleTwo = {};
exampleTwo.data = {
    rows: [
        ['Customer', 'Job', 'Contact', 'City', 'Revenue'],
        ['iDiscovery', 'Build', 'John Doe', 'Boston, MA', '500,000'],
        ['SxSW', 'Build', 'Tom Fuller', 'San Francisco, CA', '600,000'],
        ['CapitalTwo', 'Failed', 'Eric Pixel', 'Seattle, WA', '450,000']
    ]
};

exampleTwo.cellClasses = {
    rows: [
        ['', '', '', '', '', '', '', ''],
        ['green', '', '', '', '', '', '', 'dollar'],
        ['purple', '', '', '', '', '', '', 'dollar'],
        ['yellow', 'failed', '', '', '', '', '', 'dollar'],
    ]
};

exampleTwo.config = {
    rows: 5,
    columns: 5,
    headColumn: true,
    headColumnIsString: true,
    headRow: true,
    headRowIsString: true,
    canAddRow: false,
    canAddColumn: false,
    emptyValueSymbol: '-',
    letterNumberHeads: false
};

// Render
ReactDOM.render(
    <Spreadsheet
        data={exampleOne.data}
        config={exampleOne.config}
        cellClasses={exampleOne.cellClasses}
        mapping={exampleOne.mapping}
        idMappings={exampleOne.idMappings}
        lockedColumns={[1]}
    />,
    document.getElementById('exampleOne')
);
// ReactDOM.render(<Spreadsheet data={exampleTwo.data} config={exampleTwo.config} cellClasses={exampleTwo.cellClasses} />, document.getElementById('exampleTwo'));
