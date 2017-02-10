"use strict";

var React = require('react');

var Dispatcher = require('./dispatcher');
var Helpers = require('./helpers');

var CellComponent = React.createClass({

    /**
     * React "getInitialState" method, setting whether or not
     * the cell is being edited and its changing value
     */
    getInitialState: function() {
        var value = Array.isArray(this.props.value.options) ? this.props.value.selected : this.props.value
        return {
            editing: this.props.editing,
            changedValue: value
        };
    },

    getDisplayValue: function() {
        var props = this.props;
        var config = props.config || { emptyValueSymbol: ''};
        if (props.value && Array.isArray(props.value.options)) {
            var selectedOption = props.value.options.find(
                opt => opt[0] === props.value.selected
            );
            return ((selectedOption !== undefined) ?
                selectedOption[1] : config.emptyValueSymbol);
        }
        return (props.value === '' || !props.value) ? config.emptyValueSymbol : props.value;
    },

    /**
     * React "render" method, rendering the individual cell
     */
    render: function() {
        var props = this.props,
            selected = (props.selected) ? 'selected' : '',
            displayValue = this.getDisplayValue(),
            cellClasses = ((props.cellClasses) ?
                props.cellClasses.concat([selected]) :
                [selected]);
        var cellContent;

        // Check if header - if yes, render it
        var header = this.renderHeader();
        if (header) {
            return header;
        }

        if (this.props.locked) {
            cellClasses.push('sp-locked');
        }

        // If not a header, check for editing and return
        if (props.selected && props.editing) {
            if (Array.isArray(this.props.value.options)) {
                // this.props.value should be an object with keys 'options' and
                // 'selected', where 'options' is an array of arrays [id, name]
                // and 'selected' is an id from the array 'options'.
                var options = this.props.value.options.map(option => (
                    <option value={option[0]} key={option[0]}>{option[1]}</option>
                ));
                cellContent = (
                    <select onChange={this.handleChange}
                        onBlur={this.handleBlur}
                        ref={input => this.input = input}
                        value={this.props.value.selected} >
                        {options}
                    </select>
                );
            } else {
                cellContent = (
                    <input className="mousetrap"
                        onChange={this.handleChange}
                        onBlur={this.handleBlur}
                        ref={input => this.input = input}
                        defaultValue={this.props.value} />
                )
            }
        }

        return (
            <td className={cellClasses.join(' ')} ref={props.uid.join('_')}>
                <div className="reactTableCell">
                    {cellContent}
                    <span onDoubleClick={this.handleDoubleClick} onClick={this.handleClick}>
                        {displayValue}
                    </span>
                </div>
            </td>
        );
    },

    /**
     * React "componentDidUpdate" method, ensuring correct input focus
     * @param  {React previous properties} prevProps
     * @param  {React previous state} prevState
     */
    componentDidUpdate: function(prevProps, prevState) {
        if (this.props.editing && this.props.selected) {
            var node = this.input;
            node.focus();
        }

        if (prevProps.selected && prevProps.editing && this.state.changedValue !== this.props.value) {
            this.props.onCellValueChange(this.props.uid, this.state.changedValue);
        }
    },

    /**
     * Click handler for individual cell, ensuring navigation and selection
     * @param  {event} e
     */
    handleClick: function (e) {
        var cellElement = this.input;
        this.props.handleSelectCell(this.props.uid, cellElement);
    },

    /**
     * Click handler for individual cell if the cell is a header cell
     * @param  {event} e
     */
    handleHeadClick: function (e) {
        this.props.handleSort();
        var cellElement = this.input;
        Dispatcher.publish('headCellClicked', cellElement, this.props.spreadsheetId);
    },

    /**
     * Double click handler for individual cell, ensuring navigation and selection
     * @param  {event} e
     */
    handleDoubleClick: function (e) {
        e.preventDefault();
        if (this.props.locked) {
            return;
        }
        this.props.handleDoubleClickOnCell(this.props.uid);
    },

    /**
     * Blur handler for individual cell
     * @param  {event} e
     */
    handleBlur: function (e) {
        var newValue = this.input.value;

        this.props.onCellValueChange(this.props.uid, newValue, e);
        this.props.handleCellBlur(this.props.uid);
        Dispatcher.publish('cellBlurred', this.props.uid, this.props.spreadsheetId);
    },

    /**
     * Change handler for an individual cell, propagating the value change
     * @param  {event} e
     */
    handleChange: function (e) {
        var newValue = this.input.value;

        this.setState({changedValue: newValue});
    },

    /**
     * Checks if a header exists - if it does, it returns a header object
     * @return {false|react} [Either false if it's not a header cell, a react object if it is]
     */
    renderHeader: function () {
        var props = this.props,
            selected = (props.selected) ? 'selected' : '',
            uid = props.uid,
            config = props.config || { emptyValueSymbol: ''},
            displayValue = (props.value === '' || !props.value) ? config.emptyValueSymbol : props.value;

        // Cases
        var headRow = (uid[0] === 0),
            headColumn = (uid[1] === 0),
            headRowAndEnabled = (config.hasHeadRow && uid[0] === 0),
            headColumnAndEnabled = (config.hasHeadColumn && uid[1] === 0)

        var cellClasses = ((props.cellClasses && props.cellClasses.length > 0) ?
            this.props.cellClasses.concat([selected]) :
            [selected]);
        if (headRow) {
            if (props.sortColumn === uid[1]) {
                cellClasses.push(props.isAscending ? 'sp-asc' : 'sp-desc');
            } else {
                cellClasses.push('sp-asc-desc');
            }

            if (props.locked) {
                cellClasses.push('sp-locked-head');
            }
        }

        // Head Row enabled, cell is in head row
        // Head Column enabled, cell is in head column
        if (headRowAndEnabled || headColumnAndEnabled) {
            if (headColumn && config.hasLetterNumberHeads) {
                displayValue = uid[0];
            } else if (headRow && config.hasLetterNumberHeads) {
                displayValue = Helpers.countWithLetters(uid[1]);
            }

            if ((config.isHeadRowString && headRow) || (config.isHeadColumnString && headColumn)) {
                return (
                    <th className={cellClasses.join(' ')} ref={this.props.uid.join('_')}>
                        <div>
                            <span onClick={this.handleHeadClick}>
                                {displayValue}
                            </span>
                        </div>
                    </th>
                );
            } else {
                return (
                    <th ref={this.props.uid.join('_')}>
                        {displayValue}
                    </th>
                );
            }
        } else {
            return false;
        }
    }
});

module.exports = CellComponent;
