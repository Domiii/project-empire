import React, { Component, PropTypes } from 'react';
import { 
  Grid, Row, Col
} from 'react-bootstrap';

const EmptyObject = {};

export default class SimpleGrid extends Component {
  static propTypes = {
    objects: PropTypes.object.isRequired,   // an object containing a bunch of objects to display
    nCols: PropTypes.number.isRequired,
    objectComponentCreator: PropTypes.func.isRequired,
    colProps: PropTypes.object,
    rowProps: PropTypes.object,
    keyOrder: PropTypes.any     // optional argument for sorting objects before rendering (using _.sortBy)
  };

  render() {
    const { nCols, objectComponentCreator, rowProps, colProps, keyOrder } = this.props;
    let { objects } = this.props;
    let keys = Object.keys(objects);
    const nChildren = keys.length;
    console.assert(nCols > 0, 'nCols passed to SimpleGrid is invalid: ' + nCols);
    const colSize = 12/nCols;
    console.assert(colSize === Math.round(colSize), 'nCols must be divisible by 12 (because of Bootstrap\'s grid system): ' + nCols);
    console.assert(!isNaN(nChildren), 'objects passed to SimpleGrid are invalid: ' + objects);
    const nRows = Math.ceil(nChildren / nCols);
    console.assert(nRows >= 0);

    // sort objects
    if (!!keyOrder) {
      keys = _.sortBy(keys, keyOrder);
    }

    // create rows
    const rows = [];
    let iItem = 0;
    const rowPropsNotEmpty = rowProps || EmptyObject;
    const colPropsNotEmpty = colProps || EmptyObject;
    for (let iRow = 0; iRow < nRows; ++iRow) {
      const columns = [];
      for (let iCol = 0; iCol < nCols && iItem < nChildren; ++iCol) {
        const key = keys[iItem++];
        const value = objects[key];
        //console.assert(key && value, `invalid object: #${iItem} ${key}=${value}`);
        const el = objectComponentCreator(key, value);
        const col = (<Col key={iCol} xs={colSize} {...colPropsNotEmpty}>{el}</Col>);
        columns.push(col);
      }
      const row = (<Row key={iRow} {...rowPropsNotEmpty}>{columns}</Row>);
      rows.push(row);
    }

    // render the whole thing
    return (
      <Grid fluid>
        {rows}
      </Grid>
    );
  }
}