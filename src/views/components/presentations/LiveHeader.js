import React, { Component, Fragment as F } from 'react';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Panel, Well, Alert
} from 'react-bootstrap';

import { hrefPresentationSession } from '../../href';
import styled from 'styled-components';


const LiveTitle = styled(Well) `
margin: auto;
text-align: center;
background-color: transparent;
`;


function getSelectedId() {
  return window.location.hash && window.location.hash.substring(1);
}

@dataBind()
export default class LiveHeader extends Component {
  render(
    { },
    { },
    { livePresentationSessionId }
  ) {
    if (livePresentationSessionId) {
      return (<F>
        <LiveTitle>
          <h2 className="no-margin color-darkblue">
            Live session in progress 📹🎤
        </h2>
        </LiveTitle>
      </F>);
    }
    
    return <span />;
  }
}