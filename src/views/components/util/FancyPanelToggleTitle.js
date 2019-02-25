import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  Panel
} from 'react-bootstrap';

import Flexbox from 'flexbox-react';
import FAIcon from 'src/views/components/util/FAIcon';

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
  static contextTypes = {
    $bs_panel: PropTypes.shape({
      headingId: PropTypes.string,
      bodyId: PropTypes.string,
      bsClass: PropTypes.string,
      expanded: PropTypes.bool
    })
  };

  constructor(...args) {
    super(...args);
    this.state = {
      enabled: false
    };
  }

  render() {
    const { 
      expanded
    } = this.context.$bs_panel;
    
    let {
      children,
      className,
      openIndicatorComponent,
      closedIndicatorComponent,
      compressed,
      ...otherProps
    } = this.props;

    const expandStateClass = expanded && 'panel-toggle-fancy-open' || 'panel-toggle-fancy-closed';
    className = 'panel-toggle-fancy no-margin no-padding ' + expandStateClass + ' ' + (className || '');

    let StatusIndicator;
    if (expanded) {
      StatusIndicator = openIndicatorComponent || OpenIndicatorDefault;
    }
    else {
      StatusIndicator = closedIndicatorComponent || ClosedIndicatorDefault;
    }

    let layoutProps;
    let justifyContent;
    if (!compressed) {
      justifyContent = 'space-between';
      layoutProps = { className: 'full-width' };
    }
    else {
      justifyContent = 'flex-start';
    }

    return (<Panel.Title className={className} {...otherProps} toggle>
      <Flexbox {...layoutProps} justifyContent={justifyContent} alignItems="center">
        <Flexbox {...layoutProps} alignItems="center">
          {children}
        </Flexbox>
        <Flexbox>
          <StatusIndicator expanded={expanded} />
        </Flexbox>
      </Flexbox>
    </Panel.Title>);
  }
}