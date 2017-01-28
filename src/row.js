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
        var config = this.props.config,
            cells = this.props.cells,
            columns = [],
            key, uid, selected, cellClasses, i;

        if (!config.columns || cells.length === 0) {
            return console.error('Table can\'t be initialized without set number of columsn and no data!');
        }

        for (i = 0; i < cells.length; i = i + 1) {
            // If a cell is selected, check if it's this one
            selected = Helpers.equalCells(this.props.selected, [this.props.uid, i]);
            cellClasses = (this.props.cellClasses && this.props.cellClasses[i]) ? this.props.cellClasses[i] : '';

            key = 'row_' + this.props.uid + '_cell_' + i;
            uid = [this.props.uid, i];
            var thisI = i;
            var handleSort = (
                this.props.handleSort ?
                function () { this.props.handleSort(thisI) }.bind(this) :
                undefined
            );
            columns.push(<CellComponent key={key} 
                                       uid={uid}
                                       value={cells[i]}
                                       config={config}
                                       cellClasses={cellClasses}
                                       onCellValueChange={this.props.onCellValueChange} 
                                       handleSelectCell={this.props.handleSelectCell}
                                       handleSort={handleSort}
                                       handleDoubleClickOnCell={this.props.handleDoubleClickOnCell}
                                       handleCellBlur={this.props.handleCellBlur}
                                       spreadsheetId={this.props.spreadsheetId}
                                       selected={selected} 
                                       editing={this.props.editing} />
            );
        }

        return <tr>{columns}</tr>;
    }
});

module.exports = RowComponent;
