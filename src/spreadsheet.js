"use strict";

var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');

var RowComponent = require('./row');
var Dispatcher = require('./dispatcher');
var Helpers = require('./helpers');

var SpreadsheetComponent = React.createClass({
    spreadsheetId: null,

    /**
     * React 'getInitialState' method
     */
    getInitialState: function() {
        var addedCellClasses = new Array(this.props.config.rows);
        for (var i = 0; i < this.props.config.rows; i++) {
            var arr = new Array(this.props.config.columns);
            for (var j = 0; j < this.props.config.columns; j++) {
                arr[j] = [];
            }
            addedCellClasses[i] = arr;
        }
        return {
            prevSelected: null,
            selected: null,
            lastBlurred: null,
            selectedElement: null,
            changesToApply: [],
            editing: false,
            sortColumn: undefined,
            isAscending: true,
            addedCellClasses: addedCellClasses
        };
    },


    /**
     * React 'componentDidMount' method
     */
    componentDidMount: function () {
        this.bindKeyboard();

        $('body').on('focus', 'input', function (e) {
            $(this)
                .one('mouseup', function () {
                    $(this).select();
                    return false;
                })
                .select();
        });
    },

    /**
     * React Render method
     * @return {[JSX]} [JSX to render]
     */
    render: function() {
        var data = this.props.data,
            config = this.props.config,
            _cellClasses = this.props.cellClasses,
            rows = [], key, i, cellClasses;

        this.spreadsheetId = this.props.spreadsheetId || Helpers.makeSpreadsheetId();

        // Sanity checks
        if (!data && !config.rows) {
            return console.error('Table Component: Number of columns not defined in both data and config!');
        }

        var finalCellClasses;
        if (_cellClasses === undefined) {
            finalCellClasses = {rows: this.state.addedCellClasses};
        } else {
            finalCellClasses = {rows: new Array(_cellClasses.rows.length)};
            _cellClasses.rows.forEach((row, i) => {
                finalCellClasses.rows[i] = new Array(row.length);
                row.forEach((cell, j) => {
                    finalCellClasses.rows[i][j] = (
                        cell + ' ' + this.state.addedCellClasses[i][j].join(' ')
                    );
                });
            });
        }

        var changesToApply = this.state.changesToApply;
        var lastChange = changesToApply[changesToApply.length - 1];
        // Create Rows
        var headerRow;
        if (this.state.editing) {
            console.log('')
        }
        for (i = 0; i < data.rows.length; i = i + 1) {
            key = 'row_' + i;
            cellClasses = (finalCellClasses && finalCellClasses.rows) ? finalCellClasses.rows[i] : null;
            var handleSort = i === 0 ? this.handleSort : undefined;

            var row = <RowComponent cells={data.rows[i]}
                                    cellClasses={cellClasses}
                                    uid={i}
                                    key={key}
                                    config={config}
                                    selected={this.state.selected}
                                    prevSelected={this.state.prevSelected}
                                    lastChange={lastChange}
                                    editing={this.state.editing}
                                    handleSelectCell={this.handleSelectCell}
                                    handleSort={handleSort}
                                    handleDoubleClickOnCell={this.handleDoubleClickOnCell}
                                    handleCellBlur={this.handleCellBlur}
                                    onCellValueChange={this.handleCellValueChange}
                                    spreadsheetId={this.spreadsheetId}
                                    idMapping={this.props.idMappings[i - 1]}
                                    sortColumn={this.state.sortColumn}
                                    isAscending={this.state.isAscending}
                                    className="cellComponent" />
            if (i === 0) {
                headerRow = row;
            } else {
                rows.push(row);
            }
        }

        if (this.state.sortColumn !== undefined) {
            var sortColumn = this.state.sortColumn;
            var isAscending = this.state.isAscending;
            rows.sort(function(rowA, rowB) {
                if (rowA.props.cells[sortColumn] <
                    rowB.props.cells[sortColumn]) {
                    return isAscending ? -1 : 1;
                } else if (rowA.props.cells[sortColumn] <
                    rowB.props.cells[sortColumn]) {
                    return isAscending ? 1 : -1;
                }
                return 0;
            });
        }

        return (
            <div className={"spreadsheet-holder"}>
                <button onClick={this.sendUpdate}>Save changes to database</button>
                <table tabIndex="0" data-spreadsheet-id={this.spreadsheetId}>
                    <tbody>
                        {headerRow}
                        {rows}
                    </tbody>
                </table>
            </div>
        );
    },

    /**
     * Binds the various keyboard events dispatched to table functions
     */
    bindKeyboard: function () {
        Dispatcher.setupKeyboardShortcuts($(ReactDOM.findDOMNode(this))[0], this.spreadsheetId);

        Dispatcher.subscribe('up_keyup', data => {
            this.navigateTable('up', data);
        }, this.spreadsheetId);
        Dispatcher.subscribe('down_keyup', data => {
            this.navigateTable('down', data);
        }, this.spreadsheetId);
        Dispatcher.subscribe('left_keyup', data => {
            this.navigateTable('left', data);
        }, this.spreadsheetId);
        Dispatcher.subscribe('right_keyup', data => {
            this.navigateTable('right', data);
        }, this.spreadsheetId);
        Dispatcher.subscribe('tab_keyup', data => {
            this.navigateTable('right', data, null, true);
        }, this.spreadsheetId);

        // Prevent brower's from jumping to URL bar
        Dispatcher.subscribe('tab_keydown', data => {
            if ($(document.activeElement) && $(document.activeElement)[0].tagName === 'INPUT') {
                if (data.preventDefault) {
                    data.preventDefault();
                } else {
                    // Oh, old IE, you 💩
                    data.returnValue = false;
                }
            }
        }, this.spreadsheetId);

        Dispatcher.subscribe('remove_keydown', data => {
            if (!$(data.target).is('input, textarea')) {
                if (data.preventDefault) {
                    data.preventDefault();
                } else {
                    // Oh, old IE, you 💩
                    data.returnValue = false;
                }
            }
        }, this.spreadsheetId);

        Dispatcher.subscribe('enter_keyup', () => {
            if (this.state.selectedElement) {
                this.setState({editing: !this.state.editing});
            }
            $(ReactDOM.findDOMNode(this)).first().focus();
        }, this.spreadsheetId);

        // Go into edit mode when the user starts typing on a field
        Dispatcher.subscribe('letter_keydown', () => {
            if (!this.state.editing && this.state.selectedElement) {
                Dispatcher.publish('editStarted', this.state.selectedElement, this.spreadsheetId);
                this.setState({editing: true});
            }
        }, this.spreadsheetId);

        // Delete on backspace and delete
        Dispatcher.subscribe('remove_keyup', () => {
            if (this.state.selected && !Helpers.equalCells(this.state.selected, this.state.lastBlurred)) {
                this.handleCellValueChange(this.state.selected, '');
            }
        }, this.spreadsheetId);
    },

    /**
     * Navigates the table and moves selection
     * @param  {string} direction                               [Direction ('up' || 'down' || 'left' || 'right')]
     * @param  {Array: [number: row, number: cell]} originCell  [Origin Cell]
     * @param  {boolean} inEdit                                 [Currently editing]
     */
    navigateTable: function (direction, data, originCell, inEdit) {
        // Only traverse the table if the user isn't editing a cell,
        // unless override is given
        if (!inEdit && this.state.editing) {
            return false;
        }

        // Use the curently active cell if one isn't passed
        if (!originCell) {
            originCell = this.state.selectedElement;
        }

        // Prevent default
        if (data.preventDefault) {
            data.preventDefault();
        } else {
            // Oh, old IE, you 💩
            data.returnValue = false;
        }

        var $origin = $(originCell),
            cellIndex = $origin.index(),
            target;

        if (direction === 'up') {
            target = $origin.closest('tr').prev().children().eq(cellIndex).find('span');
        } else if (direction === 'down') {
            target = $origin.closest('tr').next().children().eq(cellIndex).find('span');
        } else if (direction === 'left') {
            target = $origin.closest('td').prev().find('span');
        } else if (direction === 'right') {
            target = $origin.closest('td').next().find('span');
        }

        if (target.length > 0) {
            target.click();
        } else {
            this.extendTable(direction, originCell);
        }
    },

    /**
     * Extends the table with an additional row/column, if permitted by config
     * @param  {string} direction [Direction ('up' || 'down' || 'left' || 'right')]
     */
    extendTable: function (direction) {
        var config = this.props.config,
            data = this.props.data,
            newRow, i;

        if (direction === 'down' && config.canAddRow) {
            newRow = [];

            for (i = 0; i < this.props.data.rows[0].length; i = i + 1) {
                newRow[i] = '';
            }

            data.rows.push(newRow);
            Dispatcher.publish('rowCreated', data.rows.length, this.spreadsheetId);
            return this.setState({data: data});
        }

        if (direction === 'right' && config.canAddColumn) {
            for (i = 0; i < data.rows.length; i = i + 1) {
                data.rows[i].push('');
            }

            Dispatcher.publish('columnCreated', data.rows[0].length, this.spreadsheetId);
            return this.setState({data: data});
        }

    },

    /**
     * Callback for 'selectCell', updating the selected Cell
     * @param  {Array: [number: row, number: cell]} cell [Selected Cell]
     * @param  {object} cellElement [Selected Cell Element]
     */
    handleSelectCell: function (cell, cellElement) {
        Dispatcher.publish('cellSelected', cell, this.spreadsheetId);
        $(ReactDOM.findDOMNode(this)).first().focus();

        this.setState(function (prevState, props) {
            return {
                prevSelected: prevState.selected,
                selected: cell,
                selectedElement: cellElement
            };
        });
    },

    /**
     * Callback for 'cellValueChange', updating the cell data
     * @param  {Array: [number: row, number: cell]} cell [Selected Cell]
     * @param  {object} newValue                         [Value to set]
     */
    handleCellValueChange: function (cell, newValue) {
        console.log('handleCellValueChange, newValue: ' + newValue)
        var data = this.props.data,
            row = cell[0],
            column = cell[1],
            oldValue = data.rows[row][column];

        Dispatcher.publish('cellValueChanged', [cell, newValue, oldValue], this.spreadsheetId);

        if (newValue === undefined) {
            console.log("newValue is undefined")
        }
        data.rows[row][column] = newValue;
        var y = newValue;

        Dispatcher.publish('dataChanged', data, this.spreadsheetId);

        this.setState((prevState, props) => {
            var i = cell[0] - 1; // because of header row
            var j = cell[1];
            var metadata = props.mapping[`${i} ${j}`];

            var changesToApply = prevState.changesToApply;
            var lastChange = changesToApply[changesToApply.length - 1];
            var newState = {changesToApply: changesToApply};

            if (lastChange === undefined ||
                (metadata.table !== lastChange[0][0] ||
                    metadata.column !== lastChange[0][1] ||
                    metadata.id !== lastChange[0][2])) {
                newState.changesToApply.push([
                    [metadata.table, metadata.column, metadata.id, i, j],
                    y
                ]);
            } else {
                newState.changesToApply[newState.changesToApply.length - 1][1] = newValue
            }
            var newChanges = newState.changesToApply;
            var newLastChange = newChanges[newChanges.length - 1];

            var changeToApply = newLastChange[0];

            this.applyChange(
                data.rows,
                changeToApply,
                y,
                props.mapping
            )

            // newState.addedCellClasses = newAddedCellClasses;

            return newState;
        });
    },

    /**
     * Callback for 'doubleClickonCell', enabling 'edit' mode
     */
    handleDoubleClickOnCell: function () {
        this.setState({
            editing: true
        });
    },

    /**
     * Callback for 'cellBlur'
     */
    handleCellBlur: function (cell) {
        if (this.state.editing) {
            Dispatcher.publish('editStopped', this.state.selectedElement);
        }

        this.setState({
            editing: false,
            lastBlurred: cell
        });
    },

    // New methods for Paul's use here
    
    /**
     * Modifies the incoming array `rows`
     * @param  {Array: [Array: number]} rows
     * @param  (document later) changeToApply
     * @param  (document later) newValue
     * @param  (document later) mapping
     */
    applyChange: function (rows, changeToApply, newValue, mapping) {
        this.setState(function (prevState, props) {
            // Does two things: sets the new cell content, and adds the "dirty"
            // style to affected cells if not already present
            var prevAddedCellClasses = prevState.addedCellClasses;
            var newAddedCellClasses = new Array(prevAddedCellClasses.length);
            prevAddedCellClasses.forEach(function (rowClasses, i) {
                newAddedCellClasses[i] = rowClasses.slice();
            });
            var cellsToChange = props.mapping[
                `${changeToApply[3]} ${changeToApply[4]}`
            ].cells;
            cellsToChange.forEach(function (coords) {
                var iToChange = coords[0];
                var jToChange = coords[1];
                if (!(changeToApply[3] === iToChange+1 && changeToApply[4] === jToChange)) {
                    rows[iToChange+1][jToChange] = newValue;
                }

                var classes = newAddedCellClasses[iToChange+1][jToChange];
                if (!classes.includes('sp-dirty')) {
                    newAddedCellClasses[iToChange+1][jToChange].push(
                        'sp-dirty'
                    );
                }
            });

            return {addedCellClasses: newAddedCellClasses}
        });
    },

    /**
     * Sets sortColumn and isAscending
     */
    handleSort: function (columnIndex) {
        if (this.state.sortColumn === columnIndex) {
            this.setState(
                function (prevState, props) {
                    return {
                        isAscending: !prevState.isAscending
                    }
                }
            );
        } else {
            this.setState({
                sortColumn: columnIndex,
                isAscending: true,
            });
        }
    },

    /**
     * Mutates `classes` to remove "sp-dirty".
     *
     * TODO: Maybe make this return a copy so it's clearer.
     */
    removeDirtyClass: function (classes) {
        classes.forEach(function (rowClasses) {
            rowClasses.forEach(function (cellClasses) {
                var dirtyIndex = cellClasses.indexOf("sp-dirty");
                if (dirtyIndex !== undefined) {
                    cellClasses.splice(dirtyIndex, 1);
                }
            })
        });
    },

    afterDbUpdateSuccess: function (data, textStatus, jqXHR) {
        this.setState(function (prevState) {
            var addedCellClasses = prevState.addedCellClasses;
            this.removeDirtyClass(addedCellClasses);
            return {
                changesToApply: [],
                addedCellClasses: addedCellClasses
            };
        });
    },

    /**
     * Sends update
     */
    sendUpdate: function () {
        var updateConfig = this.props.config.update;
        if (updateConfig === undefined) {
            console.error("config prop must have an 'update' property");
            return;
        }

        var endpoint = updateConfig.endpoint;
        if (!endpoint) {
            console.error("Invalid endpoint: " + endpoint);
            return;
        }
        var success = updateConfig.success || function () {};
        var error = updateConfig.error || function () {};
        var complete = updateConfig.complete || function () {};

        $.ajax({
            url: endpoint,
            type: 'post',
            data: JSON.stringify(this.state.changesToApply),
            success: success,
            error: error,
            complete: [
                complete,
                // TODO move the below to `success`!
                this.afterDbUpdateSuccess.bind(this),
            ]
        })
    }
})

module.exports = SpreadsheetComponent;
