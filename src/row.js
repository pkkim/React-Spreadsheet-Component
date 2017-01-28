"use strict";

var React = require('react');

var CellComponent = require('./cell');
var Helpers = require('./helpers');

var RowComponent = React.createClass({    
    /**
     * React Render method
     * @return {[JSX]} [JSX to render]
     */
    shouldComponentUpdate: function(nextProps) {
        if (nextProps.uid === 0) {
            return true;
        }

        if (nextProps.selected === null) {
            return true;
        }

        // Update cell highlighter
        if (
            nextProps.selected[0] === nextProps.uid ||
            (nextProps.prevSelected && nextProps.prevSelected[0] === nextProps.uid)
        ) {
            return true;
        }

        if (nextProps.lastChange !== undefined && nextProps.idMapping !== undefined) {
            var lastChangeTable = nextProps.lastChange[0][0];
            var lastChangeId = nextProps.lastChange[0][2];
            var idsForTable = nextProps.idMapping[lastChangeTable];
            if (idsForTable !== undefined &&
                    idsForTable.indexOf(lastChangeId) !== undefined) {
                return true;
            }
        }
        
        return false;
    },
    render: function() {
        var props = this.props;
        var config = props.config,
            cells = props.cells,
            columns = [],
            key, uid, selected, cellClasses;

        if (!config.columns || cells.length === 0) {
            return console.error('Table can\'t be initialized without set number of columsn and no data!');
        }

        var that = this;

        cells.forEach(function (cell, i) {
            // If a cell is selected, check if it's this one
            selected = Helpers.equalCells(props.selected, [props.uid, i]);
            cellClasses = (props.cellClasses && props.cellClasses[i]) ? props.cellClasses[i] : '';

            key = 'row_' + props.uid + '_cell_' + i;
            uid = [props.uid, i];
            var handleSort = (
                props.handleSort ?
                function () { props.handleSort(i) }.bind(that) :
                undefined
            );
            columns.push(<CellComponent key={key} 
                                       uid={uid}
                                       value={cell}
                                       config={config}
                                       cellClasses={cellClasses}
                                       onCellValueChange={props.onCellValueChange} 
                                       handleSelectCell={props.handleSelectCell}
                                       handleSort={handleSort}
                                       handleDoubleClickOnCell={props.handleDoubleClickOnCell}
                                       handleCellBlur={props.handleCellBlur}
                                       spreadsheetId={props.spreadsheetId}
                                       selected={selected} 
                                       sortColumn={props.sortColumn}
                                       isAscending={props.isAscending}
                                       editing={props.editing} />
            );
        });

        return <tr>{columns}</tr>;
    }
});

module.exports = RowComponent;
