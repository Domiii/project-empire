import React, { Component, Fragment as F } from 'react';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Panel, Well, Alert
} from 'react-bootstrap';

import { hrefPresentationSession } from '../../href';
import styled from 'styled-components';


const Wrapper = styled(Well)`
margin: auto;
text-align: center;
background-color: transparent;
`;

const Title = styled.h2`
white-space: nowrap;
text-overflow: ellipsis;
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
        <Wrapper>
          <Title className="no-margin color-darkblue">
            Live Session 📹🎤
          </Title>
        </Wrapper>
      </F>);
    }

    return <span />;
  }
}