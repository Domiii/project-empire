import React, { Component, PropTypes } from 'react';
import {
  Well
} from 'react-bootstrap';

export function getProgressColor(progressPct) {
  if (isNaN(progressPct)) {
    return '#DDD';
  }
  const progressColorHue = 90 * progressPct/100;
  return `hsl(${progressColorHue}, 100%, 40%)`;
}


// TODO: Make use of react-bootstrap's ProgressBar?

export default class ProgressBar extends Component {
  static propTypes = {
    progressPct: PropTypes.number.isRequired
  };

  render() {
    const { progressPct } = this.props;

    const progressColor = getProgressColor(progressPct);

    return (
      <Well className="no-padding"
        style={{ position: 'relative', textAlign: 'center', verticalAlign: 'middle'}}>
        <div
          style={{
            position:'absolute', left: 0, top: 0, bottom: 0,
            width: '100%',
            backgroundColor: '#555'}}>
        </div>
        <div
          style={{
            position:'absolute', left: 0, top: 0, bottom: 0,
            width: progressPct + '%',
            backgroundColor: progressColor}}>
        </div>

        <div
          style={{
            position:'absolute', left: 0, top: 0, bottom: 0,
            color: 'white',
            width: '100%'}}>
              <span>{ !isNaN(progressPct) && (progressPct + '%') || '' }</span>
        </div>
        </Well>
    );
  }
}