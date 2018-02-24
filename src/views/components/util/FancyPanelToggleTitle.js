import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  Panel
} from 'react-bootstrap';

import Flexbox from 'flexbox-react';
import { FAIcon } from 'src/views/components/util';

function OpenIndicatorDefault() {
  return (
    <FAIcon name="angle-down" />
  );
}
function ClosedIndicatorDefault() {
  return (
    <FAIcon name="angle-right" />
  );
}

export default class FancyPanelToggleTitle extends Panel {
  constructor(...args) {
    super(...args);
    this.state = {
      enabled: false
    };
  }

  render() {
    const { expanded } = this.context.$bs_panel || {};
    let {
      children,
      className,
      openIndicatorComponent,
      closedIndicatorComponent,
      ...otherProps
    } = this.props;

    const expandStateClass = expanded && 'panel-toggle-fancy-open' || 'panel-toggle-fancy-closed';
    className = 'panel-toggle-fancy ' + expandStateClass + ' ' + (className || '');

    let StatusIndicator;
    if (expanded) {
      StatusIndicator = openIndicatorComponent || OpenIndicatorDefault;
    }
    else {
      StatusIndicator = closedIndicatorComponent || ClosedIndicatorDefault;
    }

    return (<Panel.Toggle className={className} {...otherProps}>
      <Flexbox justifyContent="space-between" alignItems="center">
        <Flexbox>
          <Panel.Title className="no-margin no-padding">
            {children}
          </Panel.Title>
        </Flexbox>
        <Flexbox>
          <StatusIndicator expanded={expanded} />
        </Flexbox>
      </Flexbox>
    </Panel.Toggle>);
  }
}